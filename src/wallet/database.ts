import * as Docs from './docs';
import * as hi from 'hookedin-lib';
import * as util from '../util';
import * as idb from 'idb';

import * as bip39 from '../bip39';

import makeClaim from './requests/make-claim';
import genInvoice from './requests/gen-invoice';

import fetchBitcoinReceives, { BitcoinReceiveInfo } from './requests/bitcoin-receives';
import EventEmitter from './event-emitter';
import * as coinselection from './coin-selection';

import getCustodianInfo from './requests/get-custodian-info';

import Config from './config';
import Schema, { schemaPOD, StoreName } from './schema';
import * as dbInfo from './database-info';

import getStatusesByClaimable from './requests/get-statuses-by-claimable';
import addClaimable from './requests/add-claimable';

import Claimed from 'hookedin-lib/dist/status/claimed';

let currentVersion = 4;

export default class Database extends EventEmitter {
  db: idb.IDBPDatabase<Schema>;
  config: Config; // if not set, wallet is locked.
  bestEventId?: number;
  pollId: any; // number? can't type this for now

  constructor(db: idb.IDBPDatabase<Schema>, config: Config) {
    super();
    this.db = db;
    this.config = config;

    this.pollForEvents(); // fire off immediately
    this.pollId = setInterval(() => this.pollForEvents(), 5000);
  }

  private async pollForEvents() {
    let cursor = await this.db.transaction('events', 'readonly').store.openCursor(undefined, 'prev');
    const newEventId = cursor ? cursor.key : -1;

    if (this.bestEventId === undefined) {
      // This was the first poll
      this.bestEventId = newEventId;
      return;
    }

    const eventsToEmit = [];
    while (cursor && cursor.key > this.bestEventId) {
      const eventName = cursor.value.name;
      eventsToEmit.push(eventName);
      cursor = await cursor.continue();
    }
    this.bestEventId = newEventId;

    for (let i = eventsToEmit.length - 1; i >= 0; i--) {
      const eventName = eventsToEmit[i];
      super.emit(eventName);
    }
  }

  emit(name: string) {
    return this.db.put('events', { name });
  }
  emitInTransaction<S extends StoreName>(name: string, transaction: idb.IDBPTransaction<Schema, (S | 'events')[]>) {
    return transaction.objectStore('events').put({ name });
  }

  private async createCounter<S extends StoreName, Stringable extends { toPOD(): string }>(
    purpose: string,
    index: number,
    value: Stringable,
    transaction: idb.IDBPTransaction<Schema, (S | 'counters')[]>
  ) {
    await transaction.objectStore('counters').put({
      purpose,
      index,
      value: value.toPOD(),
      created: new Date(),
    });

    return value;
  }

  private async nextCounter<S extends StoreName, Stringable extends { toPOD(): string }>(
    purpose: string,
    transform: (i: number) => Stringable,
    transaction: idb.IDBPTransaction<Schema, (S | 'counters')[]>
  ) {
    const cursor = await transaction
      .objectStore('counters')
      .index('by-purpose-index')
      .openCursor(IDBKeyRange.bound([purpose, 0], [purpose, Number.MAX_SAFE_INTEGER], false), 'prev');

    let index = 0;
    if (cursor) {
      index = cursor.key[1] + 1;
    }
    const value = transform(index);
    return this.createCounter(purpose, index, value, transaction);
  }

  public static async open(name: string, password: string) {
    // upgrade stuff will go here....
    const db = await idb.openDB<Schema>(name, currentVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log('upgrade called: ', 'db version: ', db.version, ' oldVersion ', oldVersion, ' new version ', newVersion);

        if (oldVersion < 4) {
          transaction.objectStore('bitcoinAddresses').createIndex('by-claimant', 'claimant');
        }
      },
    });

    console.log('db version is: ', db.version);

    const configDoc = await db.get('config', 1);
    if (!configDoc) {
      return 'NO_SUCH_DB';
    }

    const config = await Config.fromDoc(configDoc, password);
    if (config === 'INVALID_PASSWORD') {
      return config;
    }

    return new Database(db, config);
  }

  public static async create(name: string, custodianUrl: string, password: string): Promise<Database | Error> {
    const custodian = await getCustodianInfo(custodianUrl);
    if (custodian instanceof Error) {
      return custodian;
    }

    const mnemonic = bip39.generateMnemonic();

    const gapLimit = 10; // default

    // If the custodianUrl has a # for verification, we want to strip it now
    const n = custodianUrl.indexOf('#');
    if (n !== -1) {
      custodianUrl = custodianUrl.substring(0, n);
    }

    const config = await Config.fromData(mnemonic, gapLimit, custodianUrl, custodian, password);

    if (config instanceof Error) {
      return config;
    }

    // new db
    const res = await idb.openDB<Schema>(name, currentVersion, {
      upgrade(database, oldVersion, newVersion, transaction) {
        const db = database as idb.IDBPDatabase<unknown>;
        for (const { store, keyPath, autoIncrement, indexes } of schemaPOD) {
          const objectStore = db.createObjectStore(store, { autoIncrement, keyPath });

          for (const index of indexes) {
            objectStore.createIndex(index.name, index.keyPath, index.params);
          }
        }
      },
    });

    await res.add('config', config.toDoc());
    await dbInfo.add(name);

    return new Database(res, config);
  }
  // <S extends StoreName>(name: string, transaction: idb.IDBPTransaction<Schema, (S | 'events')[]>) {

  //private async processClaimResponse

  private async processClaimResponseT<S extends StoreName>(
    status: hi.Acknowledged.Status,
    transaction: idb.IDBPTransaction<Schema, (S | 'coins' | 'events')[]>
  ) {
    console.log('pcr called', status);
    const claimedStatus = status.contents;
    if (!(claimedStatus instanceof Claimed)) {
      throw new Error('assertion failure: processClaimReponse expected a StatusClaimed');
    }

    const { claimableHash, claimRequest, blindedReceipts } = claimedStatus;
    const { coinRequests } = claimRequest;

    util.mustEqual(coinRequests.length, blindedReceipts.length);

    // basically just adds the appropriate coins, and adds the claim
    const coinStore = transaction.objectStore('coins');

    for (let i = 0; i < coinRequests.length; i++) {
      const coinClaim = coinRequests[i];
      const blindedExistenceProof = blindedReceipts[i];

      const blindingSecret = this.config.deriveBlindingSecret(claimableHash, coinClaim.blindingNonce);
      const newOwner = this.config.deriveOwner(claimableHash, coinClaim.blindingNonce).toPublicKey();

      const signer = this.config.custodian.blindCoinKeys[coinClaim.magnitude.n];

      const [unblinder, blindedOwner] = hi.blindMessage(blindingSecret, coinClaim.blindingNonce, signer, newOwner.buffer);

      util.mustEqual(blindedOwner.toPOD(), coinClaim.blindedOwner.toPOD());

      const existenceProof = hi.unblind(unblinder, blindedExistenceProof);

      util.mustEqual(existenceProof.verify(newOwner.buffer, signer), true);

      const coin = new hi.Coin(newOwner, coinClaim.magnitude, existenceProof);

      coinStore.put({
        hash: coin.hash().toPOD(),
        claimableHash: claimableHash.toPOD(),
        blindingNonce: coinClaim.blindingNonce.toPOD(),
        ...coin.toPOD(),
      });
    }
    this.emitInTransaction('table:coins', transaction);
  }

  public async discardClaimable(hash: string) {
    await this.db.delete('claimables', hash);
    this.emit('table:claimables');
  }

  public async claimClaimable(ackdClaimable: hi.Acknowledged.Claimable) {
    const claimable = ackdClaimable.contents;

    const transaction = this.db.transaction(['coins', 'counters', 'claimables', 'events', 'statuses'], 'readwrite');

    const statusDocs = await transaction
      .objectStore('statuses')
      .index('by-claimable-hash')
      .getAll(claimable.hash().toPOD());

    const statuses = statusDocs.map(s => util.notError(hi.statusFromPOD(s)));

    let claimant;

    if (claimable instanceof hi.AbstractTransfer) {
      const owners: hi.PrivateKey[] = [];

      for (const coin of claimable.inputs) {
        const coinDoc = util.mustExist(await transaction.objectStore('coins').get(coin.hash().toPOD()));
        const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimableHash));
        const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
        owners.push(this.config.deriveOwner(claimHash, blindingNonce));
      }

      claimant = hi.PrivateKey.combine(owners);
    } else {
      const counter = await transaction
        .objectStore('counters')
        .index('by-value')
        .get(claimable.claimant.toPOD());

      if (!counter) {
        throw new Error('coult not find counter for ' + claimable.toPOD());
      }

      claimant = this.deriveClaimableClaimant(counter.index, counter.purpose);
    }

    if (claimant.toPublicKey().toPOD() !== claimable.claimant.toPOD()) {
      throw new Error(`Expected derived claimant is ${claimable.claimant.toPOD()} but got ${claimant.toPublicKey().toPOD()}`);
    }

    const amountToClaim = hi.computeClaimableRemaining(claimable, statuses);
    if (amountToClaim > 0) {
      const magnitudes = hi.amountToMagnitudes(amountToClaim);

      const claimResponse = await makeClaim(this.config, claimant, claimable, magnitudes);

      await this.processStatuses([claimResponse]);
    }
  }

  public async requestStatuses(claimableHash: string) {
    const statuses = await getStatusesByClaimable(this.config, claimableHash);
    console.log('got statuses: ', statuses);
    if (statuses.length > 0) {
      await this.processStatuses(statuses);
    }
  }

  private async processStatuses(statuses: hi.Acknowledged.Status[]) {
    const transaction = this.db.transaction(['coins', 'statuses', 'events'], 'readwrite');

    let newStatus = false;

    for (const status of statuses) {
      const statusDoc: Docs.Status = {
        hash: status.hash().toPOD(),
        created: new Date(),
        ...status.toPOD(),
      };

      const exists = await transaction.objectStore('statuses').getKey(statusDoc.hash);
      if (exists) {
        console.log('Status: ', statusDoc, ' already exists');
      } else {
        newStatus = true;
        await transaction.objectStore('statuses').add(statusDoc);
        if (status.contents instanceof Claimed) {
          await this.processClaimResponseT(status, transaction); // TODO: same transaction...
        } else {
          console.log('status not claimed', status);
        }
      }
    }

    if (newStatus) {
      await this.emitInTransaction('table:statuses', transaction);
    }

    await transaction.done;
  }

  public async requestLightningInvoice(memo: string, amount: number) {
    const counterTransaction = this.db.transaction(['counters'], 'readwrite');

    const purpose = 'lightningInvoice';

    let claimant = await this.nextCounter(purpose, index => this.deriveClaimableClaimant(index, purpose).toPublicKey(), counterTransaction);

    const invoice = await genInvoice(this.config, claimant, memo, amount);
    const invoiceDoc = {
      hash: invoice.hash().toPOD(),
      created: new Date(),
      ...invoice.toPOD(),
    };

    const transaction = this.db.transaction(['counters', 'claimables', 'events'], 'readwrite');

    await transaction.objectStore('claimables').add(invoiceDoc);
    await this.emitInTransaction('table:claimables', transaction);

    await transaction.done;

    return invoiceDoc;
  }

  public async reset() {
    for (const store of this.db.objectStoreNames) {
      if (store === 'config') {
        console.log('skipping clearing table: ', store);
        continue;
      }
      console.log('clearing store: ', store);
      await this.db.clear(store);
    }
  }

  public async listUnspent(): Promise<Docs.Coin[]> {
    const transaction = this.db.transaction(['coins', 'claimables'], 'readonly');
    return this.listUnspentT(transaction);
  }

  // transaction must have read access to transfers and coins
  private async listUnspentT<S extends StoreName>(transaction: idb.IDBPTransaction<Schema, (S | 'coins' | 'claimables')[]>): Promise<Docs.Coin[]> {
    const spentCoinHashes: Set<string> = new Set();

    let transfersCursor = await transaction.objectStore('claimables').openCursor();
    while (transfersCursor) {
      const transfer = transfersCursor.value;

      if (transfer.kind === 'FeeBump' || transfer.kind === 'Hookout' || transfer.kind === 'LightningPayment') {
        for (const input of transfer.inputs) {
          spentCoinHashes.add(input.hash);
        }
      }

      transfersCursor = await transfersCursor.continue();
    }

    const coins = [];
    let coinsCursor = await transaction.objectStore('coins').openCursor();
    while (coinsCursor) {
      const coin = coinsCursor.value;

      // Only push if it hasn't been spent...
      if (!spentCoinHashes.has(coin.hash)) {
        coins.push(coin);
      }

      coinsCursor = await coinsCursor.continue();
    }

    return coins;
  }

  public async getBalance() {
    const coins = await this.listUnspent();

    let sum = 0;
    for (const coin of coins) {
      sum += 2 ** coin.magnitude;
    }

    return sum;
  }

  public async syncBitcoinAddresses() {

    let gapCount = 0;

    for (let index = 0; gapCount < this.config.gapLimit ; index++) {
      
      const transaction = this.db.transaction(['counters', 'events', 'bitcoinAddresses', 'claimables'], 'readwrite');
      const bitcoinAddressDoc = await this.getOrAddBitcoinAddressByIndex(index, transaction);
      console.log('[sync:bitcoin-address] checking address: ', bitcoinAddressDoc.address, ' index ', index);

      const found = await this.checkBitcoinAddress(bitcoinAddressDoc);

      console.log('[sync:bitcoin-address] for address: ', bitcoinAddressDoc.address, ' we found something? ', found);

      gapCount = found ? 0 : gapCount + 1;
    }

  }

  public async sync() {
    await this.syncBitcoinAddresses();
    // await this.syncHookins();

    // TODO: find coins that are funded...
  }

  // async syncHookins() {
  //   const transaction = this.db.transaction(['claimResponses', 'hookins'], 'readonly');

  //   const allClaimed = new Set<string>();

  //   for (const claim of await transaction.objectStore('claimResponses').getAll()) {
  //     allClaimed.add(claim.claimRequest.claimHash);
  //   }

  //   const unclaimedHookins: Docs.Hookin[] = [];
  //   for (const hookin of await transaction.objectStore('hookins').getAll()) {
  //     if (!allClaimed.has(hookin.hash)) {
  //       unclaimedHookins.push(hookin);
  //     }
  //   }

  //   console.log('Claiming: ', unclaimedHookins.length, ' hookins');

  //   for (const hookin of unclaimedHookins) {
  //     await this.claimHookin(hookin);
  //   }
  // }

  // this makes no network requests..
  private async getLastUsedBitcoinAddresses<S extends StoreName>(
    transaction: idb.IDBPTransaction<Schema, (S | 'claimables' | 'counters')[]>
  ): Promise<([string, number]) | undefined> {
    let cursor = await transaction
      .objectStore('counters')
      .index('by-purpose-index')
      .openCursor(IDBKeyRange.bound(['bitcoinAddress', 0], ['bitcoinAddress', Number.MAX_SAFE_INTEGER], false), 'prev');

    while (cursor) {
      const index = cursor.key[1];
      const claimant = cursor.value.value;

      const claimantPub = util.notError(hi.PublicKey.fromPOD(claimant));
      const bitcoinAdress = this.deriveBitcoinAddressFromClaimant(claimantPub);

      console.log('checking if address: ', { bitcoinAdress, index }, ' is used');

      // Check if it's used...
      const k = await transaction
        .objectStore('claimables')
        .index('by-bitcoin-address')
        .getKey(bitcoinAdress);
      if (k) {
        return [bitcoinAdress, index];
      }

      cursor = await cursor.continue();
    }

    // couldn't find any used address:
    return undefined;
  }

  async getUnusedBitcoinAddress(): Promise<Docs.BitcoinAddress> {
    const transaction = this.db.transaction(['counters', 'events', 'bitcoinAddresses', 'claimables'], 'readwrite');

    const lastUsedUsedAddress = await this.getLastUsedBitcoinAddresses(transaction);
    let index = lastUsedUsedAddress ? lastUsedUsedAddress[1] + 1 : 0;

    return this.getOrAddBitcoinAddressByIndex(index, transaction);
    // Should we first wait for transaction.done ?
  }

  private async getOrAddBitcoinAddressByClaimant<S extends StoreName>(
    claimant: string,
    transaction: idb.IDBPTransaction<Schema, (S | 'events' | 'bitcoinAddresses')[]>
  ): Promise<Docs.BitcoinAddress> {
    const bitcoinAddress = await transaction
      .objectStore('bitcoinAddresses')
      .index('by-claimant')
      .get(claimant);
    if (bitcoinAddress) {
      return bitcoinAddress;
    }

    const pub = util.notError(hi.PublicKey.fromPOD(claimant));

    const bitcoinAddressDoc: Docs.BitcoinAddress = {
      address: this.deriveBitcoinAddressFromClaimant(pub),
      claimant: claimant,
      created: new Date(),
    };

    await transaction.objectStore('bitcoinAddresses').add(bitcoinAddressDoc);

    this.emitInTransaction('table:bitcoinAddresses', transaction);

    return bitcoinAddressDoc;
  }

  private async getOrAddBitcoinAddressByIndex<S extends StoreName>(
    index: number,
    transaction: idb.IDBPTransaction<Schema, (S | 'counters' | 'events' | 'bitcoinAddresses')[]>
  ): Promise<Docs.BitcoinAddress> {
    const counter = await transaction
      .objectStore('counters')
      .index('by-purpose-index')
      .get(['bitcoinAddress', index]);
    if (counter) {
      const claimant = counter.value;
      return this.getOrAddBitcoinAddressByClaimant(claimant, transaction);
    }

    const purpose = 'bitcoinAddress';
    const claimant = this.deriveClaimableClaimant(index, purpose).toPublicKey();
    await this.createCounter(purpose, index, claimant, transaction);
    return this.getOrAddBitcoinAddressByClaimant(claimant.toPOD(), transaction);
  }

  // return if used or not
  public async checkBitcoinAddress(bitcoinAddressDoc: Docs.BitcoinAddress): Promise<boolean> {
    const receives = await fetchBitcoinReceives(bitcoinAddressDoc.address);

    await this.addHookins(bitcoinAddressDoc, receives);

    return receives.length > 0;
  }

  public async addHookins(bitcoinAddressDoc: Docs.BitcoinAddress, receives: BitcoinReceiveInfo[]) {
    const transaction = this.db.transaction(['claimables', 'events'], 'readwrite');

    const toAck: hi.Hookin[] = [];
    let toEmit = false;

    for (const receive of receives) {
      const claimant = util.notError(hi.PublicKey.fromPOD(bitcoinAddressDoc.claimant));

      if (this.deriveBitcoinAddressFromClaimant(claimant) !== bitcoinAddressDoc.address) {
        throw new Error('assertion failed: derived wrong bitcoin address');
      }

      let hookin = new hi.Hookin(receive.txid, receive.vout, receive.amount, claimant, bitcoinAddressDoc.address);

      let hookinDoc = await transaction.objectStore('claimables').get(hookin.hash().toPOD());

      if (!hookinDoc) {
        hookinDoc = {
          ...hi.claimableToPOD(hookin),
          created: new Date(),
        };
        await transaction.objectStore('claimables').add(hookinDoc);
        toEmit = true;
      }

      if (!hookinDoc.acknowledgement) {
        toAck.push(hookin);
        toEmit = true;
      }
    }

    if (toEmit) {
      await this.emitInTransaction('table:claimables', transaction);
    }

    await transaction.done;

    for (const hookin of toAck) {
      await this.acknowledgeClaimable(hookin);
    }
  }

  // makes network req
  async acknowledgeClaimable(claimable: hi.Claimable): Promise<void> {
    const ackd = await addClaimable(this.config, claimable);
    if (ackd instanceof Error) {
      throw ackd;
    }

    await this.db.put('claimables', {
      ...ackd.toPOD(),
      created: new Date(),
    });
    await this.emit('table:claimables');

    // TODO: now claim
    await this.claimClaimable(ackd);
  }

  public async sendLightningPayment(paymentRequest: string, amount: number, fee: number) {
    return this.sendAbstractTransfer((inputs: hi.Coin[]) => new hi.LightningPayment({ inputs, amount, fee }, paymentRequest), amount + fee);
  }

  public async sendHookout(bitcoinAddress: string, amount: number, fee: number) {
    const priority = 'IMMEDIATE'; // TODO: ..

    return this.sendAbstractTransfer((inputs: hi.Coin[]) => new hi.Hookout({ inputs, amount, fee }, bitcoinAddress, priority), amount + fee);
  }

  private async sendAbstractTransfer(
    cstr: (inputs: hi.Coin[]) => hi.LightningPayment | hi.Hookout,
    totalToSend: number
  ): Promise<'NOT_ENOUGH_FUNDS' | hi.Hash> {
    const transaction = this.db.transaction(['events', 'coins', 'claimables'], 'readwrite');

    const unspent = await this.listUnspentT(transaction);

    const coinsToUse = coinselection.findAtLeast(unspent, totalToSend);
    if (!coinsToUse) {
      return 'NOT_ENOUGH_FUNDS';
    }

    const inputs = coinsToUse.found.map(coin => util.notError(hi.Coin.fromPOD(coin)));
    hi.AbstractTransfer.sort(inputs);

    // const inputHash = hi.Hash.fromMessage('inputHash', ...inputs.map(i => i.buffer));
    // const change = this.deriveClaimableClaimant(inputHash).toPublicKey();

    const abtransfer = cstr(inputs);

    const owners: hi.PrivateKey[] = [];

    for (const coin of inputs) {
      const coinDoc = util.mustExist(await transaction.objectStore('coins').get(coin.hash().toPOD()));
      const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimableHash));
      const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
      owners.push(this.config.deriveOwner(claimHash, blindingNonce));
    }

    abtransfer.authorize(hi.PrivateKey.combine(owners));

    const claimableDoc: Docs.Claimable = {
      ...hi.claimableToPOD(abtransfer),
      created: new Date(),
    };

    await transaction.objectStore('claimables').put(claimableDoc);
    await this.emitInTransaction('table:claimables', transaction);
    await transaction.done;

    await this.acknowledgeClaimable(abtransfer);

    return abtransfer.hash();
  }

  // public deriveBitcoinAddress(n: number) {
  //   const claimant = this.config.bitcoinAddressGenerator().derive(n);
  //   const claimantPub = claimant.toPublicKey();

  //   const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
  //   const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

  //   const tweakPubkey = tweak.toPublicKey();

  //   const pubkey = this.config.custodian.fundingKey.tweak(tweakPubkey);

  //   return { claimant, bitcoinAddress: pubkey.toBitcoinAddress() };
  // }

  public deriveBitcoinAddressFromClaimant(claimantPub: hi.PublicKey) {
    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = this.config.custodian.fundingKey.tweak(tweakPubkey);

    return pubkey.toBitcoinAddress();
  }

  public deriveClaimableClaimant(index: number, purpose: string): hi.PrivateKey {
    return this.config
      .claimantGenerator()
      .derive(hi.Buffutils.fromString(purpose))
      .derive(index);
  }
}

async function retAwait<T>(t: Promise<T>, p: Promise<void>) {
  const tmp = await t;
  await p;
  return tmp;
}

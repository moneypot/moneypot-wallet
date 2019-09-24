import * as Docs from './docs';
import * as hi from 'hookedin-lib';
import * as util from '../util';
import * as idb from 'idb';

import * as bip39 from '../bip39';

import makeClaim from './requests/make-claim';
import addInvoice from './requests/add-invoice';

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

    // this.db.on('changes', changes => {
    //   for (const change of changes) {
    //     console.log('Got db change: ', change);

    //     this.emit(`table:${change.table}`);
    //     this.emit(`key:${change.key}`);

    //     const obj = change.type === DatabaseChangeType.Delete ? (change as any).oldObj : (change as any).obj;

    //     if (change.table === 'bounties') {
    //       this.emit(`bounties.claimant:${obj.claimant}`);
    //     }

    //     if (change.table === 'hookins') {
    //       this.emit(`hookins.bitcoinAddress:${obj.bitcoinAddress}`);
    //     }

    //     if (change.table === 'transfers') {
    //       for (const hash of obj.inputOutputHashes) {
    //         this.emit(`transfers.inputOutputHashes:${hash}`);
    //       }
    //     }
    //   }
    // });
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

  async nextCounter<S extends StoreName, Stringable extends { toPOD(): string }>(
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

    await transaction.objectStore('counters').put({
      purpose,
      index,
      value: value.toPOD(),
      created: new Date(),
    });

    return value;
  }

  public static async open(name: string, password: string) {
    // upgrade stuff will go here....
    const db = await idb.openDB<Schema>(name, 1);

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
    const res = await idb.openDB<Schema>(name, 1, {
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

  public async claimClaimable(claimable: hi.Claimable) {
    console.trace('claiming claimable: ', claimable.toPOD());
    const transaction = this.db.transaction(['counters', 'claimables', 'events', 'statuses'], 'readwrite');

    const statusDocs = await transaction
      .objectStore('statuses')
      .index('by-claimable-hash')
      .getAll(claimable.hash().toPOD());

    const statuses = statusDocs.map(s => util.notError(hi.statusFromPOD(s)));

    let claimant;
    if (claimable instanceof hi.Hookin) {
      const bitcoinAddressCounter = util.mustExist(
        await transaction
          .objectStore('counters')
          .index('by-value')
          .get(claimable.claimant.toPOD())
      );
      claimant = this.deriveBitcoinAddressClaimant(bitcoinAddressCounter.index);
    } else {
      claimant = this.deriveClaimableClaimant(claimable.hash());
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
    const transaction = this.db.transaction(['counters', 'claimables', 'events'], 'readwrite');

    let claimant = await this.nextCounter('lightningInvoiceClaimant', index => this.deriveLightningInvoiceClaimant(index).toPublicKey(), transaction);

    const invoice = await addInvoice(this.config, claimant, memo, amount);
    const invoiceDoc = {
      hash: invoice.hash().toPOD(),
      created: new Date(),
      ...invoice.toPOD(),
    };

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
    // let gapCount = 0;
    // const addresses = await this.db.getAllFromIndex('bitcoinAddresses', 'by-index');
    // for (const address of addresses) {
    //   const used = await this.checkBitcoinAddress(address);
    //   gapCount = used ? 0 : gapCount + 1;
    // }
    // let lastAddressIndex = addresses.length > 0 ? addresses[addresses.length - 1].index : -1;
    // for (let checkIndex = lastAddressIndex + 1; gapCount < this.config.gapLimit; checkIndex++) {
    //   const { bitcoinAddress } = this.deriveBitcoinAddress(checkIndex);
    //   console.log('prechecking: ', bitcoinAddress);
    //   const receives = await fetchBitcoinReceives(bitcoinAddress);
    //   if (receives.length > 0) {
    //     console.log('found: ', bitcoinAddress, ' has some hookins: ', receives.length);
    //     // Add all missing addresses...
    //     const transaction = this.db.transaction(['bitcoinAddresses', 'events'], 'readwrite');
    //     for (let addIndex = checkIndex - 1; addIndex > lastAddressIndex; addIndex--) {
    //       console.log('adding skipped bitcoin address: ', addIndex);
    //       await this.addBitcoinAddress(transaction, addIndex);
    //     }
    //     const bitcoinAddressDoc = await this.addBitcoinAddress(transaction, checkIndex);
    //     await this.addHookins(bitcoinAddressDoc, receives);
    //     lastAddressIndex = checkIndex;
    //     gapCount = 0;
    //   } else {
    //     gapCount++;
    //   }
    // }
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

  async getUnusedBitcoinAddress(): Promise<Docs.BitcoinAddress> {
    const transaction = this.db.transaction(['counters', 'events', 'bitcoinAddresses', 'claimables'], 'readwrite');

    const cursor = await transaction
      .objectStore('bitcoinAddresses')
      .index('by-created')
      .openCursor(undefined, 'prev');

    if (!cursor) {
      const address = await this.addBitcoinAddress(transaction);
      await transaction.done;
      return address;
    }

    const bitcoinAddress = cursor.value;

    const hookinCursor = await transaction
      .objectStore('claimables')
      .index('by-bitcoin-address')
      .openKeyCursor(bitcoinAddress.address);

    if (!hookinCursor) {
      // hasn't been used...
      return bitcoinAddress;
    } else {
      const address = await this.addBitcoinAddress(transaction);
      await transaction.done;
      return address;
    }
  }

  // public async newBitcoinAddress(): Promise<Docs.BitcoinAddress> {
  //   const transaction = this.db.transaction(['counters', 'bitcoinAddresses', 'events'], 'readwrite');

  //   const r = this.addBitcoinAddress(transaction);

  //   await transaction.done;

  //   return r;
  // }

  // transaction must support write to 'bitcoinAddresses'
  private async addBitcoinAddress<S extends StoreName>(
    transaction: idb.IDBPTransaction<Schema, (S | 'counters' | 'events' | 'bitcoinAddresses')[]>
  ): Promise<Docs.BitcoinAddress> {
    const claimant = await this.nextCounter('bitcoinAddressClaimant', (i: number) => this.deriveBitcoinAddressClaimant(i).toPublicKey(), transaction);

    const bitcoinAddress = this.deriveBitcoinAddressFromClaimant(claimant);

    const bitcoinAddressDoc: Docs.BitcoinAddress = {
      address: bitcoinAddress,
      claimant: claimant.toPOD(),
      created: new Date(),
    };

    const t = await transaction.objectStore('bitcoinAddresses').add(bitcoinAddressDoc);

    this.emitInTransaction('table:bitcoinAddresses', transaction);

    return bitcoinAddressDoc;
  }

  // return if used or not
  public async checkBitcoinAddress(bitcoinAddressDoc: Docs.BitcoinAddress): Promise<boolean> {
    const receives = await fetchBitcoinReceives(bitcoinAddressDoc.address);

    await this.addHookins(bitcoinAddressDoc, receives);

    return receives.length > 0;
  }

  public async addHookins(bitcoinAddressDoc: Docs.BitcoinAddress, receives: BitcoinReceiveInfo[]) {
    for (const receive of receives) {
      const claimant = util.notError(hi.PublicKey.fromPOD(bitcoinAddressDoc.claimant));

      if (this.deriveBitcoinAddressFromClaimant(claimant) !== bitcoinAddressDoc.address) {
        throw new Error('assertion failed: derived wrong bitcoin address');
      }

      const fee = 100; // TODO: ...
      const hookin = new hi.Hookin(receive.txid, receive.vout, receive.amount, fee, claimant, bitcoinAddressDoc.address);

      let hookinDoc: Docs.Claimable = {
        ...hi.claimableToPOD(hookin),
        created: new Date(),
      };

      try {
        await this.db.add('claimables', hookinDoc);
      } catch (err) {
        console.warn('hookin already existed: ', err, hookinDoc.hash);
        return;
      }
      await this.emit('table:hookins');

      await this.claimClaimable(hookin);
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
    await this.claimClaimable(ackd.contents);
  }

  public async send(bitcoinAddress: string, amount: number, fee: number): Promise<'NOT_ENOUGH_FUNDS' | hi.Hash> {
    const totalToSend = amount + fee;

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

    const hookout = new hi.Hookout({ amount, fee, inputs }, bitcoinAddress, 'IMMEDIATE');

    const owners: hi.PrivateKey[] = [];

    for (const coin of inputs) {
      const coinDoc = util.mustExist(await transaction.objectStore('coins').get(coin.hash().toPOD()));
      const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimableHash));
      const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
      owners.push(this.config.deriveOwner(claimHash, blindingNonce));
    }

    hookout.authorize(owners);

    const claimableDoc: Docs.Claimable = {
      ...hi.claimableToPOD(hookout),
      created: new Date(),
    };

    await transaction.objectStore('claimables').put(claimableDoc);
    await this.emitInTransaction('table:claimables', transaction);
    await transaction.done;

    await this.claimClaimable(hookout);
    return hookout.hash();
  }

  public deriveBitcoinAddressClaimant(n: number) {
    return this.config.bitcoinAddressGenerator().derive(n);
  }

  public deriveBitcoinAddress(n: number) {
    const claimant = this.config.bitcoinAddressGenerator().derive(n);
    const claimantPub = claimant.toPublicKey();

    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = this.config.custodian.fundingKey.tweak(tweakPubkey);

    return { claimant, bitcoinAddress: pubkey.toBitcoinAddress() };
  }

  public deriveBitcoinAddressFromClaimant(claimantPub: hi.PublicKey) {
    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = this.config.custodian.fundingKey.tweak(tweakPubkey);

    return pubkey.toBitcoinAddress();
  }

  public deriveClaimableClaimant(hash: hi.Hash): hi.PrivateKey {
    return this.config.claimantGenerator().derive(hash.buffer);
  }

  public deriveLightningInvoiceClaimant(n: number): hi.PrivateKey {
    return this.config.invoiceGenerator().derive(n);
  }
}

async function retAwait<T>(t: Promise<T>, p: Promise<void>) {
  const tmp = await t;
  await p;
  return tmp;
}

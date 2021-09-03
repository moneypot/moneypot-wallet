import * as Docs from './docs';
import * as hi from 'moneypot-lib';
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

import * as requests from './requests';

import Claimed from 'moneypot-lib/dist/status/claimed';
import getInvoicesByClaimant from './requests/get-invoices-by-claimant';
import getClaimableByInputOwner from './requests/get-claimable-by-input-owner';
import { RequestError } from './requests/make-request';

import txs from '../wallet/requests/bitcoin-txs';
import Settings from './settings';
import HookinAccepted from 'moneypot-lib/dist/status/hookin-accepted';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import InvoiceSettled from 'moneypot-lib/dist/status/invoice-settled';
import Failed from 'moneypot-lib/dist/status/failed';
import LightningPaymentSent from 'moneypot-lib/dist/status/lightning-payment-sent';

let currentVersion = 4;
// TODO: Improve this, placeholder.
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default class Database extends EventEmitter {
  db: idb.IDBPDatabase<Schema>;
  config: Config; // if not set, wallet is locked.
  settings: Settings;
  bestEventId?: number;
  pollId: any; // number? can't type this for now

  constructor(db: idb.IDBPDatabase<Schema>, config: Config, settings: Settings) {
    super();
    this.db = db;
    this.config = config;
    this.settings = settings;

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

  private async deleteCounter<S extends StoreName>(key: string, transaction: idb.IDBPTransaction<Schema, (S | 'counters')[]>) { 
    await transaction.objectStore('counters').delete(key)
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

    const settingsDoc = await db.get('settings', 1);
    if (!settingsDoc) {
      return 'NO_DEFAULT_SETTINGS_FOUND';
    }

    const settings = await Settings.fromDoc(settingsDoc);
    if (settings instanceof Error) {
      return settings;
    }

    return new Database(db, config, settings);
  }

  public static async create(name: string, custodianUrl: string, mnemonic: string, password: string): Promise<Database | Error> {
    const custodian = await getCustodianInfo(custodianUrl);
    if (custodian instanceof Error) {
      return custodian;
    }

    if (!bip39.validateMnemonic(mnemonic)) {
      return new Error('got invalid mnemoic');
    }

    const gapLimit = 10;

    // If the custodianUrl has a # for verification, we want to strip it now
    const n = custodianUrl.indexOf('#');
    if (n !== -1) {
      custodianUrl = custodianUrl.substring(0, n - 1);
    }

    const config = await Config.fromData(
      mnemonic,
      gapLimit,
      custodianUrl,
      custodian instanceof hi.CustodianInfo ? custodian : custodian.ci,
      password,
      custodian instanceof hi.CustodianInfo ? undefined : custodian.sigP,
      custodian instanceof hi.CustodianInfo ? undefined : custodian.ephemeral
    );
    if (config instanceof Error) {
      return config;
    }

    // backwards compatibility this way?
    const settings = await Settings.fromData();
    if (settings instanceof Error) {
      return settings;
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

    await res.add('settings', settings.toDoc());

    await dbInfo.add(name);

    return new Database(res, config, settings);
  }

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

  private async getStatuses<S extends StoreName>(claimableHash: string, transaction: idb.IDBPTransaction<Schema, (S | 'statuses')[]>) {
    const statusDocs = await transaction.objectStore('statuses').index('by-claimable-hash').getAll(claimableHash);

    return statusDocs.map((s) => util.notError(hi.statusFromPOD(s)));
  }

  public async claimClaimable(ackdClaimable: hi.Acknowledged.Claimable | Docs.Claimable) {
    const claimable = ackdClaimable instanceof hi.Acknowledged.default ? ackdClaimable.contents : util.notError(hi.claimableFromPOD(ackdClaimable));
    const claimableHash = claimable.hash().toPOD();
    let transaction = this.db.transaction(['coins', 'counters', 'claimables', 'statuses'], 'readwrite');

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
      const counter = await transaction.objectStore('counters').index('by-value').get(claimable.claimant.toPOD());

      if (!counter) {
        console.error('could not find counter by claimant: ', claimable.claimant.toPOD());
        throw new Error('coult not find counter for ' + claimable.hash().toPOD());
      }

      claimant = this.deriveClaimableClaimant(counter.index, counter.purpose);
    }

    if (claimant.toPublicKey().toPOD() !== claimable.claimant.toPOD()) {
      throw new Error(`Expected derived claimant is ${claimable.claimant.toPOD()} but got ${claimant.toPublicKey().toPOD()}`);
    }

    let amountToClaim = hi.computeClaimableRemaining(claimable, await this.getStatuses(claimableHash, transaction));
    let fee = 0;
    const enable0conf = this.settings.setting6_has0conf;

    while (amountToClaim > 0) {
      if (claimable instanceof hi.Hookin) {
        if (enable0conf) {
          const is0conf = await txs(claimable.toPOD().txid);
          if (is0conf instanceof RequestError) {
            return RequestError;
          }
          if (!is0conf.status.confirmed) {
            if (fee === 0) {
              // make a guess
              fee = claimable.amount * (1 / 100);
            }
          }
        }
      }

      const magnitudes = hi.amountToMagnitudes(amountToClaim - fee);
      const claimResponse = await makeClaim(this.config, claimant, claimable, magnitudes, fee);
      if (claimResponse instanceof RequestError) {
        if (claimResponse.message === 'WRONG_CLAIM_AMOUNT') {
          await this.requestStatuses(claimable.hash().toPOD());

          // after making a network request, we need a new transaction
          transaction = this.db.transaction(['coins', 'counters', 'claimables', 'statuses'], 'readwrite');

          let newAmountToClaim = hi.computeClaimableRemaining(claimable, await this.getStatuses(claimableHash, transaction));
          console.log('new amount to claim: ', newAmountToClaim, ' but we faield trying to claim: ', amountToClaim);
          if (newAmountToClaim === amountToClaim) {
            throw new Error(`tried to claim ${newAmountToClaim} but server told us it was wrong, but it looks fine..`);
          }
          amountToClaim = newAmountToClaim;
          continue;
        }

        if ((claimResponse.message as string).includes('MORE_CONFIDENCE_REQUIRED_ADD_ATLEAST:')) {
          if (enable0conf === undefined || enable0conf === false) {
            break;
          }
          const neededFee = (claimResponse.message as string).match(/\d+/g);
          if (neededFee) {
            fee = fee + neededFee.map(Number)[0];
          }
          continue;
        }

        throw claimResponse;
      }
      // const isValid = claimResponse.verify(this.config.custodian.acknowledgementKey)
      // if (!isValid) {
      //   toast.error(`${claimResponse.toPOD().hash} is invalid!`)
      //   throw new Error(`${claimResponse.toPOD().hash} is invalid!`)
      // }

      await this.processStatuses([claimResponse]);
      break;
    }
  }

  public async requestStatuses(claimableHash: string) {
    const statuses = await requests.getStatusesByClaimable(this.config, claimableHash);
    await this.processStatuses(statuses);
  }

  public async requestLightningInfo() {
    const resp = await requests.getLightningInfo(this.config);
    if (resp instanceof Error) {
      throw resp;
    }
    return resp;
  }
  private async processStatuses(statuses: hi.Acknowledged.Status[]) {
    if (statuses.length === 0) {
      return;
    }

    const transaction = this.db.transaction(['coins', 'counters', 'claimables', 'statuses', 'events'], 'readwrite');

    let newStatus = false;

    for (const status of statuses) {
      const statusDoc: Docs.Status = {
        created: new Date(),
        ...status.toPOD(),
      };

      const exists = await transaction.objectStore('statuses').getKey(statusDoc.hash);
      if (exists) {
        continue;
      }
      const isValid = await status.verify(this.config.custodian.acknowledgementKey);
      if (!isValid) {
        // toast.error(`${status.toPOD().hash} does not verify!`);
        throw new Error(`${status.toPOD().hash} does not verify!`);
      }

      // TODO, do this in processClaimResponse, this is just unnecessarily complicated?!
      if (status instanceof hi.Acknowledged.default) {
        if (status.contents instanceof Claimed) {
          const claimedStatus = status.contents;

          const { claimableHash, claimRequest, blindedReceipts } = claimedStatus;
          const { coinRequests } = claimRequest;
          if (!claimRequest.authorization) {
            throw new Error('No auth provided?! what the hell?!');
          }
          const sig = claimRequest.authorization;
          const claimable = await transaction.objectStore('claimables').get(claimableHash.toPOD());

          if (!claimable) {
            throw new Error("Didn't find a local claimable for this status?!");
          }
          const p = hi.PublicKey.fromPOD(claimable.claimant);
          if (p instanceof Error) {
            throw new Error('Huh, our local claimable contains an invalid claimant?!');
          }

          // check if the request is actually ours (our coins)
          const isOurs = sig.verify(claimRequest.hash().buffer, p);
          if (!isOurs) {
            throw new Error("Couldn't verify if custodian returned our/right claimRequest");
          }
          // check if blindReceipts is of equal length.
          if (coinRequests.length != blindedReceipts.length) {
            throw new Error('Custodian is trying to cheat us by not sending requested amount of receipts back.');
          }

          // We signed the request, so we can assume?! that the nonces and owners are valid, now we check if the receipts are what we expect them to be
          for (let i = 0; i < blindedReceipts.length; i++) {
            const blindedReceipt = blindedReceipts[i];
            const originalClaim = coinRequests[i];
            const signee = this.config.custodian.blindCoinKeys[originalClaim.magnitude.n];

            const isEqual = blindedReceipt.verify(originalClaim.blindingNonce, originalClaim.blindedOwner.c, signee);
            if (!isEqual) {
              throw new Error(
                `Custodian is trying to feed us invalid coins! ${blindedReceipt.toPOD()}, ${originalClaim.blindedOwner.toPOD()}, ${signee.toPOD()}`
              );
            }
          }
        }
      }

      newStatus = true;
      await transaction.objectStore('statuses').add(statusDoc);
      if (status.contents instanceof Claimed) {
        await this.processClaimResponseT(status, transaction);
      }
    }

    if (newStatus) {
      await this.emitInTransaction('table:statuses', transaction);
    }

    await transaction.done;
  }

  // If you generated more invoices than allowed (spam-clicked), counters would still be stored, and if tried to recover, the gaplimit would not be great enough to surpass the empty counters.

  public async requestLightningInvoice(memo: string, amount: number) {
    const counterTransaction = this.db.transaction(['counters'], 'readwrite');

    const purpose = 'lightningInvoice';

    let claimant = await this.nextCounter(purpose, (index) => this.deriveClaimableClaimant(index, purpose).toPublicKey(), counterTransaction);

    let invoice: hi.Acknowledged.Claimable | Error;
    try {
      invoice = await genInvoice(this.config, claimant, memo, amount);
    } catch (error) {
      invoice = error
    }

    // delete counter TODO?
    if (invoice instanceof Error) {
      const transactionC = this.db.transaction(['counters'], 'readwrite');
      //transactionC.objectStore('counters').delete(claimant.toPOD())
      await this.deleteCounter(claimant.toPOD(), transactionC)

      throw invoice
    }

    const invoiceDoc = {
      created: new Date(),
      ...invoice.toPOD(),
    };

    const transaction = this.db.transaction(['counters', 'claimables', 'events'], 'readwrite');

    await transaction.objectStore('claimables').add(invoiceDoc);
    await this.emitInTransaction('table:claimables', transaction);

    await transaction.done;

    return invoiceDoc;
  }
  public async resetAddresses() {
    await this.db.clear('bitcoinAddresses');
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

  // copied from coin-selection
  public async getMaxSend() {
    const coins = await this.listUnspent();
    const candidates = [...coins] // first we copy (avoid mutation)
      .sort((a, b) => b.magnitude - a.magnitude) // sort by biggest first...
      .slice(0, 255); // max coins a transfer can have

    let sum = 0;
    for (const coin of candidates) {
      sum += 2 ** coin.magnitude;
    }
    return sum;
  }
  // should we delay...? It'll leak blind information...?
  async syncBitcoinAddresses() {
    let gapCount = 0;

    for (let index = 0; gapCount < this.config.gapLimit; index++) {
      const transaction = this.db.transaction(['counters', 'events', 'bitcoinAddresses', 'claimables'], 'readwrite');
      const bitcoinAddressDoc = await this.getOrAddBitcoinAddressByIndex(index, transaction);
      console.log('[sync:bitcoin-address] checking address: ', bitcoinAddressDoc.address, ' index ', index);

      if (this.settings.setting7_randomize_recovery) {
        await delay(Math.random() * 10000);
      }
      const found = await this.checkBitcoinAddress(bitcoinAddressDoc);

      console.log('[sync:bitcoin-address] for address: ', bitcoinAddressDoc.address, ' we found something? ', found);

      gapCount = found ? 0 : gapCount + 1;
    }
  }

  async syncLightningInvoices() {
    let gapCount = 0;
    for (let index = 0; gapCount < this.config.gapLimit; index++) {
      const purpose = 'lightningInvoice';

      const claimant = this.deriveClaimableClaimant(index, purpose).toPublicKey();
      const invoice = await getInvoicesByClaimant(this.config, claimant);
      console.log('[sync:lightning-invoice] checking invoice: ', claimant.toPOD(), ' index ', index);

      if (!invoice) {
        gapCount++;
        continue;
      }

      gapCount = 0;
      const transaction = this.db.transaction(['counters', 'claimables', 'events'], 'readwrite');
      let added = false;
      // TODO?
      // for (const invoice of invoices) {
      const invoiceHash = invoice.hash().toPOD();

      const found = await transaction.objectStore('claimables').getKey(invoiceHash);

      if (found) {
        continue;
      }

      const i = invoice.toPOD();
      const invoiceDoc = {
        created: i.initCreated ? new Date(i.initCreated) : new Date(),
        ...i,
      };
      await this.createCounter(purpose, index, claimant, transaction);

      await transaction.objectStore('claimables').add(invoiceDoc);
      added = true;
      // }

      if (added) {
        await this.emitInTransaction('table:claimables', transaction);
      }
    }
  }

  async syncClaimable() {
    const claimables = await this.db.getAll('claimables');
    for (const claimable of claimables) {
      const fromPODClaimable = hi.claimableFromPOD(claimable);
      if (fromPODClaimable instanceof Error) {
        throw fromPODClaimable;
      }
      let check: boolean = true;
      const statuses = await this.db
        .getAllFromIndex('statuses', 'by-claimable-hash', claimable.hash)
        .then((ss) => ss.map((s) => util.notError(hi.statusFromPOD(s))));

      switch (claimable.kind) {
        case 'Hookin':
          if (statuses.some((status) => status instanceof HookinAccepted)) {
            if (statuses.some((status) => status instanceof Claimed)) {
              check = false;
            } else {
              if (hi.computeClaimableRemaining(fromPODClaimable, statuses) === 0) {
                check = false; // if a hookin is *worthless*
              }
            }
          }
          break;
        case 'Hookout':
        case 'FeeBump':
          if (statuses.some((status) => status instanceof BitcoinTransactionSent)) {
            if (statuses.some((status) => status instanceof Claimed)) {
              check = false;
            } else {
              if (hi.computeClaimableRemaining(fromPODClaimable, statuses) === 0) {
                check = false;
              }
            }
          }
          break;
        case 'LightningInvoice':
          if (statuses.some((status) => status instanceof InvoiceSettled)) {
            if (statuses.some((status) => status instanceof Claimed)) {
              check = false;
            }
          }
          break;
        case 'LightningPayment':
          if (statuses.some((status) => status instanceof LightningPaymentSent) || statuses.some((status) => status instanceof Failed)) {
            if (statuses && statuses.filter((status) => status instanceof Claimed)) {
              if (hi.computeClaimableRemaining(fromPODClaimable, statuses) === 0) {
                check = false;
              }
            }
          }
          break;
      }
      if (check) {
        try {
          if (this.settings.setting7_randomize_recovery) {
            await delay(Math.random() * 10000);
          }
          console.log('[sync:moneypot-claimables] checking claimable statuses: ', claimable.hash);
          await this.requestStatuses(claimable.hash);
          console.log('[sync:moneypot-claimables] checking claimable claims: ', claimable.hash);
          await this.claimClaimable(claimable); // it's not a problem if this fails because not all coins are found yet - makes sense. maybe remove logs?
        } catch (e) {
          continue;
        }
      }
    }
  }

  async syncCoins() {
    const coins = await this.db.getAll('coins');
    for (const coin of coins) {
      if (this.settings.setting7_randomize_recovery) {
        await delay(Math.random() * 10000);
      }
      const claimable = await getClaimableByInputOwner(this.config, coin.owner);
      if (!claimable) {
        continue;
      }
      const claimableHash = claimable.hash().toPOD();

      const transaction = this.db.transaction(['claimables', 'events'], 'readwrite');
      if (await transaction.objectStore('claimables').getKey(claimableHash)) {
        continue;
      }

      const claimableDoc: Docs.Claimable = {
        created: new Date(),
        ...claimable.toPOD(),
      };

      await transaction.objectStore('claimables').add(claimableDoc);
      await this.emitInTransaction('table:claimables', transaction);

      await transaction.done;
    }
  }

  async syncNested(emptySyncedCoinsPrevious?: Docs.Coin[]) {
    let coins = await this.db.getAll('coins');

    const localClaimables = (await this.db
      .getAll('claimables')
      .then((claimables) => claimables.filter((c) => c.kind === 'Hookout' || c.kind === 'FeeBump' || c.kind === 'LightningPayment'))) as
      | (Docs.Claimable & hi.POD.FeeBump)[]
      | (Docs.Claimable & hi.POD.LightningPayment)[]
      | (Docs.Claimable & hi.POD.Hookout)[];

    let hasFound: boolean = false;
    let hasLocal: Docs.Coin[] = [];

    for (const coin of coins) {
      for (const c of localClaimables) {
        const e = c.inputs;
        for (const k of e) {
          if (coin.owner === k.owner) {
            // console.log(`we found a claimable for ${coin.owner}, no need to send a request to the custodian`);
            hasLocal.push(coin);
            //unnec
            break;
          }
        }
      }
      // filter out empty from newCoins...
      if (emptySyncedCoinsPrevious != undefined) {
        for (const c of emptySyncedCoinsPrevious) {
          if (coin.owner === c.owner) {
            // console.log(`We have already filtered ${coin.owner} before, no need to send again`);
            hasLocal.push(coin);
          }
        }
      }
    }

    let Unspent = coins.filter((x) => !hasLocal.includes(x));
    // include the previous loop
    let emptySyncedCoins: Docs.Coin[] = emptySyncedCoinsPrevious != undefined ? emptySyncedCoinsPrevious : [];
    let ghostChance = Buffer.from(hi.random(1)).readUInt8(0) % 10;
    for (const checkCoin of Unspent) {
      if (hasFound) {
        break;
      }
      if (this.settings.setting7_randomize_recovery) {
        await delay(Math.random() * 3000);
        // fake a coin, x% chance.
        if (Buffer.from(hi.random(1)).readUInt8(0) % 10 >= ghostChance) {
          await getClaimableByInputOwner(this.config, hi.PrivateKey.fromRand().toPublicKey().toPOD());
        }
      }
      console.log('[sync:moneypot-coins] checking coins for status: ', checkCoin.owner);
      const claimable = await getClaimableByInputOwner(this.config, checkCoin.owner);
      if (!claimable) {
        emptySyncedCoins.push(checkCoin);
        continue;
      }
      const claimableHash = claimable.hash().toPOD();

      const transaction = this.db.transaction(['claimables', 'events'], 'readwrite');
      if (await transaction.objectStore('claimables').getKey(claimableHash)) {
        continue;
      }
      hasFound = true;

      const c = claimable.toPOD();

      const claimableDoc: Docs.Claimable = {
        created: c.initCreated ? new Date(c.initCreated) : new Date(),
        ...c,
      };

      await transaction.objectStore('claimables').add(claimableDoc);
      await this.emitInTransaction('table:claimables', transaction);

      await transaction.done;
      try {
        await this.requestStatuses(claimableHash);
        await this.claimClaimable(claimable);
      } catch (e) {
        continue;
      }
    }
    // we found a new claimable, run again
    if (hasFound === true) {
      await this.syncNested(emptySyncedCoins);
    }
  }

  // sync with workers ( only useful in high latency envs) // this is ugly
  // async syncWithWorkers() {
  //   await this.syncBitcoinAddresses();
  //   await this.syncLightningInvoices();
  //   await this.syncMultiThreadClaimable(0);
  // }

  // sync without workers, this is the sane default.
  async sync() {
    await this.syncBitcoinAddresses();
    await this.syncLightningInvoices();
    await this.syncClaimable();
    await this.syncNested();
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
  ): Promise<[string, number] | undefined> {
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
      const k = await transaction.objectStore('claimables').index('by-bitcoin-address').getKey(bitcoinAdress);
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
    const bitcoinAddress = await transaction.objectStore('bitcoinAddresses').index('by-claimant').get(claimant);
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
    const counter = await transaction.objectStore('counters').index('by-purpose-index').get(['bitcoinAddress', index]);
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
    const transaction = this.db.transaction(['claimables', 'events', 'counters'], 'readwrite');

    const toAck: hi.Hookin[] = [];
    let toEmit = false;

    for (const receive of receives) {
      const claimant = util.notError(hi.PublicKey.fromPOD(bitcoinAddressDoc.claimant));

      if (this.deriveBitcoinAddressFromClaimant(claimant) !== bitcoinAddressDoc.address) {
        throw new Error('assertion failed: derived wrong bitcoin address');
      }

      let hookin = new hi.Hookin(receive.txid, receive.vout, receive.amount, claimant, bitcoinAddressDoc.address);

      // get ~ time of broadcast from blockstream -- custodian rpc also only offers blocktime
      // stupid logic, because this gets replaced by acked claimable. 
      let time: Date = new Date();

      if (receive.time) { 
        if (receive.time < (new Date().getTime() / 1000)) { 
          time = new Date(receive.time * 1000)
        } 
      }
      let hookinDoc = await transaction.objectStore('claimables').get(hookin.hash().toPOD());

      if (!hookinDoc) {
        hookinDoc = {
          ...hi.claimableToPOD(hookin),
          created: time,
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
    const ackd = await requests.addClaimable(this.config, claimable);
    if (ackd instanceof Error) {
      throw ackd;
    }
    // verification.
    if (ackd) {
      if (ackd instanceof hi.AbstractTransfer) {
        // this is unnecessary if we check the hash.
        if (!ackd.isAuthorized()) {
          throw new Error('Custodian tried to ack a false claimable');
        }
      }
      if (claimable.hash().toPOD() != ackd.contents.hash().toPOD()) {
        throw new Error('Custodian sent a wrong claimable back!');
      }
      if (!ackd.verify(this.config.custodian.acknowledgementKey)) {
        throw new Error('Custodian did not properly acknowledge this claimable.');
      }
    }
    const ackPOD = ackd.toPOD();

    const transaction = this.db.transaction(['claimables'], 'readwrite');
    // get claimable with (more) correct time
    const c = await transaction.objectStore('claimables').get(ackPOD.hash)

    let time: Date = new Date(); 
    if (c && ackPOD.initCreated) { 
      if (c.created.getTime() < ackPOD.initCreated ) { 
        time = c.created
      } else if (c.created.getTime() > ackPOD.initCreated ) { // prevent new hookins from having false time on first sync 
        time = new Date(ackPOD.initCreated)
      }
    } else if (c && ackPOD.initCreated === undefined) { 
      time = c.created
    }


    await this.db.put('claimables', {
      ...ackPOD,
      created: time, 
    });
    await this.emit('table:claimables');

    await this.claimClaimable(ackd);
  }

  public async sendLightningPayment(paymentRequest: string, amount: number, fee: number) {
    return this.sendAbstractTransfer((inputs: hi.Coin[]) => new hi.LightningPayment({ inputs, amount, fee }, paymentRequest), amount + fee);
  }

  public async sendHookout(priority: 'CUSTOM' | 'IMMEDIATE' | 'FREE' | 'BATCH', bitcoinAddress: string, amount: number, fee: number, rbf: boolean) {
    return this.sendAbstractTransfer((inputs: hi.Coin[]) => new hi.Hookout({ inputs, amount, fee }, bitcoinAddress, priority, rbf), amount + fee);
  }

  public async sendFeeBump(txid: Uint8Array, fee: number, amount: number, confTarget: number) {
    return this.sendAbstractTransfer((inputs: hi.Coin[]) => new hi.FeeBump({ inputs, amount, fee }, txid, confTarget), amount + fee);
  }
  private async sendAbstractTransfer(
    cstr: (inputs: hi.Coin[]) => hi.LightningPayment | hi.Hookout | hi.FeeBump,
    totalToSend: number
  ): Promise<string | hi.Hash> {
    const transaction = this.db.transaction(['events', 'coins', 'claimables'], 'readwrite');

    const unspent = await this.listUnspentT(transaction);

    const coinsToUse = coinselection.findAtLeast(unspent, totalToSend);
    if (!coinsToUse || typeof coinsToUse === 'number') {
      return `NOT_ENOUGH_FUNDS, MISSING ${coinsToUse} sat `;
    }

    const inputs = coinsToUse.found.map((coin) => util.notError(hi.Coin.fromPOD(coin)));
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

  public deriveBitcoinAddressFromClaimant(claimantPub: hi.PublicKey) {
    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();
    const pubkey = this.config.custodian.fundingKey.tweak(tweakPubkey);
    const usesNested = this.settings.setting1_hasNested;
    if (usesNested) {
      return pubkey.toNestedBitcoinAddress(this.config.custodian.currency === 'BTC' ? false : true); // testnet = true
    }
    return pubkey.toBitcoinAddress(this.config.custodian.currency === 'BTC' ? false : true);
  }

  public deriveClaimableClaimant(index: number, purpose: string): hi.PrivateKey {
    return this.config.claimantGenerator().derive(hi.Buffutils.fromString(purpose)).derive(index);
  }
}

async function retAwait<T>(t: Promise<T>, p: Promise<void>) {
  const tmp = await t;
  await p;
  return tmp;
}

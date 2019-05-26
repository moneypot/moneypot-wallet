import * as Docs from './docs';
import * as hi from 'hookedin-lib';
import * as util from '../util';
import * as idb from 'idb';

import * as bip39 from '../bip39';

import submitTransfer from './requests/submit-transfer';
import { RequestError } from './requests/make-request';
import makeClaim from './requests/make-claim';

import fetchBitcoinReceives, { BitcoinReceiveInfo } from './requests/bitcoin-receives';
import EventEmitter from './event-emitter';
import * as coinselection from './coin-selection';
import lookupCoin from './requests/lookup-coin';
import lookupTransfer from './requests/lookup-transfer';

import getCustodianInfo from './requests/get-custodian-info';

import Config from './config';
import Schema, { schemaPOD, StoreName } from './schema';
import * as dbInfo from './database-info';

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
    this.db.put('events', { name });
  }
  emitInTransaction<S extends StoreName>(name: string, transaction: idb.IDBPTransaction<Schema, (S | 'events')[]>) {
    transaction.objectStore('events').put({ name });
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

  private async processClaimResponse(which: 'Hookin' | 'TransferChange', acknowledgedClaimResponse: hi.AcknowledgedClaimResponse) {
    const claimResponse = acknowledgedClaimResponse.contents;
    const { claimRequest, blindedReceipts } = claimResponse;
    const { coinRequests } = claimRequest;

    const claimHash = claimRequest.claimHash;

    util.mustEqual(coinRequests.length, blindedReceipts.length);

    // basically just adds the appropriate coins, and adds the claim
    const transaction = this.db.transaction(['coins', 'claims', 'events'], 'readwrite');
    const coinStore = transaction.objectStore('coins');

    for (let i = 0; i < coinRequests.length; i++) {
      const coinClaim = coinRequests[i];
      const blindedExistenceProof = blindedReceipts[i];

      const blindingSecret = this.config.deriveBlindingSecret(claimHash, coinClaim.blindingNonce);
      const newOwner = this.config.deriveOwner(claimHash, coinClaim.blindingNonce).toPublicKey();

      const signer = hi.Params.blindingCoinPublicKeys[coinClaim.magnitude.n];

      const [unblinder, blindedOwner] = hi.blindMessage(blindingSecret, coinClaim.blindingNonce, signer, newOwner.buffer);

      util.mustEqual(blindedOwner.toPOD(), coinClaim.blindedOwner.toPOD());

      const existenceProof = hi.unblind(unblinder, blindedExistenceProof);

      util.mustEqual(existenceProof.verify(newOwner.buffer, signer), true);

      const coin = new hi.Coin(newOwner, coinClaim.magnitude, existenceProof);

      coinStore.put({
        hash: coin.hash().toPOD(),
        claimHash: claimHash.toPOD(),
        blindingNonce: coinClaim.blindingNonce.toPOD(),
        ...coin.toPOD(),
      });
    }
    this.emitInTransaction('table:coins', transaction);

    transaction.objectStore('claims').put({
      ...acknowledgedClaimResponse.toPOD(),
      which,
    });
    this.emitInTransaction('table:claims', transaction);

    await transaction.done;

    // TODO: validate ...
  }

  // TODO: put in a transaction?
  public async claimChange(transfer: hi.Transfer) {
    const transferHash = transfer.hash().toPOD();

    const claim = await this.db.get('claims', transferHash);
    if (claim) {
      console.log('transfer: ', transferHash, ' already claimed, no need to reclaim', claim);
      return;
    }

    const claimant = this.deriveChangeClaimant(transfer.inputs);

    const magnitudes = hi.amountToMagnitudes(transfer.change.amount);

    const claimResponse = await makeClaim(this.config, claimant, transfer, magnitudes);

    await this.processClaimResponse('TransferChange', claimResponse);
  }

  public async claimHookin(hookinDoc: Docs.Hookin) {
    const claim = await this.db.get('claims', hookinDoc.hash);
    if (claim) {
      console.log('hookin: ', hookinDoc.hash, ' already claimed, no need to reclaim', claim);
      return;
    }

    const bitcoinAddressDoc = util.mustExist(await this.db.get('bitcoinAddresses', hookinDoc.bitcoinAddress));

    const { claimant } = this.deriveBitcoinAddress(bitcoinAddressDoc.index);

    const hookin = util.notError(hi.Hookin.fromPOD(hookinDoc));

    const magnitudes = hi.amountToMagnitudes(hookin.amount - hi.Params.transactionConsolidationFee);

    const claimResponse = await makeClaim(this.config, claimant, hookin, magnitudes);

    await this.processClaimResponse('Hookin', claimResponse);
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
    const transaction = this.db.transaction(['coins', 'transfers'], 'readonly');
    return this.listUnspentT(transaction);
  }

  // transaction must have read access to transfers and coins
  private async listUnspentT<S extends StoreName>(transaction: idb.IDBPTransaction<Schema, (S | 'coins' | 'transfers')[]>): Promise<Docs.Coin[]> {
    const spentCoinHashes: Set<string> = new Set();

    let transfersCursor = await transaction.objectStore('transfers').openCursor();
    while (transfersCursor) {
      const transfer = transfersCursor.value;

      if (transfer.status.kind !== 'CONFLICTED') {
        for (const hash of transfer.inputHashes) {
          // We only really want to add coinHashes, but adding a few extra output hashes doesn't really matter...
          spentCoinHashes.add(hash);
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

    const addresses = await this.db.getAllFromIndex('bitcoinAddresses', 'by-index');

    for (const address of addresses) {
      const used = await this.checkBitcoinAddress(address);

      gapCount = used ? 0 : gapCount + 1;
    }

    let lastAddressIndex = addresses.length > 0 ? addresses[addresses.length - 1].index : -1;

    for (let checkIndex = lastAddressIndex + 1; gapCount < this.config.gapLimit; checkIndex++) {
      const { bitcoinAddress } = this.deriveBitcoinAddress(checkIndex);
      console.log('prechecking: ', bitcoinAddress);
      const receives = await fetchBitcoinReceives(bitcoinAddress);

      if (receives.length > 0) {
        console.log('found: ', bitcoinAddress, ' has some hookins: ', receives.length);

        // Add all missing addresses...
        const transaction = this.db.transaction(['bitcoinAddresses'], 'readwrite');
        for (let addIndex = checkIndex - 1; addIndex > lastAddressIndex; addIndex--) {
          console.log('adding skipped bitcoin address: ', addIndex);
          await this.addBitcoinAddress(transaction, addIndex);
        }

        const bitcoinAddressDoc = await this.addBitcoinAddress(transaction, checkIndex);
        await this.addHookins(bitcoinAddressDoc, receives);
        lastAddressIndex = checkIndex;
        gapCount = 0;
      } else {
        gapCount++;
      }
    }
  }

  public async sync() {
    await this.syncBitcoinAddresses();
    await this.syncHookins();

    // TODO: find coins that are funded...
  }

  async syncHookins() {
    const transaction = this.db.transaction(['claims', 'hookins'], 'readonly');

    const allClaimed = new Set<string>();

    for (const claim of await transaction.objectStore('claims').getAll()) {
      allClaimed.add(claim.claimRequest.claimHash);
    }

    const unclaimedHookins: Docs.Hookin[] = [];
    for (const hookin of await transaction.objectStore('hookins').getAll()) {
      if (!allClaimed.has(hookin.hash)) {
        unclaimedHookins.push(hookin);
      }
    }

    console.log('Claiming: ', unclaimedHookins.length, ' hookins');

    for (const hookin of unclaimedHookins) {
      await this.claimHookin(hookin);
    }
  }

  async getUnusedBitcoinAddress(): Promise<Docs.BitcoinAddress> {
    const transaction = this.db.transaction(['events', 'bitcoinAddresses', 'hookins'], 'readwrite');

    const cursor = await transaction
      .objectStore('bitcoinAddresses')
      .index('by-index')
      .openCursor(undefined, 'prev');

    if (!cursor) {
      return await this.addBitcoinAddress(transaction, 0);
    }

    const bitcoinAddress = cursor.value;

    const hookinCursor = await transaction
      .objectStore('hookins')
      .index('by-bitcoin-address')
      .openKeyCursor(bitcoinAddress.address);
    if (!hookinCursor) {
      // hasn't been used...
      return bitcoinAddress;
    } else {
      return await this.addBitcoinAddress(transaction, bitcoinAddress.index + 1);
    }
  }

  public async newBitcoinAddress(): Promise<Docs.BitcoinAddress> {
    const transaction = this.db.transaction(['bitcoinAddresses'], 'readwrite');

    let maxIndex = -1;
    const cursor = await transaction
      .objectStore('bitcoinAddresses')
      .index('by-index')
      .openKeyCursor(undefined, 'prev');
    if (cursor) {
      maxIndex = cursor.key;
    }

    return this.addBitcoinAddress(transaction, maxIndex + 1);
  }

  // transaction must support write to 'bitcoinAddresses'
  private async addBitcoinAddress<S extends StoreName>(
    transaction: idb.IDBPTransaction<Schema, (S | 'events' | 'bitcoinAddresses')[]>,
    index: number
  ): Promise<Docs.BitcoinAddress> {
    const hookinInfo = this.deriveBitcoinAddress(index);

    const claimant = hookinInfo.claimant.toPublicKey().toPOD();
    const bitcoinAddress = hookinInfo.bitcoinAddress;

    const bitcoinAddressDoc: Docs.BitcoinAddress = {
      address: bitcoinAddress,
      claimant,
      index,
      created: new Date(),
    };

    transaction.objectStore('bitcoinAddresses').add(bitcoinAddressDoc);
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
      const creditToPub = util.notError(hi.PublicKey.fromPOD(bitcoinAddressDoc.claimant));

      const hookin = new hi.Hookin(receive.txid, receive.vout, receive.amount, creditToPub);

      let hookinDoc: Docs.Hookin = {
        hash: hookin.hash().toPOD(),
        bitcoinAddress: bitcoinAddressDoc.address,
        created: new Date(),
        ...hookin.toPOD(),
      };

      await this.db.put('hookins', hookinDoc);
      this.emit('table:hookins');

      await this.claimHookin(hookinDoc);
    }
  }

  async discardTransfer(transferDoc: Docs.Transfer) {
    if (transferDoc.status.kind !== 'PENDING') {
      throw new Error('transfer must be pending');
    }

    console.warn('discarding transfer: ', transferDoc.hash);
    transferDoc.status = { kind: 'CONFLICTED' };
    await this.db.put('transfers', transferDoc);
    this.emit('table:transfers');
  }

  async finalizeTransfer(transferDoc: Docs.Transfer): Promise<void> {
    if (transferDoc.status.kind !== 'PENDING') {
      throw new Error('transfer must be pending');
    }

    const transfer = util.notError(hi.Transfer.fromPOD(transferDoc));

    util.isTrue(transfer.isAuthorized());

    const hookoutDoc = util.mustExist(await this.db.get('hookouts', transferDoc.outputHash));
    const hookout = util.notError(hi.Hookout.fromPOD(hookoutDoc));

    const acknowledgement = await submitTransfer(this.config, transfer, hookout);

    if (acknowledgement instanceof RequestError) {
      if (acknowledgement.message === 'INPUT_SPENT') {
        // Let's loop over all the inputs to try find the one...
        for (const coin of transferDoc.inputs) {
          const transferHash = await lookupCoin(this.config, coin.owner);
          if (transferHash === undefined) {
            continue; // hasn't been spent..
          }

          // TODO(optimize) we can check if we already have the (ack'd) transfer

          const conflictTransfer = await lookupTransfer(this.config, transferHash);
          if (conflictTransfer === undefined) {
            console.warn('could not find transfer', transferHash, ' even though the server told us about it');
            continue;
          }

          const conflictTransferDoc: Docs.Transfer = {
            hash: conflictTransfer.hash().toPOD(),
            created: new Date(),
            status: { kind: 'ACKNOWLEDGED', acknowledgement: conflictTransfer.acknowledgement.toPOD() },
            inputHashes: Docs.getInputHashes(conflictTransfer.contents),
            ...conflictTransfer.toPOD(),
          };
          await this.db.put('transfers', conflictTransferDoc);
          this.emit('table:transfers');
        }

        transferDoc.status = { kind: 'CONFLICTED' };
        await this.db.put('transfers', transferDoc);
        this.emit('table:transfers');
      }

      console.error('Got other server error: ', acknowledgement);
      throw acknowledgement;
    }

    // succeeded. So in the background, we should be trying to claim the change..
    (async () => {
      await this.claimChange(transfer);
    })().catch(err => {
      console.error('could not claim bounties, got error: ', err);
    });

    transferDoc.status = { kind: 'ACKNOWLEDGED', acknowledgement: acknowledgement.toPOD() };
    await this.db.put('transfers', transferDoc);
    this.emit('table:transfers');
  }

  public async sendToBitcoinAddress(address: string, amount: number, feeRate: number): Promise<'NOT_ENOUGH_FUNDS' | hi.Hash> {
    const totalToSend = amount + Math.ceil(feeRate * hi.Params.templateTransactionWeight);

    const transaction = this.db.transaction(['events', 'coins', 'hookouts', 'transfers'], 'readwrite');

    const unspent = await this.listUnspentT(transaction);

    const coinsToUse = coinselection.findAtLeast(unspent, totalToSend);
    if (!coinsToUse) {
      return 'NOT_ENOUGH_FUNDS';
    }

    const hookout = new hi.Hookout(amount, address, hi.random(32));
    const hookoutDoc: Docs.Hookout = {
      hash: hookout.hash().toPOD(),
      created: new Date(),
      ...hookout.toPOD(),
    };

    await this.db.add('hookouts', hookoutDoc);
    this.emit('table:hookouts');

    const inputs = coinsToUse.found.map(coin => util.notError(hi.Coin.fromPOD(coin)));
    hi.Transfer.sort(inputs);

    const change = new hi.Change(coinsToUse.excess, this.deriveChangeClaimant(inputs).toPublicKey());

    const transferHash = hi.Transfer.hashOf(inputs.map(i => i.hash()), hookout.hash(), change);

    const owners: hi.PrivateKey[] = [];

    for (const coin of inputs) {
      const coinDoc = util.mustExist(await this.db.get('coins', coin.hash().toPOD()));
      const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimHash));
      const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
      owners.push(this.config.deriveOwner(claimHash, blindingNonce));
    }

    const auth = hi.Signature.computeMu(transferHash.buffer, owners);

    const transfer = new hi.Transfer(inputs, hookout.hash(), change, auth);

    util.isTrue(transfer.isAuthorized());

    const transferDoc: Docs.Transfer = {
      hash: transferHash.toPOD(),
      ...transfer.toPOD(),
      created: new Date(),
      inputHashes: Docs.getInputHashes(transfer),
      status: { kind: 'PENDING' },
    };
    await this.db.put('transfers', transferDoc);
    this.emit('table:transfers');

    await this.finalizeTransfer(transferDoc);
    return transferHash;
  }

  public deriveBitcoinAddress(n: number) {
    const claimant = this.config.bitcoinAddressGenerator().derive(n);
    const claimantPub = claimant.toPublicKey();

    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = hi.Params.fundingPublicKey.tweak(tweakPubkey);

    return { claimant, bitcoinAddress: pubkey.toBitcoinAddress() };
  }

  public deriveChangeClaimant(transferInputs: readonly hi.Coin[]): hi.PrivateKey {
    const ti = hi.Buffutils.concat(...transferInputs.map(coin => coin.buffer));
    return this.config.changeGenerator().derive(ti);
  }
}

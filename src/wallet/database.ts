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
import lookupBountiesByClaimant from './requests/lookup-bounties-by-claimant';

import getCustodianInfo from './requests/get-custodian-info';

import Config from './config';
import Schema, { schemaPOD, StoreName } from './schema';
import * as dbInfo from './database-info';

export default class Database extends EventEmitter {
  db: idb.IDBPDatabase<Schema>;
  config: Config; // if not set, wallet is locked.

  constructor(db: idb.IDBPDatabase<Schema>, config: Config) {
    super();
    this.db = db;
    this.config = config;

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
        for (const { store, keyPath, indexes } of schemaPOD) {
          const objectStore = db.createObjectStore(store, { keyPath });

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

  public async newChangeBounty(
    transaction: idb.IDBPTransaction<Schema, ('bounties' | 'directAddresses')[]>,
    amount: number
  ): Promise<[hi.Bounty, Docs.Bounty]> {
    const isChange = 1;
    // const maxIndex = await this.directAddresses
    //   .where('[isChange+index]')
    //   .between([isChange, Dexie.minKey], [isChange, Dexie.maxKey])
    //   .last();

    const indx = transaction.objectStore('directAddresses').index('by-is-change-and-index');
    const lowerBound = IDBKeyRange.lowerBound([isChange, Number.MIN_SAFE_INTEGER]);

    let prevIndex = -1;

    const cursor = await indx.openKeyCursor(lowerBound, 'prev');
    if (cursor) {
      prevIndex = cursor.key[1];
    }

    const index = prevIndex + 1;

    const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['directAddresses']>;
    const [claimant, address] = await this.addDirectAddress(tx, index, true);
    const nonce = hi.random(32);

    const bounty = new hi.Bounty(amount, claimant, nonce);
    const bountyDoc: Docs.Bounty = {
      hash: bounty.hash().toPOD(),
      ...bounty.toPOD(),
    };

    transaction.objectStore('bounties').add(bountyDoc);

    return [bounty, bountyDoc];
  }

  private async processClaimResponse(acknowledgedClaimResponse: hi.AcknowledgedClaimResponse) {
    const claimResponse = acknowledgedClaimResponse.contents;
    const { claimRequest, blindedReceipts } = claimResponse;

    const claimHash = claimRequest.claim;

    util.mustEqual(claimRequest.coins.length, blindedReceipts.length);

    // basically just adds the appropriate coins, and adds the claim
    const transaction = this.db.transaction(['coins', 'claims'], 'readwrite');
    const coinStore = transaction.objectStore('coins');

    for (let i = 0; i < claimRequest.coins.length; i++) {
      const coinClaim = claimRequest.coins[i];
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

    transaction.objectStore('claims').put({
      ...acknowledgedClaimResponse.toPOD(),
    });

    await transaction.done;

    // TODO: validate ...
  }

  public async claimBounty(bountyDoc: Docs.Bounty) {
    const address = util.mustExist(await this.db.get('directAddresses', bountyDoc.claimant));

    return this.claimBountyWithAddress(bountyDoc, address);
  }

  private async claimBountyWithAddress(bountyDoc: Docs.Bounty, address: Docs.DirectAddress) {
    const claim = await this.db.get('claims', bountyDoc.hash);
    if (claim) {
      console.log('bounty: ', bountyDoc.hash, ' already claimed, no need to reclaim', claim);
      return;
    }

    const claimant = this.deriveClaimantIndex(address.index, address.isChange === 1);

    const bounty = util.notError(hi.Bounty.fromPOD(bountyDoc));

    const magnitudes = hi.amountToMagnitudes(bounty.amount);

    const claimResponse = await makeClaim(this.config, claimant, bounty, magnitudes);

    await this.processClaimResponse(claimResponse);
  }

  public async claimHookin(hookinDoc: Docs.Hookin) {
    const claim = this.db.get('claims', hookinDoc.hash);
    if (claim) {
      console.log('hookin: ', hookinDoc.hash, ' already claimed, no need to reclaim', claim);
      return;
    }

    const bitcoinAddressDoc = util.mustExist(await this.db.get('bitcoinAddresses', hookinDoc.bitcoinAddress));

    const { claimant } = this.deriveBitcoinAddressIndex(bitcoinAddressDoc.index);

    const hookin = util.notError(hi.Hookin.fromPOD(hookinDoc));

    const magnitudes = hi.amountToMagnitudes(hookin.amount - hi.Params.transactionConsolidationFee);

    const claimResponse = await makeClaim(this.config, claimant, hookin, magnitudes);

    await this.processClaimResponse(claimResponse);
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
  private async listUnspentT(transaction: idb.IDBPTransaction<Schema, ('coins' | 'transfers')[]>): Promise<Docs.Coin[]> {
    const spentCoinHashes: Set<string> = new Set();

    let transfersCursor = await transaction.objectStore('transfers').openCursor();
    while (transfersCursor) {
      const transfer = transfersCursor.value;

      if (transfer.status.kind !== 'CONFLICTED') {
        for (const hash of transfer.inputOutputHashes) {
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
      const { bitcoinAddress } = this.deriveBitcoinAddressIndex(checkIndex);
      console.log('prechecking: ', bitcoinAddress);
      const receives = await fetchBitcoinReceives(bitcoinAddress);

      if (receives.length > 0) {
        console.log('found: ', bitcoinAddress, ' has some hookins: ', receives.length);

        // Add all missing addresses...
        const transaction = this.db.transaction('bitcoinAddresses', 'readwrite');
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
      allClaimed.add(claim.claimRequest.claim);
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
    const transaction = this.db.transaction(['bitcoinAddresses', 'hookins'], 'readwrite');

    const cursor = await transaction
      .objectStore('bitcoinAddresses')
      .index('by-index')
      .openCursor(undefined, 'prev');

    if (!cursor) {
      const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['bitcoinAddresses']>;
      return await this.addBitcoinAddress(tx, 0);
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
      const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['bitcoinAddresses']>;
      return await this.addBitcoinAddress(tx, bitcoinAddress.index + 1);
    }
  }

  public async newBitcoinAddress(): Promise<Docs.BitcoinAddress> {
    const transaction = this.db.transaction('bitcoinAddresses', 'readwrite');

    let maxIndex = -1;
    const cursor = await transaction.store.index('by-index').openKeyCursor(undefined, 'prev');
    if (cursor) {
      maxIndex = cursor.key;
    }

    return this.addBitcoinAddress(transaction, maxIndex + 1);
  }

  // transaction must support write to 'bitcoinAddresses'
  private async addBitcoinAddress(transaction: idb.IDBPTransaction<Schema, ['bitcoinAddresses']>, index: number): Promise<Docs.BitcoinAddress> {
    const hookinInfo = this.deriveBitcoinAddressIndex(index);

    const claimant = hookinInfo.claimant.toPublicKey().toPOD();
    const bitcoinAddress = hookinInfo.bitcoinAddress;

    const bitcoinAddressDoc: Docs.BitcoinAddress = {
      address: bitcoinAddress,
      claimant,
      index,
      created: new Date(),
    };

    await transaction.objectStore('bitcoinAddresses').add(bitcoinAddressDoc);

    return bitcoinAddressDoc;
  }

  // return if used or not
  public async checkBitcoinAddress(bitcoinAddressDoc: Docs.BitcoinAddress): Promise<boolean> {
    const receives = await fetchBitcoinReceives(bitcoinAddressDoc.address);

    await this.addHookins(bitcoinAddressDoc, receives);

    return receives.length > 0;
  }

  async getUnusedDirectAddress(): Promise<Docs.DirectAddress> {
    const transaction = this.db.transaction(['directAddresses', 'bounties'], 'readwrite');

    const isChange = 0;

    const notChange = IDBKeyRange.upperBound([isChange, Number.MAX_SAFE_INTEGER]);
    const addressCursor = await transaction
      .objectStore('directAddresses')
      .index('by-is-change-and-index')
      .openCursor(notChange, 'prev');

    if (!addressCursor) {
      const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['directAddresses']>;
      return (await this.addDirectAddress(tx, 0, false))[1];
    }

    const directAddress = addressCursor.value;

    const bountyCursor = await transaction
      .objectStore('bounties')
      .index('by-claimant')
      .openKeyCursor(directAddress.address);
    if (bountyCursor) {
      const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['directAddresses']>;
      return (await this.addDirectAddress(tx, directAddress.index + 1, false))[1];
    }

    return addressCursor.value;
  }

  async newDirectAddress() {
    // const transaction = this.db.transaction(['bitcoinAddresses'], 'readwrite');

    // let maxIndex = -1;
    // const cursor = await transaction.objectStore('bitcoinAddresses').index('by-index').openKeyCursor(undefined, 'prev');
    // if (cursor) {
    //   maxIndex = cursor.key;
    // }

    // return this.addBitcoinAddress(transaction, maxIndex + 1);

    const transaction = this.db.transaction('directAddresses', 'readwrite');
    let maxIndex = -1;

    const isChange = 0;
    const notChange = IDBKeyRange.upperBound([isChange, Number.MAX_SAFE_INTEGER]);
    const cursor = await transaction.store.index('by-is-change-and-index').openKeyCursor(notChange, 'prev');
    if (cursor) {
      maxIndex = cursor.key[1];
    }

    const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ['directAddresses']>;
    return this.addDirectAddress(tx, maxIndex + 1, false);
  }

  // transaction must have readwrite access to 'directAddresses'
  private async addDirectAddress(
    transaction: idb.IDBPTransaction<Schema, ['directAddresses']>,
    index: number,
    isChange: boolean
  ): Promise<[hi.Address, Docs.DirectAddress]> {
    const claimant = this.deriveClaimantIndex(index, isChange);

    const address = new hi.Address(this.config.custodian.prefix(), claimant.toPublicKey());

    const directAddressDoc: Docs.DirectAddress = {
      address: address.toPOD(),
      index,
      isChange: isChange ? 1 : 0,
      created: new Date(),
    };

    transaction.objectStore('directAddresses').add(directAddressDoc);

    return [address, directAddressDoc];
  }

  public async checkDirectAddress(directAddressDoc: Docs.DirectAddress) {
    const bounties = await lookupBountiesByClaimant(this.config, directAddressDoc.address);

    for (const b of bounties) {
      const bounty = util.notError(hi.Bounty.fromPOD(b));

      const bountyDoc: Docs.Bounty = {
        hash: bounty.hash().toPOD(),
        ...bounty.toPOD(),
      };

      await this.db.put('bounties', bountyDoc);
      await this.claimBountyWithAddress(bountyDoc, directAddressDoc);
    }
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

      await this.claimHookin(hookinDoc);
    }
  }

  async discardTransfer(transferDoc: Docs.Transfer) {
    if (transferDoc.status.kind !== 'PENDING') {
      throw new Error('transfer must be pending');
    }

    console.warn('discarding transfer: ', transferDoc.hash);
    transferDoc.status = { kind: 'CONFLICTED' };
    this.db.put('transfers', transferDoc);
  }

  async finalizeTransfer(transferDoc: Docs.Transfer): Promise<void> {
    if (transferDoc.status.kind !== 'PENDING') {
      throw new Error('transfer must be pending');
    }

    const inputs = transferDoc.inputs.map(i => util.notError(hi.Coin.fromPOD(i)));

    let output: hi.Bounty | hi.Hookout;
    let outputDoc: Docs.Bounty | Docs.Hookout;

    let b = await this.db.get('bounties', transferDoc.outputHash);
    if (b !== undefined) {
      outputDoc = b;
      output = util.notError(hi.Bounty.fromPOD(outputDoc));
    } else {
      outputDoc = util.mustExist(await this.db.get('hookouts', transferDoc.outputHash));
      output = util.notError(hi.Hookout.fromPOD(outputDoc));
    }

    const changeDoc = util.mustExist(await this.db.get('bounties', transferDoc.changeHash));
    const change = util.notError(hi.Bounty.fromPOD(changeDoc));

    // We just have this now, so we're sure we can claim the change...
    const changeAddress = util.mustExist(await this.db.get('directAddresses', changeDoc.claimant));

    const authorization = util.notError(hi.Signature.fromPOD(transferDoc.authorization));

    const fullTransfer = new hi.FullTransfer(inputs, output, change, authorization);

    util.isTrue(fullTransfer.isValid());

    const acknowledgement = await submitTransfer(this.config, fullTransfer);

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
            inputOutputHashes: Docs.getInputOutputHashes(conflictTransfer.contents),
            ...conflictTransfer.toPOD(),
          };
          await this.db.put('transfers', conflictTransferDoc);
        }

        transferDoc.status = { kind: 'CONFLICTED' };
        await this.db.put('transfers', transferDoc);
      }

      console.error('Got other server error: ', acknowledgement);
      throw acknowledgement;
    }

    // succeeded. So in the background, we should be trying to claim the change..
    (async () => {
      await this.claimBountyWithAddress(changeDoc, changeAddress);
    })().catch(err => {
      console.error('could not claim bounties, got error: ', err);
    });

    transferDoc.status = { kind: 'ACKNOWLEDGED', acknowledgement: acknowledgement.toPOD() };
    await this.db.put('transfers', transferDoc);
  }

  public async sendDirect(to: hi.Address, amount: number): Promise<'NOT_ENOUGH_FUNDS' | hi.Hash> {
    util.mustEqual(amount > 0, true);

    const totalToSend = amount + hi.Params.basicTransferFee;

    const transaction = this.db.transaction(['bounties', 'coins', 'directAddresses', 'transfers'], 'readwrite');

    const utx = (transaction as unknown) as idb.IDBPTransaction<Schema, ('coins' | 'transfers')[]>;
    const unspent = await this.listUnspentT(utx);

    const coinsToUse = coinselection.findAtLeast(unspent, totalToSend);
    if (!coinsToUse) {
      return 'NOT_ENOUGH_FUNDS';
    }

    const bounty = new hi.Bounty(amount, to, hi.random(32));
    const bountyDoc: Docs.Bounty = {
      hash: bounty.hash().toPOD(),
      ...bounty.toPOD(),
    };

    await this.db.add('bounties', bountyDoc);

    const tx = (transaction as unknown) as idb.IDBPTransaction<Schema, ('bounties' | 'directAddresses')[]>;
    const [changeBounty, changeBountyDoc] = await this.newChangeBounty(tx, coinsToUse.excess);

    const inputs = coinsToUse.found.map(coin => util.notError(hi.Coin.fromPOD(coin)));
    hi.Transfer.sort(inputs);

    const transferHash = hi.Transfer.hashOf(inputs.map(i => i.hash()), bounty.hash(), changeBounty.hash());

    const owners: hi.PrivateKey[] = [];

    for (const coin of inputs) {
      const coinDoc = util.mustExist(await this.db.get('coins', coin.hash().toPOD()));
      const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimHash));
      const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
      owners.push(this.config.deriveOwner(claimHash, blindingNonce));
    }

    const sig = hi.Signature.computeMu(transferHash.buffer, owners);

    const transfer = new hi.FullTransfer(inputs, bounty, changeBounty, sig);

    const prunedTransfer = transfer.prune();

    const transferDoc: Docs.Transfer = {
      hash: transfer.hash().toPOD(),
      status: { kind: 'PENDING' },
      created: new Date(),
      inputOutputHashes: Docs.getInputOutputHashes(prunedTransfer),
      ...prunedTransfer.toPOD(),
    };

    this.db.add('transfers', transferDoc);

    await this.finalizeTransfer(transferDoc);
    return transferHash;
  }

  public async sendToBitcoinAddress(address: string, amount: number, feeRate: number): Promise<'NOT_ENOUGH_FUNDS' | hi.Hash> {
    const totalToSend = amount + Math.ceil(feeRate * hi.Params.templateTransactionWeight);

    const transaction = this.db.transaction(['bounties', 'coins', 'directAddresses', 'hookouts', 'transfers'], 'readwrite');

    const utx = (transaction as unknown) as idb.IDBPTransaction<Schema, ('coins' | 'transfers')[]>;
    const unspent = await this.listUnspentT(utx);

    const coinsToUse = coinselection.findAtLeast(unspent, totalToSend);
    if (!coinsToUse) {
      return 'NOT_ENOUGH_FUNDS';
    }

    const hookout = new hi.Hookout(amount, address, true, hi.random(32));
    const hookoutDoc: Docs.Hookout = {
      hash: hookout.hash().toPOD(),
      created: new Date(),
      ...hookout.toPOD(),
    };

    await this.db.add('hookouts', hookoutDoc);

    const ctx = (transaction as unknown) as idb.IDBPTransaction<Schema, ('bounties' | 'directAddresses')[]>;
    const [changeBounty, changeBountyDoc] = await this.newChangeBounty(ctx, coinsToUse.excess);

    const inputs = coinsToUse.found.map(coin => util.notError(hi.Coin.fromPOD(coin)));
    hi.Transfer.sort(inputs);

    const transferHash = hi.Transfer.hashOf(inputs.map(i => i.hash()), hookout.hash(), changeBounty.hash());

    const owners: hi.PrivateKey[] = [];

    for (const coin of inputs) {
      const coinDoc = util.mustExist(await this.db.get('coins', coin.hash().toPOD()));
      const claimHash = util.notError(hi.Hash.fromPOD(coinDoc.claimHash));
      const blindingNonce = util.notError(hi.PublicKey.fromPOD(coinDoc.blindingNonce));
      owners.push(this.config.deriveOwner(claimHash, blindingNonce));
    }

    const auth = hi.Signature.computeMu(transferHash.buffer, owners);

    const transfer = new hi.FullTransfer(inputs, hookout, changeBounty, auth);

    if (!transfer.isValid()) {
      console.error('transfer hash is: ', transfer.hash().toPOD(), ' and expected: ', transferHash.toPOD());
      throw new Error('just created transfer is not valid');
    }

    const prunedTransfer = transfer.prune();

    const transferDoc: Docs.Transfer = {
      hash: transferHash.toPOD(),
      ...prunedTransfer.toPOD(),
      created: new Date(),
      inputOutputHashes: Docs.getInputOutputHashes(prunedTransfer),
      status: { kind: 'PENDING' },
    };
    await this.db.put('transfers', transferDoc);

    await this.finalizeTransfer(transferDoc);
    return transferHash;
  }

  public deriveBitcoinAddressIndex(i: number) {
    return this.deriveBitcoinAddress(hi.Buffutils.fromUint8(i)); // TODO: use .fromVarInt()
  }

  public deriveBitcoinAddress(n: Uint8Array) {
    const claimant = seedToBitcoinAddressGenerator(this.config.seed).derive(n);
    const claimantPub = claimant.toPublicKey();

    const tweakBytes = hi.Hash.fromMessage('tweak', claimantPub.buffer).buffer;
    const tweak = util.notError(hi.PrivateKey.fromBytes(tweakBytes));

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = hi.Params.fundingPublicKey.tweak(tweakPubkey);

    return { claimant, bitcoinAddress: pubkey.toBitcoinAddress() };
  }

  public deriveClaimantIndex(index: number, isChange: boolean) {
    return this.deriveClaimant(hi.Buffutils.fromVarInt(index), isChange);
  }

  public deriveClaimant(n: Uint8Array, isChange: boolean): hi.PrivateKey {
    const addressGenerator = isChange ? this.config.changeAddressGenerator() : this.config.directAddressGenerator();

    return addressGenerator.derive(n);
  }
}

function seedToBitcoinAddressGenerator(seed: Uint8Array): hi.PrivateKey {
  const hash = hi.Hash.fromMessage('bitcoinAddressGenerator', seed);
  return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
}

function seedToDirectAddressGenerator(seed: Uint8Array): hi.PrivateKey {
  const hash = hi.Hash.fromMessage('directAddressGenerator', seed);
  return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
}

function seedToInternalAddressGenerator(seed: Uint8Array): hi.PrivateKey {
  const hash = hi.Hash.fromMessage('internalAddressGenerator', seed);
  return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
}

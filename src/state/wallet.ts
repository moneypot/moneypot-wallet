import { useState, useEffect } from 'react';

import WalletDatabase from '../wallet/database';
import * as Docs from '../wallet/docs';
import * as util from '../util';
import Dexie from 'dexie';

const fakeWallet: any = new Error('wallet not initialized');
export let wallet: WalletDatabase = fakeWallet; // typed wrong for convience

export function setWallet(wdb: WalletDatabase) {
  wallet = wdb;
  (window as any)._wallet = wdb;
}

export function useTransfers(): Docs.Transfer[] {
  const [transfers, setTransfers] = useState<Docs.Transfer[]>([]);
  async function getTransfers() {
    const transfers = await wallet.transfers
      .orderBy('created')
      .reverse()
      .toArray();
    setTransfers(transfers);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:transfers', getTransfers);
    getTransfers();
    return cleanup;
  }, []);

  return transfers;
}

type UseTransferResult = Docs.Transfer | 'LOADING' | 'NOT_FOUND';
export function useTransfer(transferHash: string): UseTransferResult {
  const [transfer, setTransfer] = useState<UseTransferResult>('LOADING');

  async function getTransfer() {
    const t = await wallet.transfers.get(transferHash);
    if (t === undefined) {
      setTransfer('NOT_FOUND');
    } else {
      setTransfer(t);
    }
  }

  useEffect(() => {
    const cleanup = wallet.on(`key:${transferHash}`, getTransfer);

    getTransfer();

    return cleanup;
  }, [transferHash]);

  return transfer;
}

export function useBounties() {
  const [bounties, setBounties] = useState<Docs.Bounty[]>([]);

  async function getAndSet() {
    const b = await wallet.bounties.toArray();
    setBounties(b);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:bounties', getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return bounties;
}

export function useBitcoinAddresses(): Docs.BitcoinAddress[] {
  const [addresses, setAddresses] = useState<Docs.BitcoinAddress[]>([]);
  async function getAndSetAddresses() {
    const addresses = await wallet.bitcoinAddresses.orderBy('index').toArray();
    setAddresses(addresses);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:bitcoinAddresses', getAndSetAddresses);
    getAndSetAddresses();
    return cleanup;
  }, []);

  return addresses;
}

export function useDirectRecieveAddresses(): Docs.DirectAddress[] {
  const [addresses, setAddresses] = useState<Docs.DirectAddress[]>([]);
  async function getAndSetAddresses() {
    const isChange = 0;

    const addresses = await wallet.directAddresses
      .where('[isChange+index]')
      .between([isChange, Dexie.minKey], [isChange, Dexie.maxKey])
      .toArray();

    setAddresses(addresses);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:directAddresses', getAndSetAddresses);
    getAndSetAddresses();
    return cleanup;
  }, []);

  return addresses;
}

interface KindedBitcoinAddress extends Docs.BitcoinAddress {
  kind: 'bitcoin';
}
interface KindedDirectAddress extends Docs.DirectAddress {
  kind: 'direct';
}
type KindedAddress = KindedBitcoinAddress | KindedDirectAddress;

export function useAllInboundAddresses(): KindedAddress[] {
  const bitcoinAddresses = useBitcoinAddresses();
  const directAddresses = useDirectRecieveAddresses();

  const kindedBitcoinAddresses: KindedBitcoinAddress[] = bitcoinAddresses.map(ba => ({ kind: 'bitcoin', ...ba }));
  const kindedDirectAddresses: KindedDirectAddress[] = directAddresses.map(ba => ({ kind: 'direct', ...ba }));

  return [...kindedBitcoinAddresses, ...kindedDirectAddresses];
}

export function useAddressesHookins(bitcoinAddress: string): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);

  async function getAndSet() {
    const hs = await wallet.hookins
      .where('bitcoinAddress')
      .equals(bitcoinAddress)
      .reverse()
      .sortBy('created');

    setHookins(hs);
  }

  useEffect(() => {
    const cleanup = wallet.on(`hookins.bitcoinAddress:${bitcoinAddress}`, getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return hookins;
}

export function useHookins(): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);

  async function getAndSet() {
    const hs = await wallet.hookins
      .orderBy('created')
      .reverse()
      .toArray();
    //hs.sort((a, b) => a.created.getTime() - b.created.getTime());
    setHookins(hs);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:hookins', getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return hookins;
}

export function useHookouts(): Docs.Hookout[] {
  const [hookouts, setHookouts] = useState<Docs.Hookout[]>([]);

  async function getAndSet() {
    const hs = await wallet.hookouts
      .orderBy('created')
      .reverse()
      .toArray();
    setHookouts(hs);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:hookouts', getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return hookouts;
}

function useTableKey<TableType>(table: Dexie.Table<TableType, string>, key?: string) {
  const [val, setVal] = useState<TableType | 'LOADING' | 'NOT_FOUND'>('LOADING');

  async function get() {
    if (key === undefined) {
      setVal('NOT_FOUND');
      return;
    }

    const v = await table.get(key);
    if (v === undefined) {
      console.warn('could not find key: ', key);
      setVal('NOT_FOUND');
      return;
    }

    setVal(v);
  }

  useEffect(() => {
    get();
  }, [key]);

  return val;
}

export function useBounty(bountyHash: string) {
  return useTableKey(wallet.bounties, bountyHash);
}

export function useHookin(hookinHash: string) {
  return useTableKey(wallet.hookins, hookinHash);
}

export function useHookout(hookoutHash?: string) {
  return useTableKey(wallet.hookouts, hookoutHash);
}

interface KindedBounty {
  kind: 'Bounty';
  bounty: Docs.Bounty;
}
interface KindedHookout {
  kind: 'Hookout';
  hookout: Docs.Hookout;
}

export function useBountyOrHookout(outputHash: string): 'LOADING' | 'NOT_FOUND' | KindedBounty | KindedHookout {
  const bounty = useBounty(outputHash);
  const hookout = useHookout(outputHash);

  if (bounty === 'LOADING' || hookout === 'LOADING') {
    return 'LOADING';
  }

  if (bounty === 'NOT_FOUND' && hookout === 'NOT_FOUND') {
    return 'NOT_FOUND';
  }

  if (bounty !== 'NOT_FOUND') {
    return { kind: 'Bounty', bounty };
  }
  if (hookout !== 'NOT_FOUND') {
    return { kind: 'Hookout', hookout };
  }

  throw new Error('unreachable!');
}

export function useHookinsOfAddress(bitcoinAddress: string): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);

  async function get() {
    wallet.hookins
      .where({ bitcoinAddress })
      .toArray()
      .then(hookins => setHookins(hookins));
  }

  useEffect(() => {
    const cleanup = wallet.on(`hookins.bitcoinAddress:${bitcoinAddress}`, get);

    get();

    return cleanup;
  }, [bitcoinAddress]);

  return hookins;
}

// export function useAckdChangeBounties(): Docs.Bounty[] {
//   const [bounties, setBounties] = useState<Docs.Bounty[]>([]);

//   async function get() {
//     await wallet.db.transaction('r', wallet.transfers, wallet.bounties, async () => {
//       const transfers = await wallet.transfers
//         .where('status.kind')
//         .equals('ACKNOWLEDGED')
//         .toArray();

//       const ackedBounties = new Set<string>();
//       for (const transfer of transfers) {
//         ackedBounties.add(transfer.changeHash);
//       }

//       const bounties = await wallet.bounties.filter(bounty => ackedBounties.has(bounty.hash)).toArray();
//       setBounties(bounties);
//     });
//   }
//   useEffect(() => {
//     const bountiesCleanup = wallet.on('table:bounties', get);
//     const transferCleanup = wallet.on('table:transfers', get);
//     get();
//     return () => {
//       bountiesCleanup();
//       transferCleanup();
//     };
//   }, []);

//   return bounties;
// }

type BountyStatusResult = 'LOADING' | 'UNCOLLECTED' | Docs.Claim;

export function useBountyStatus(bountyHash: string) {
  const [spentStatus, setSpentStatus] = useState<ClaimStatusResult>('LOADING');
  async function getAndSet() {
    const claim = await wallet.claims.get(bountyHash);
    if (claim === undefined) {
      setSpentStatus('UNCOLLECTED');
    } else {
      setSpentStatus(claim);
    }
  }

  useEffect(() => {
    const cleanup = wallet.on(`key:${bountyHash}`, getAndSet); // get the claim
    getAndSet();
    return cleanup;
  }, [bountyHash]);

  return spentStatus;
}

type ClaimStatusResult = 'LOADING' | 'UNCOLLECTED' | Docs.Claim;

export function useClaimStatus(claimableHash: string) {
  const [spentStatus, setSpentStatus] = useState<ClaimStatusResult>('LOADING');
  async function getClaim() {
    const claim = await wallet.claims.get(claimableHash);
    if (claim === undefined) {
      setSpentStatus('UNCOLLECTED');
    } else {
      setSpentStatus(claim);
    }
  }

  useEffect(() => {
    const cleanup = wallet.on(`key:${claimableHash}`, getClaim); // get the claim
    getClaim();
    return cleanup;
  }, [claimableHash]);

  return spentStatus;
}

function bestTransfer(transfers: Docs.Transfer[]): Docs.Transfer {
  util.mustEqual(transfers.length > 0, true);

  for (const transfer of transfers) {
    if (transfer.status.kind === 'ACKNOWLEDGED') {
      return transfer;
    }
  }
  for (const transfer of transfers) {
    if (transfer.status.kind === 'PENDING') {
      return transfer;
    }
  }

  return transfers[0];
}

export function useTransferByInputOutputHash(inputOutputHash: string): Docs.Transfer | 'LOADING' | 'NONE' {
  const [transfer, setTransfer] = useState<Docs.Transfer | 'LOADING' | 'NONE'>('LOADING');
  async function getAndSet() {
    const transfers = await wallet.transfers
      .where('inputOutputHashes')
      .equals(inputOutputHash)
      .toArray();

    if (transfers.length === 0) {
      setTransfer('NONE');
      return;
    }

    setTransfer(bestTransfer(transfers));
  }
  useEffect(() => {
    const cleanup = wallet.on(`transfers.inputOutputHashes:${inputOutputHash}`, getAndSet);
    getAndSet();
    return cleanup;
  }, [inputOutputHash]);

  return transfer;
}

export function useCoins(): Docs.Coin[] {
  const [claimed, setClaimed] = useState<Docs.Coin[]>([]);

  async function get() {
    const coins = await wallet.coins.toArray();
    setClaimed(coins);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:coins', get);
    get();
    return cleanup;
  }, []);

  return claimed;
}

export function useBalance(): number {
  const [balance, setBalance] = useState(0);

  async function getBalance() {
    setBalance(await wallet.getBalance());
  }

  useEffect(() => {
    const cleanup1 = wallet.on('table:transfers', getBalance);
    const cleanup2 = wallet.on('table:coins', getBalance);

    getBalance();

    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  return balance;
}

export function useUnusedBitcoinAddress(): Docs.BitcoinAddress | undefined {
  const [address, setAddress] = useState<Docs.BitcoinAddress | undefined>(undefined);
  async function getAddress() {
    setAddress(await wallet.getUnusedBitcoinAddress());
  }
  useEffect(() => {
    const listenTo = address ? `hookins.bitcoinAddress:${address.address}` : 'table:hookins';
    return wallet.on(listenTo, getAddress);
  }, [address ? address.address : undefined]);

  useEffect(() => {
    getAddress();
  }, []);

  return address;
}

export function useUnusedDirectAddress(): Docs.DirectAddress | undefined {
  const [directAddress, setDirectAddress] = useState<Docs.DirectAddress | undefined>(undefined);
  async function getAndSetAddress() {
    setDirectAddress(await wallet.getUnusedDirectAddress());
  }
  useEffect(() => {
    const listenTo = directAddress ? `bounties.claimant:${directAddress.address}` : 'table:bounties';
    return wallet.on(listenTo, getAndSetAddress);
  }, [directAddress ? directAddress.address : undefined]);

  useEffect(() => {
    getAndSetAddress();
  }, []);

  return directAddress;
}

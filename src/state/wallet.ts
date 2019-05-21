import { useState, useEffect } from 'react';

import WalletDatabase from '../wallet/database';
import * as Docs from '../wallet/docs';
import * as util from '../util';
import { StoreName } from '../wallet/schema';

const fakeWallet: any = new Error('wallet not initialized');
export let wallet: WalletDatabase = fakeWallet; // typed wrong for convience

export function setWallet(wdb: WalletDatabase) {
  wallet = wdb;
  (window as any)._wallet = wdb;
}

export function useTransfers(): Docs.Transfer[] {
  const [transfers, setTransfers] = useState<Docs.Transfer[]>([]);
  async function getTransfers() {
    const transfers = await wallet.db.getAllFromIndex('transfers', 'by-created');

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
    const t = await wallet.db.get('transfers', transferHash);
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
    const b = await wallet.db.getAll('bounties');
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
    const addresses = await wallet.db.getAllFromIndex('bitcoinAddresses', 'by-index');
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
    // TODO: optimize by hitting index...

    const addresses = await wallet.db.getAll('directAddresses');
    setAddresses(addresses.filter(address => !address.isChange));
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

  const kindedBitcoinAddresses: KindedBitcoinAddress[] = bitcoinAddresses.map(ba => {
    const kba: KindedBitcoinAddress = { kind: 'bitcoin', ...ba };
    return kba;
  });
  const kindedDirectAddresses: KindedDirectAddress[] = directAddresses.map(ba => {
    const kda: KindedDirectAddress = { kind: 'direct', ...ba };
    return kda;
  });

  return [...kindedBitcoinAddresses, ...kindedDirectAddresses];
}

export function useAddressesHookins(bitcoinAddress: string): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);

  async function getAndSet() {
    const hs = await wallet.db.getAllFromIndex('hookins', 'by-bitcoin-address', bitcoinAddress);
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
    const hs = await wallet.db.getAllFromIndex('hookins', 'by-created');
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
    const hs = await wallet.db.getAllFromIndex('hookouts', 'by-created');
    setHookouts(hs);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:hookouts', getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return hookouts;
}

function depromise<T>(p: Promise<T>) {
  const [val, setVal] = useState<T | 'LOADING'>('LOADING');

  useEffect(() => {
    p.then(setVal);
  }, []);

  return val;
}

export function useBitcoinAddress(address: string) {
  return depromise(wallet.db.get('bitcoinAddresses', address));
}

export function useDirectAddress(address: string) {
  return depromise(wallet.db.get('directAddresses', address));
}

export function useBounty(bountyHash: string) {
  return depromise(wallet.db.get('bounties', bountyHash));
}

export function useHookin(hookinHash: string) {
  return depromise(wallet.db.get('hookins', hookinHash));
}

export function useHookout(hookoutHash: string) {
  return depromise(wallet.db.get('hookouts', hookoutHash));
}

interface KindedBounty {
  kind: 'Bounty';
  bounty: Docs.Bounty;
}
interface KindedHookout {
  kind: 'Hookout';
  hookout: Docs.Hookout;
}

export function useBountyOrHookout(outputHash: string): 'LOADING' | undefined | KindedBounty | KindedHookout {
  const bounty = useBounty(outputHash);
  const hookout = useHookout(outputHash);

  if (bounty === 'LOADING' || hookout === 'LOADING') {
    return 'LOADING';
  }

  if (bounty === undefined && hookout === undefined) {
    return undefined;
  }

  if (bounty !== undefined) {
    return { kind: 'Bounty', bounty };
  }
  if (hookout !== undefined) {
    return { kind: 'Hookout', hookout };
  }

  throw new Error('unreachable!');
}

export function useHookinsOfAddress(bitcoinAddress: string): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);

  async function get() {
    wallet.db.getAllFromIndex('hookins', 'by-bitcoin-address', bitcoinAddress).then(hookins => setHookins(hookins));
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
    const claim = await wallet.db.get('claims', bountyHash);
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
    const claim = await wallet.db.get('claims', claimableHash);
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
    const kr = IDBKeyRange.only(inputOutputHash);
    const transfers = await wallet.db.getAllFromIndex('transfers', 'by-input-output-hashes', kr);

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
    const coins = await wallet.db.getAll('coins');
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

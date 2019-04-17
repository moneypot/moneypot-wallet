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

// bountyHash or actual bounty if found
type UseBountiesRet = 'LOADING' | (Docs.Bounty | undefined)[];

export function useBounties(bountyHashes: string[]) {
  const [bounties, setBounties] = useState<UseBountiesRet>('LOADING');

  async function getBounties() {
    const foundBounties = new Array<Docs.Bounty | undefined>(bountyHashes.length);

    for (const [i, bountyHash] of bountyHashes.entries()) {
      foundBounties[i] = await wallet.bounties.get(bountyHash);
    }

    setBounties(foundBounties);
  }

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    for (const bountyHash of bountyHashes) {
      cleanups.push(wallet.on(`key:${bountyHash}`, getBounties));
    }

    getBounties();

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [bountyHashes.join()]);

  return bounties;
}

export function useBitcoinAddresses(): Docs.BitcoinAddress[] {
  const [addresses, setAddresses] = useState<Docs.BitcoinAddress[]>([]);
  async function getAddresses() {
    const addresses = await wallet.bitcoinAddresses.orderBy('index').toArray();
    setAddresses(addresses);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:bitcoinAddresses', getAddresses);
    getAddresses();
    return cleanup;
  }, []);

  return addresses;
}

export function useHookins(): Docs.Hookin[] {
  const [hookins, setHookins] = useState<Docs.Hookin[]>([]);
  const getHookins = async () => {
    const addresses = await wallet.hookins.toArray();
    addresses.sort((a, b) => a.created.getTime() - b.created.getTime());
    setHookins(addresses);
  };
  useEffect(() => {
    const cleanup = wallet.on('table:hookins', getHookins);
    getHookins();
    return cleanup;
  }, []);

  return hookins;
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

export function useHookin(hookinHash: string) {
  return useTableKey(wallet.hookins, hookinHash);
}

export function useHookout(hookoutHash?: string) {
  return useTableKey(wallet.hookouts, hookoutHash);
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

export function useAckdBounties(): Docs.Bounty[] {
  const [bounties, setBounties] = useState<Docs.Bounty[]>([]);

  async function get() {
    await wallet.db.transaction('r', wallet.transfers, wallet.bounties, async () => {
      const transfers = await wallet.transfers
        .where('status.kind')
        .equals('ACKNOWLEDGED')
        .toArray();

      const ackedBounties = new Set<string>();
      for (const transfer of transfers) {
        for (const bountyHash of transfer.bountyHashes) {
          ackedBounties.add(bountyHash);
        }
      }

      const bounties = await wallet.bounties.filter(bounty => ackedBounties.has(bounty.hash)).toArray();
      setBounties(bounties);
    });
  }
  useEffect(() => {
    const bountiesCleanup = wallet.on('table:bounties', get);
    const transferCleanup = wallet.on('table:transfers', get);
    get();
    return () => {
      bountiesCleanup();
      transferCleanup();
    };
  }, []);

  return bounties;
}

type HookinSpentStatus = 'LOADING' | 'UNCOLLECTED' | Docs.Claim;

export function useClaimStatus(hookinHash: string) {
  const [spentStatus, setSpentStatus] = useState<HookinSpentStatus>('LOADING');
  async function getTransfer() {
    const claim = await wallet.claims.get(hookinHash);
    if (claim === undefined) {
      setSpentStatus('UNCOLLECTED');
    } else {
      setSpentStatus(claim);
    }
  }

  useEffect(() => {
    const cleanup = wallet.on(`key:${hookinHash}`, getTransfer); // get the claim
    getTransfer();
    return cleanup;
  }, [hookinHash]);

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

export function useTransferByCoin(coinHash: string): Docs.Transfer | 'LOADING' | 'NONE' {
  const [transfer, setTransfer] = useState<Docs.Transfer | 'LOADING' | 'NONE'>('LOADING');
  async function get() {
    const transfers = await wallet.transfers
      .where('coinHashes')
      .equals(coinHash)
      .toArray();

    if (transfers.length === 0) {
      setTransfer('NONE');
      return;
    }

    setTransfer(bestTransfer(transfers));
  }
  useEffect(() => {
    const cleanup = wallet.on(`transfers.coinHashes:${coinHash}`, get);
    get();
    return cleanup;
  }, [coinHash]);

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
  const [address, setAddress] = useState<Docs.DirectAddress | undefined>(undefined);
  async function getAddress() {
    setAddress(await wallet.getUnusedDirectAddress());
  }
  useEffect(() => {
    const listenTo = address ? `bounties.claimant:${address.claimant}` : 'table:bounties';
    return wallet.on(listenTo, getAddress);
  }, [address ? address.claimant : undefined]);

  useEffect(() => {
    getAddress();
  }, []);

  return address;
}

export function useConfig() {
  const [config, setConfig] = useState<Docs.Config | undefined>();
  async function getAndSet() {
    const c = await wallet.getConfig();
    setConfig(c);
  }

  useEffect(() => {
    const cleanup = wallet.on('table:config', getAndSet);

    getAndSet();

    return cleanup;
  }, []);

  return config;
}

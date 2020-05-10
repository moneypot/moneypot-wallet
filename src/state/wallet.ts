import { useState, useEffect } from 'react';

import * as hi from 'moneypot-lib';

import WalletDatabase from '../wallet/database';
import * as Docs from '../wallet/docs';
import * as util from '../util';

const fakeWallet: any = new Error('wallet not initialized');
export let wallet: WalletDatabase = fakeWallet; // typed wrong for convience

export function setWallet(wdb: WalletDatabase) {
  wallet = wdb;
  (window as any)._wallet = wdb;
}

export function useClaimables(): Docs.Claimable[] {
  const [claimables, setClaimables] = useState<Docs.Claimable[]>([]);

  async function getAndSet() {
    const transfers = await wallet.db.getAllFromIndex('claimables', 'by-created');

    setClaimables(transfers.reverse());
  }

  useEffect(() => {
    const cleanup = wallet.on('table:claimables', getAndSet);
    getAndSet();
    return cleanup;
  }, []);

  return claimables;
}

export function useBitcoinAddresses(): Docs.BitcoinAddress[] {
  const [addresses, setAddresses] = useState<Docs.BitcoinAddress[]>([]);
  async function getAndSetAddresses() {
    const addresses = await wallet.db.getAllFromIndex('bitcoinAddresses', 'by-created');
    addresses.reverse();
    setAddresses(addresses);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:bitcoinAddresses', getAndSetAddresses);
    getAndSetAddresses();
    return cleanup;
  }, []);

  return addresses;
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

export function useClaimable(claimableHash: string) {
  return depromise(wallet.db.get('claimables', claimableHash));
}

export function useClaimableKinds(kind: string) {
  // TODO: index on kind?
  return depromise(wallet.db.getAllFromIndex('claimables', 'by-created').then(cs => cs.filter(c => c.kind === kind).reverse()));
}

export function useHookinsOfAddress(bitcoinAddress: string) {
  return useQueryResult(() => wallet.db.getAllFromIndex('claimables', 'by-bitcoin-address', bitcoinAddress), 'table:claimables') as
    | undefined
    | (Docs.Claimable & hi.POD.Hookin)[];
}

export function useClaimableStatuses(claimableHash: string) {
  return useQueryResult(
    () => wallet.db.getAllFromIndex('statuses', 'by-claimable-hash', claimableHash).then(ss => ss.map(s => util.notError(hi.statusFromPOD(s)))),
    'table:statuses'
  );
}

export function useQueryResult<T>(f: () => Promise<T>, watch: string) {
  const [res, setRes] = useState<T>();

  function getAndSet() {
    f().then(setRes);
  }

  useEffect(() => {
    const cleanup = wallet.on(watch, getAndSet);

    getAndSet();

    return cleanup;
  }, []);

  return res;
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
// bad typing on purpose..
export function getAllClaimables(): any {
  const [claimed, setClaimed] = useState<any[]>([]);

  async function get() {
    const coins = await wallet.db.getAll('claimables');
    setClaimed(coins);
  }
  useEffect(() => {
    const cleanup = wallet.on('table:claimables', get);
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
    const cleanup1 = wallet.on('table:claimables', getBalance);
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
    return wallet.on('table:claimbles', getAddress);
  }, [address ? address.address : undefined]);

  useEffect(() => {
    getAddress();
  }, []);

  return address;
}

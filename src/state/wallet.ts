import { useState, useEffect } from 'react';

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

    setClaimables(transfers);
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

export function useHookinsOfAddress(bitcoinAddress: string): Docs.Claimable[] {
  const [claimables, setClaimables] = useState<Docs.Claimable[]>([]);

  function getAndSet() {
    wallet.db.getAllFromIndex('claimables', 'by-bitcoin-address', bitcoinAddress).then(setClaimables);
  }

  useEffect(() => {
    const cleanup = wallet.on(`table:hookins`, getAndSet);

    getAndSet();

    return cleanup;
  }, [bitcoinAddress]);

  return claimables;
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

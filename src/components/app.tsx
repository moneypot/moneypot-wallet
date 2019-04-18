import React, { useState, useEffect } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from '../state/wallet';
import LoadedApp from './loaded-app';
import Dexie from 'dexie';
import CreateWallet from './create-wallet';
import SelectWallet from './select-wallet';

export default function App() {
  const [existingDbs, setExistingDbs] = useState<string[]>([]);
  useEffect(() => {
    Dexie.getDatabaseNames().then(dbs => {
      setExistingDbs(dbs);
    });
  }, []);

  const [isWalletSet, setIsWalletSet] = useState<boolean>(false);

  if (isWalletSet) {
    return <LoadedApp />;
  }
  if (existingDbs.length < 1) {
    return <CreateWallet setIsWalletSet={setIsWalletSet} />;
  }
  return (
    <SelectWallet setIsWalletSet={setIsWalletSet} />
  );
}



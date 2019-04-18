import React, { useState, useEffect } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from '../state/wallet';
import Dexie from 'dexie';

export default function SelectWallet(props: any) {
  const [existingDbs, setExistingDbs] = useState<string[]>([]);
  useEffect(() => {
    Dexie.getDatabaseNames().then(dbs => {
      setExistingDbs(dbs);

      if (dbs.indexOf('autoload') !== -1) {
        loadWallet('autoload', '');
      }
    });
  }, []);

  async function loadWallet(walletName: string, password: string) {
    const db = new WalletDatabase(walletName);
    const err = await db.unlock(password);
    if (err) {
      alert(err.message);
      return;
    }

    setWallet(db);
    props.setIsWalletSet(true);
  }

  return (
    <div>
      {existingDbs.map(dbName => (
        <LoadableWallet key={dbName} walletName={dbName} load={loadWallet} />
      ))}
    </div>
  );
}

function LoadableWallet({ walletName, load }: { walletName: string; load: (walletName: string, password: string) => void }) {
  const [password, setPassword] = useState('');

  return (
    <div>
      <strong>Wallet: {walletName}</strong>. Password:
      <input type="text" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={() => load(walletName, password)}>Load!</button>
    </div>
  );
}

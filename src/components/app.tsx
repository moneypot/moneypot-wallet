import React, { useState, useEffect } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from '../state/wallet';
import LoadedApp from './loaded-app';
import Dexie from 'dexie';
import CreateWallet from './create-wallet'

export default () => {
  const [existingDbs, setExistingDbs] = useState<string[]>([]);
  useEffect(() => {
    Dexie.getDatabaseNames().then(dbs => {
      setExistingDbs(dbs);

      if (dbs.indexOf('autoload') !== -1) {
        loadWallet('autoload', '');
      }
    });
  }, []);

  const [walletName, setWalletName] = useState('main');
  const [password, setPassword] = useState('');

  const [isWalletSet, setIsWalletSet] = useState<boolean>(false);

  async function createWallet() {
    const db = await WalletDatabase.create(walletName, password);
    if (db instanceof Error) {
      alert(db.message);
      return;
    }

    setWallet(db);
    setIsWalletSet(true);
  }

  async function loadWallet(walletName: string, password: string) {
    const db = new WalletDatabase(walletName);
    const err = await db.unlock(password);
    if (err) {
      alert(err.message);
      return;
    }

    setWallet(db);
    setIsWalletSet(true);
  }

  if (!isWalletSet) {
    return (
      <div>
        {existingDbs.map(dbName => (
          <LoadableWallet key={dbName} walletName={dbName} load={loadWallet} />
        ))}
        <h2>Create Wallet</h2>
        <b>Wallet Name: </b>
        <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} />
        <br />
        <b>Password: </b>
        <input type="text" value={password} onChange={e => setPassword(e.target.value)} />
        <br />
        <button onClick={createWallet}>Create Wallet</button>
      </div>
    );
  }

  return <LoadedApp />;
};

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

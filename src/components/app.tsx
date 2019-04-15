import React, { useState } from 'react';

import WalletDatabase from '../wallet/database';

import  { setWallet } from '../state/wallet'
import LoadedApp from './loaded-app';


export default () => {
  console.log('wallet.app re-rendering');

  const [walletName, setWalletName] = useState("main");
  const [password, setPassword] = useState("");

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

  async function loadWallet() {
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
    return (<div>
      <b>Wallet Name: </b><input type="text" value={walletName} onChange={ e => setWalletName(e.target.value) } /><br />
      <b>Password: </b><input type="text" value={password} onChange={ e => setPassword(e.target.value) } /><br />
      <button onClick={ createWallet }>Create Wallet</button>
      <button onClick={ loadWallet }>Load Wallet</button>
    </div>)
  }

  return <LoadedApp />

};

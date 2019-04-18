import React, { useState } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from "../state/wallet";

export default (props: any) => {
  const [walletName, setWalletName] = useState('main');
  const [password, setPassword] = useState('');

  async function createWallet() {
    const db = await WalletDatabase.create(walletName, password);
    if (db instanceof Error) {
      alert(db.message);
      return;
    }
    setWallet(db);
    props.setIsWalletSet(true);
  }
    return (
      <div>
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



import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import SubNavbar from './sub-navbar';

import { wallet } from '../../state/wallet';

export default function ReceiveLightning(props: RouteComponentProps) {
  const [memo, setMemo] = useState('deposit');
  const [amount, setAmount] = useState('0');

  async function genInvoice() {
    const amountInt = Number.parseInt(amount);
    if (!Number.isFinite(amountInt) || amountInt < 0) {
      console.warn('amount must be an integer >= 0');
      return;
    }

    const res = await wallet.requestLightningInvoice(memo, amountInt);

    props.history.push(`/claimables/${res.hash}`, res);
  }

  return (
    <div>
      <SubNavbar/>
      <h1>Gen Lightning Invoice:</h1>
      Memo: <input type="text" value={memo} onChange={e => setMemo(e.target.value)} />
      <br />
      Amount: <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
      <button onClick={() => genInvoice()}>Gen!</button>
    </div>
  );
}

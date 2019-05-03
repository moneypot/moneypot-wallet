import * as hi from 'hookedin-lib';
import React, { useState } from 'react';

import { wallet } from '../state/wallet';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | undefined>();

  const send = async () => {
    const address = toText;
    // TODO: proper validation...
    if (address.length < 5 || address.length > 100) {
      setError('invalid address');
      return;
    }

    const isBitcoinSend =
      address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('2') || address.startsWith('3');

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('invalid amount');
      return;
    }

    let transferHash: 'NOT_ENOUGH_FUNDS' | hi.Hash;

    if (isBitcoinSend) {
      const feeRate = 0.25;

      transferHash = await wallet.sendToBitcoinAddress(address, amount, feeRate);
    } else {
      const to = hi.PublicKey.fromPOD(address);
      if (to instanceof Error) {
        console.warn('could not parse address, got: ', to);
        setError('invalid direct address');
        return;
      }

      transferHash = await wallet.sendDirect(to, amount);
    }

    if (transferHash === 'NOT_ENOUGH_FUNDS') {
      setError('not enough funds');
      return;
    }

    history.push(`/transfers/${transferHash.toPOD()}`);
  };

  return (
    <div>
      <h3>Send Bitcoin</h3>
      <p>{error}</p>
      To: <input type="text" value={toText} placeholder="bitcoin address (or direct address)" onChange={event => setToText(event.target.value)} />
      <br />
      Amount: <input type="text" value={amountText} onChange={event => setAmountText(event.target.value)} /> satoshis
      <br />
      <button onClick={send}>Send!</button>
    </div>
  );
}

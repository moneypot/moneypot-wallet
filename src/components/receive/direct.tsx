import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedDirectAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';

function show(addressDoc: Docs.DirectAddress) {
  return (
    <ReceiveContainer page="direct">
    <div>
      <h3>Receive Direct</h3>
      <p>
        <small>
          Direct Sends (hookedin->hookedin) is the ideal way to send bitcoin. Instant (no confirmations required), irreversible, highly private and insanely
          cheap!
        </small>
      </p>
      <br />
      Address: <code>{addressDoc.address}</code>
      <TheQr text={addressDoc.address.toUpperCase()} />
      <button onClick={() => wallet.checkDirectAddress(addressDoc)}>Check</button>
      <hr />
      <Link to="/addresses">Addresses</Link>
    </div>
    </ReceiveContainer>
  );
}

export default function Receive(props: any) {
  const address = useUnusedDirectAddress();

  if (address === undefined) {
    return <ReceiveContainer><p>Loading...</p></ReceiveContainer>;
  }

  return show(address);
}

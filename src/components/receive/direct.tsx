import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedDirectAddress } from '../../state/wallet';

function show(addressDoc: Docs.DirectAddress) {
  return (
    <div>
      <h1>Receive Direct</h1>
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
    </div>
  );
}

export default function Receive() {
  const address = useUnusedDirectAddress();

  if (address === undefined) {
    return <p>Loading...</p>;
  }

  return show(address);
}

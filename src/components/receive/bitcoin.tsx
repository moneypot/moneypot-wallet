import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';

function show(addressDoc: Docs.BitcoinAddress) {
  return (
    <div>
      <h3>Receive Bitcoin</h3>
      <p>
        <small>
          After N confirmations, funds will be usable. For faster, cheaper and more private transfers, you can use hookedin->hookedin with a direct send
        </small>
      </p>
      Address: <code>{addressDoc.address}</code>
      <TheQr text={addressDoc.address.toUpperCase()} />
      <button onClick={() => wallet.checkBitcoinAddress(addressDoc)}>Check</button>
      <hr />
      <Link to="/addresses">Addresses</Link>
    </div>
  );
}

export default function Receive() {
  const address = useUnusedBitcoinAddress();

  if (address === undefined) {
    return <p>Loading...</p>;
  }

  return show(address);
}

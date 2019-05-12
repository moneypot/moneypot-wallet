import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';

function show(addressDoc: Docs.BitcoinAddress) {
  return (
    <ReceiveContainer page="bitcoin">
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
    </ReceiveContainer>
  );
}

export default function Receive(props: any) {
  const address = useUnusedBitcoinAddress();

  if (address === undefined) {
    return(
    <ReceiveContainer>
    <p>Loading...</p>
    </ReceiveContainer>
    );
  }

  return show(address);
}

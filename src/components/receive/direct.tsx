import React, { useState, useEffect } from 'react';
// @ts-ignore
import { TheQr } from 'the-qr';
import { Button } from 'reactstrap';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedDirectAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';

function show(addressDoc: Docs.DirectAddress) {
  return (
    <div>
      <h3>Receive</h3>
      <ReceiveContainer page="direct">
        <p>
          <small>
            Direct Sends (hookedin->hookedin) is the ideal way to send bitcoin. Instant (no confirmations required), irreversible, highly private and insanely
            cheap!
          </small>
        </p>
        <br />
        Address: <code>{addressDoc.address}</code>
        <TheQr text={addressDoc.address.toUpperCase()} />
        <Button onClick={() => wallet.checkDirectAddress(addressDoc)}>Check</Button>
      </ReceiveContainer>
    </div>
  );
}

export default function Receive(props: any) {
  const address = useUnusedDirectAddress();

  if (address === undefined) {
    return (
      <ReceiveContainer>
        <p>Loading...</p>
      </ReceiveContainer>
    );
  }

  return show(address);
}

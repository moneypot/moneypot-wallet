import React from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';
import { Button } from 'reactstrap';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';

function show(addressDoc: Docs.BitcoinAddress) {
  return (
    <div>
      <h3>Receive</h3>
      <ReceiveContainer page="bitcoin">
        <p>
          <small>
            After N confirmations, funds will be usable. For faster, cheaper and more private transfers, you can use{' '}
            <Link to="/receive/direct">hookedin->hookedin direct</Link>
          </small>
        </p>
        Address: <code>{addressDoc.address}</code>
        <TheQr text={addressDoc.address.toUpperCase()} />
        <Button onClick={() => wallet.checkBitcoinAddress(addressDoc)}>Check</Button>
      </ReceiveContainer>
    </div>
  );
}

export default function Receive(props: any) {
  const address = useUnusedBitcoinAddress();

  if (address === undefined) {
    return (
      <ReceiveContainer>
        <p>Loading...</p>
      </ReceiveContainer>
    );
  }

  return show(address);
}

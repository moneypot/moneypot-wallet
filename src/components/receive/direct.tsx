import React from 'react';
// @ts-ignore
import { TheQr } from 'the-qr';
import { Button } from 'reactstrap';

import * as Docs from '../../wallet/docs';
import { wallet, useUnusedDirectAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';
import './receive.scss';
import Note from './note';

function show(addressDoc: Docs.DirectAddress) {
  return (
    <div>
      <h3>Receive</h3>
      <ReceiveContainer page="direct">
        <p>
          This is a <b>direct address</b>, the transaction is instant(no confirmations required), irreversible, secure, highly private and super cheap . But
          only works with other hookedin wallets.
        </p>
        <TheQr text={addressDoc.address.toUpperCase()} />
        <h5>Address</h5>
        <div className="address-text-container">
          <code>{addressDoc.address}</code>{' '}
          <Button color="light">
            <i className="fa fa-copy" />
          </Button>
        </div>
        <Note />
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

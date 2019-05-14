import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import { TheQr } from 'the-qr';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './receive.scss';
import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';
import ReceiveContainer from '../../containers/receive-container';

function show(addressDoc: Docs.BitcoinAddress) {
  return (
    <div>
      <h3>Receive</h3>
      <ReceiveContainer page="bitcoin">
        <p>This is a normal <b>bitcoin address</b>. Use this if you're expecting money from the bitcoin network.</p>

        <TheQr text={addressDoc.address.toUpperCase()} />
        <h5>Address</h5>
        <div className="address-text-container">
          <code>{addressDoc.address}</code>{' '}

          <Button color="light" ><FontAwesomeIcon icon="copy" /></Button>

        </div>
  <div className="text-container">
        <p className="text-muted">
          <span><FontAwesomeIcon icon="info-circle" />{' '}</span>
            After N confirmations, funds will be usable. For faster, cheaper and more private transfers, you can use{' '}
            <Link to="/receive/direct">Hookedin-> Hookedin direct.</Link>
        </p>
  </div>
        <Button color="secondary" onClick={() => wallet.checkBitcoinAddress(addressDoc)}>Check</Button>
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


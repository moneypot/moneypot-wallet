import React from 'react';
// @ts-ignore
import { TheQr } from 'the-qr';
import { Button } from 'reactstrap';
import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';
import Note from './note';

function show(addressDoc: Docs.BitcoinAddress) {
  return (
    <div>
      <h3>Receive</h3>
      <div className="inner-container">
        <TheQr text={addressDoc.address.toUpperCase()} />
        <h5>Address</h5>
        <div className="address-text-container">
          <code>{addressDoc.address}</code>{' '}
          <Button color="light">
            <i className="fa fa-copy" />
          </Button>
        </div>
        <div className="text-container">
          <p className="text-muted">
            <span>
              <i className="fa fa-info-circle" />{' '}
            </span>
            After N confirmations, funds will be usable.
          </p>
        </div>
        <Note />
        <Button color="secondary" onClick={() => wallet.checkBitcoinAddress(addressDoc)}>
          Check
        </Button>
      </div>
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

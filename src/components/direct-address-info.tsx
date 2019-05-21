import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as Docs from '../wallet/docs';
import { wallet, useDirectAddress } from '../state/wallet';
import * as Util from '../util';

// @ts-ignore
import { TheQr } from 'the-qr';

function render(directAddress: Docs.DirectAddress) {
  return (
    <div>
      <h3>{directAddress.address}</h3>
      <TheQr text={directAddress.address.toUpperCase()} />
      <button onClick={() => wallet.checkDirectAddress(directAddress)}>Check</button>
      <hr />
      <Link to="/addresses">Addresses</Link>
      <hr />
      <h3>Raw Info</h3>
      <code>
        <pre>{JSON.stringify(directAddress, null, 2)}</pre>
      </code>
    </div>
  );
}

export default function DirectAddressInfo(props: RouteComponentProps<{ address: string }>) {
  const address = props.match.params.address;

  const directAddressDoc = useDirectAddress(address);

  if (directAddressDoc === 'LOADING') {
    return <div>{directAddressDoc}</div>;
  }
  if (directAddressDoc === undefined) {
    return <div>not found</div>;
  }

  return render(directAddressDoc);
}

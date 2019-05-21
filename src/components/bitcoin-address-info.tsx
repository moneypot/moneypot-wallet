import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as Docs from '../wallet/docs';
import { wallet, useAddressesHookins, useBitcoinAddress } from '../state/wallet';
import * as Util from '../util';

// @ts-ignore
import { TheQr } from 'the-qr';
import HookinsTable from './hookins-table';

export default function BitcoinAddressInfo(props: RouteComponentProps<{ address: string }>) {
  const address = props.match.params.address;

  const addressDoc = useBitcoinAddress(address);

  if (addressDoc === 'LOADING') {
    return <div>{addressDoc}</div>;
  }
  if (addressDoc === undefined) {
    return <div>not found</div>;
  }

  return <RenderAddress address={addressDoc} />;
}

function RenderAddress({ address: addressDoc }: { address: Docs.BitcoinAddress }) {
  const hookins = useAddressesHookins(addressDoc.address);

  return (
    <div>
      <h1>{addressDoc.address}</h1>
      <TheQr text={addressDoc.address.toUpperCase()} />
      <button onClick={() => wallet.checkBitcoinAddress(addressDoc)}>Check</button>
      <hr />
      <Link to="/addresses">Addresses</Link>
      <hr />
      <h3>Hookins ({hookins.length})</h3>
      <HookinsTable hookins={hookins} />
      <hr />
      <h4>raw address</h4>
      <code>
        <pre>{JSON.stringify(addressDoc, null, 2)}</pre>
      </code>
    </div>
  );
}

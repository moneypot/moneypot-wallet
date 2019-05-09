import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as Docs from '../wallet/docs';
import { wallet, useAddressesHookins } from '../state/wallet';
import * as Util from '../util';

// @ts-ignore
import { TheQr } from 'the-qr';
import HookinsTable from './hookins-table';

export default function BitcoinAddressInfo(props: RouteComponentProps<{ id: string }>) {
  const address = props.match.params.id;

  const [bitcoinAddress, setHBitcoinAddress] = useState<Docs.BitcoinAddress | undefined>(undefined);
  useEffect(() => {
    wallet.bitcoinAddresses.get(address).then(doc => {
      setHBitcoinAddress(Util.mustExist(doc));
    });
  }, [address]);

  if (bitcoinAddress === undefined) {
    return <div>Loading..</div>;
  }

  return <RenderAddress address={bitcoinAddress} />;
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

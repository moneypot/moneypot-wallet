import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as Docs from '../../wallet/docs';
import { wallet, useBitcoinAddress, useHookinsOfAddress } from '../../state/wallet';

// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import HookinsTable from './hookins-table';
import { Button } from 'reactstrap';

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
  const hookins = useHookinsOfAddress(addressDoc.address) || [];

  // color="primary"
  return (
    <div>
      <h1>{addressDoc.address}</h1>
      <TheQr text={addressDoc.address.toUpperCase()} />
      <Button onClick={() => wallet.checkBitcoinAddress(addressDoc)}>Check</Button>
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


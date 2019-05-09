import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as Docs from '../wallet/docs';
import { wallet } from '../state/wallet';
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
      <code>
        <pre>{JSON.stringify(directAddress, null, 2)}</pre>
      </code>
    </div>
  );
}

export default function DirectAddressInfo(props: RouteComponentProps<{ id: string }>) {
  const address = props.match.params.id;

  const [directAddress, setDirectAddress] = useState<Docs.DirectAddress | undefined>(undefined);
  useEffect(() => {
    wallet.directAddresses.get(address).then(doc => {
      setDirectAddress(Util.mustExist(doc));
    });
  }, [address]);

  if (directAddress === undefined) {
    return <div>Loading..</div>;
  }

  return render(directAddress);
}

import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import * as Docs from '../wallet/docs';
import wallet from '../state/wallet';
import * as Util from '../util';

function render(bitcoinAddress: Docs.BitcoinAddress) {
  return (
    <div>
      <h1>Bitcoin Address: {bitcoinAddress.address}</h1>
      <code>
        <pre>{JSON.stringify(bitcoinAddress.address, null, 2)}</pre>
      </code>
    </div>
  );
}

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

  return render(bitcoinAddress);
}

import React, { useState, useEffect } from 'react';

import { wallet, useBitcoinAddresses, useHookinsOfAddress } from '../state/wallet';

import * as Docs from '../wallet/docs';
import { Link } from 'react-router-dom';

export default function Addresses() {
  const bitcoinAddresses = useBitcoinAddresses();

  return (
    <div>
      Bitcoin Addresses: {bitcoinAddresses.length}
      <div>
        <ul>
          {bitcoinAddresses.map(bitcoinAddress => (
            <li key={bitcoinAddress.address}>
              {bitcoinAddress.index} :: <Link to={`/bitcoin-address-info/${bitcoinAddress.address}`}>{bitcoinAddress.address}</Link> ::
              <Received address={bitcoinAddress} /> :: <button onClick={() => wallet.checkBitcoinAddress(bitcoinAddress)}>Check</button>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={() => wallet.newBitcoinAddress()}>New Bitcoin Address</button>
    </div>
  );
}

function Received(props: { address: Docs.BitcoinAddress }) {
  const hookins = useHookinsOfAddress(props.address.address);

  let sum = 0;
  for (const hookin of hookins) {
    sum += hookin.amount;
  }

  return <span style={{ color: sum === 0 ? 'grey' : 'black' }}>Total Received: {(sum / 1e8).toFixed(8)} btc</span>;
}

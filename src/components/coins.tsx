import React from 'react';

import * as Docs from '../wallet/docs';
import { useCoins, useTransferByInputOutputHash } from '../state/wallet';
import { Link } from 'react-router-dom';

export default function Coins() {
  const coins = useCoins();

  return (
    <div>
      <h1>Coins ({coins.length})</h1>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Owner</th>
            <th>Magnitude</th>
            <th>ClaimHash</th>
          </tr>
        </thead>
        <tbody>
          {coins.map(coin => (
            <ClaimedCoin key={coin.owner} coin={coin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimedCoin({ coin }: { coin: Docs.Coin }) {
  const transfer = useTransferByInputOutputHash(coin.hash);
  const status = typeof transfer === 'string' ? transfer : transfer.status.kind;

  return (
    <tr>
      <td>{status}</td>
      <td>
        <code>{coin.owner}</code>
      </td>
      <td>{coin.magnitude}</td>
      <td>
        <code>
          <Link to={`/claims/${coin.claimHash}`}>{coin.claimHash}</Link>
        </code>
      </td>
    </tr>
  );
}

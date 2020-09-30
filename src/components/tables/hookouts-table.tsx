import React from 'react';
import * as hi from 'moneypot-lib';
import { Link } from 'react-router-dom';
import * as Docs from '../../wallet/docs';

export default function HookoutsTable({ hookouts }: { hookouts: (Docs.Claimable & hi.POD.Hookout)[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>bitcoin address</th>
          <th>amount</th>
          <th>created</th>
          <th>memo?</th>
        </tr>
      </thead>
      <tbody>
        {hookouts.map(hookout => (
          <Hookout key={hookout.hash} hookoutDoc={hookout as Docs.Claimable & hi.POD.Hookout} />
        ))}
      </tbody>
    </table>
  );
}

function Hookout({ hookoutDoc }: { hookoutDoc: Docs.Claimable & hi.POD.Hookout }) {
  const memo = localStorage.getItem(hookoutDoc.hash);
  return (
    <tr>
      <td>
        <Link to={`/claimables/${hookoutDoc.hash}`}>{hookoutDoc.hash.substring(0, 32)}...</Link>
      </td>
      <td>
        {' '}
        <a href={`https://blockstream.info/testnet/address/${hookoutDoc.bitcoinAddress}`} target="_blank" rel="noreferrer">
          {hookoutDoc.bitcoinAddress}
        </a>
      </td>
      <td>{hookoutDoc.amount} sats</td>
      <td>{hookoutDoc.created.toISOString()}</td>
      <td>{memo === undefined ? 'No memo' : memo}</td>
    </tr>
  );
}

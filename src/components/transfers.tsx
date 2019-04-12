import React from 'react';

import { useTransfers, useBounties, useHookout } from '../state/wallet';
import { Link } from 'react-router-dom';

import * as Docs from '../wallet/docs';

export default function Transfers() {
  const transfers = useTransfers();

  return (
    <div>
      <h1>Transfers ({transfers.length})</h1>
      <table>
        <thead>
          <tr>
            <th colSpan={2}>Input</th>
            <th>Bounties</th>
            <th>Hookouts</th>
            <th>Created</th>
            <th>Kind</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(transfer => (
            <Transfer transfer={transfer} key={transfer.hash} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Transfer({ transfer }: { transfer: Docs.Transfer }) {
  const bounties = useBounties(transfer.bountyHashes);

  const hookout = useHookout(transfer.hookoutHash);

  const hookoutInfo = transfer.hookoutHash ? (
    <pre>
      <code>{JSON.stringify(hookout, null, 2)} </code>
    </pre>
  ) : (
    <span>none</span>
  );

  const bountyList =
    bounties === 'LOADING'
      ? 'loading..'
      : bounties.map((bounty, i) => (
          <div key={i}>
            <textarea cols={50} rows={8} value={JSON.stringify(bounty, null, 2)} readOnly />
          </div>
        ));

  return (
    <tr>
      <td>
        <Link to={`/transfers/${transfer.hash}`}>#</Link>
      </td>
      <td>
        <textarea cols={50} rows={8} value={JSON.stringify(transfer.inputs, null, 2)} readOnly />
      </td>
      <td>{bountyList}</td>
      <td>{hookoutInfo}</td>
      <td>{transfer.created.toISOString()}</td>
      <td>{transfer.status.kind}</td>
    </tr>
  );
}

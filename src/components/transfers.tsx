import React from 'react';

import { useTransfers, useHookout } from '../state/wallet';
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
            <th>Output</th>
            <th>Change</th>
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
  const output = useHookout(transfer.outputHash);

  return (
    <tr>
      <td>
        <Link to={`/transfers/${transfer.hash}`}>#</Link>
      </td>
      <td>
        <textarea cols={50} rows={8} value={JSON.stringify(transfer.inputs, null, 2)} readOnly />
      </td>
      <td>{JSON.stringify(output, null, 2)}</td>
      <td>{JSON.stringify(transfer.change, null, 2)}</td>
      <td>{transfer.created.toISOString()}</td>
      <td>{transfer.status.kind}</td>
    </tr>
  );
}

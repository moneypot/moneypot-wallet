import React from 'react';
import * as hi from 'moneypot-lib';
import { Link } from 'react-router-dom';
import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import { useClaimableStatuses } from '../../state/wallet';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import Failed from 'moneypot-lib/dist/status/failed';
import { Table } from 'reactstrap';
import useSortableData from './table-util';

export default function HookoutsTable({ hookouts }: { hookouts: (Docs.Claimable & hi.POD.Hookout)[] }) {
  let filteredHookouts = [];
  for (const hookout of hookouts) {
    const memo = localStorage.getItem(hookout.hash);

    const statuses = useClaimableStatuses(hookout.hash);
    let statusT: string | undefined = undefined;
    if (statuses) {
      for (const status of statuses) {
        if (status instanceof BitcoinTransactionSent) {
          statusT = 'SENT';
        }
        if (status instanceof Failed) {
          statusT = 'FAILED';
        }
      }
    }
    if (!statusT) {
      statusT = 'UNKNOWN'; // PENDING
    }

    filteredHookouts.push({ hash: hookout.hash, address: hookout.bitcoinAddress, amount: hookout.amount, created: hookout.created, memo, status: statusT });
  }

  const { items, requestSort, sortConfig } = useSortableData(filteredHookouts, null);
  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  return (
    <Table hover className="table">
      <thead>
        <tr>
          <th>
            <button type="button" onClick={() => requestSort('hash')} className={getClassNamesFor('hash')}>
              hash
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('address')} className={getClassNamesFor('address')}>
              payment
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('amount')} className={getClassNamesFor('amount')}>
              amount
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('memo')} className={getClassNamesFor('memo')}>
              memo
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('status')} className={getClassNamesFor('status')}>
              status
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('created')} className={getClassNamesFor('created')}>
              created
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.hash}>
            <td>
              <Link to={`/claimables/${item.hash}`}>{item.hash.substring(0, 32)}...</Link>
            </td>
            <td>
              {' '}
              <a href={`https://blockstream.info/testnet/address/${item.address}`} target="_blank" rel="noreferrer">
                {item.address}
              </a>
            </td>
            <td>{item.amount}</td>
            <td>{item.memo}</td>
            <td>
              {item.status === 'SENT' ? (
                <p>
                  <i className="fad fa-check" /> SENT
                </p>
              ) : item.status === 'FAILED' ? (
                <p>
                  <i className="fad fa-times" /> FAILED
                </p>
              ) : item.status === 'UNKNOWN' ? (
                <p>
                  <i className="fad fa-question" /> UNKNOWN
                </p>
              ) : (
                undefined
              )}
            </td>
            <td>{item.created.toISOString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
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

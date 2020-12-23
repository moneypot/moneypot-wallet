import React, { useMemo } from 'react';
import * as hi from 'moneypot-lib';
import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import { useClaimableStatuses, getAllStatuses } from '../../state/wallet';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import Failed from 'moneypot-lib/dist/status/failed';
import { CustomTable } from './table-util';
import { Link } from 'react-router-dom';

export default function HookoutsTable({ hookouts }: { hookouts: (Docs.Claimable & hi.POD.Hookout)[] }) {
  let filteredHookouts = [];
  const statuses = getAllStatuses();
  for (const hookout of hookouts) {
    const memo = localStorage.getItem(hookout.hash);
    // this is too slow
    //  const statuses = useClaimableStatuses(hookout.hash);

    let statusT: string | undefined = undefined;
    let txid: string | undefined = undefined;
    if (statuses) {
      // this stuff is sooo slow
      for (const status of statuses) {
        if (status.claimableHash.toPOD() === hookout.hash) {
          if (status instanceof BitcoinTransactionSent) {
            statusT = 'SENT';
            txid = hi.Buffutils.toHex(status.txid);
          }
          if (status instanceof Failed) {
            statusT = 'FAILED';
          }
        }
      }
    }
    if (!statusT) {
      statusT = 'UNKNOWN'; // PENDING
    }

    filteredHookouts.push({
      hash: hookout.hash,
      address: hookout.bitcoinAddress,
      amount: hookout.amount,
      memo,
      status: statusT,
      txid: txid,
      created: hookout.created.toString(),
    });
  }

  const columns = useMemo(
    () => [
      {
        Header: 'Hookouts',
        columns: [
          {
            Header: 'Hash',
            accessor: 'hash',
            Cell: (e: { value: React.ReactNode }) => <Link to={`/claimables/${e.value}`}>{e.value}</Link>,
          },
          {
            Header: 'Address',
            accessor: 'address',
            Cell: (e: { value: React.ReactNode }) => (
              <a href={`https://blockstream.info/address/${e.value}`} target="_blank" rel="noreferrer">
                {' '}
                {e.value}
              </a>
            ),
          },
          {
            Header: 'Amount',
            accessor: 'amount',
          },
          {
            Header: 'Memo',
            accessor: 'memo',
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Txid',
            accessor: 'txid',
            Cell: (e: { value: React.ReactNode }) => (
              <a href={`https://blockstream.info/tx/${e.value}`} target="_blank" rel="noreferrer">
                {e.value}
              </a>
            ),
          },
          {
            Header: 'Created',
            accessor: 'created',
          },
        ],
      },
    ],
    []
  );

  return <CustomTable columns={columns} data={filteredHookouts} />;
}

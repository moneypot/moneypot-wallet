import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { wallet, useClaimableStatuses, getAllStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import HookinAccepted from 'moneypot-lib/dist/status/hookin-accepted';
import { CustomTable } from './table-util';
// import Claimed from 'moneypot-lib/dist/status/claimed';

function x(hookin: Docs.Claimable & hi.POD.Hookin) {
  return (
    <button
      type="button"
      onClick={() => {
        const hook = notError(hi.Hookin.fromPOD(hookin));
        wallet.acknowledgeClaimable(hook);
      }}
    >
      Claim
    </button>
  );
}

export default function HookinsTable({ hookins }: { hookins: (Docs.Claimable & hi.POD.Hookin)[] }) {
  let filteredHookins = [];
  const statuses = getAllStatuses();

  for (const hookin of hookins) {
    const memo = localStorage.getItem(hookin.hash);
    // too slow
    // const statuses = useClaimableStatuses(hookin.hash);
    let statusT: string | undefined = undefined;
    if (statuses) {
      for (const status of statuses) {
        if (status.claimableHash.toPOD() === hookin.hash) {
          if (status instanceof HookinAccepted) {
            statusT = 'ACCEPTED';
          }
        }
      }
    }
    if (!hookin.acknowledgement) {
      statusT = 'UNACKED';
    }
    if (!statusT) {
      statusT = 'UNKNOWN';
    }

    filteredHookins.push({
      hash: hookin.hash,
      address: hookin.bitcoinAddress,
      amount: hookin.amount,
      txid: hookin.txid,
      status: statusT,
      memo,
      created: hookin.created.toString(),
      hookin,
    });
  }

  const columns = useMemo(
    () => [
      {
        Header: 'Hookins',
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
            Header: 'Txid',
            accessor: 'txid',
            Cell: (e: { value: React.ReactNode }) => (
              <a href={`https://blockstream.info/txid/${e.value}`} target="_blank" rel="noreferrer">
                {e.value}
              </a>
            ),
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Memo',
            accessor: 'memo',
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

  return <CustomTable columns={columns} data={filteredHookins} />;
}

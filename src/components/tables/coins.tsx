import React, { useMemo } from 'react';
import { useCoins, getSpendingClaimables } from '../../state/wallet';
import { CustomTable } from './table-util';
import { Link } from 'react-router-dom';

// TODO: table loading times for < 500 coins is stupid. We can pagify it, but of what use would it be then?
export default function Coins() {
  const coins = useCoins();
  const claimableInputs = getSpendingClaimables();

  let filteredCoins = [];
  for (const coin of coins) {
    let claimable: string | undefined;
    let ack: string | undefined;
    for (const c of claimableInputs) {
      const e = c.inputs;
      for (const k of e) {
        if (coin.owner === k.owner) {
          claimable = c.hash;
        }
        if (c.acknowledgement) {
          ack = 'ACKED';
        }
      }
    }

    if (!claimable) {
      claimable = 'UNSPENT';
    }

    if (!ack) {
      ack = 'UNACKED';
    }

    filteredCoins.push({ hash: coin.hash, claimable, ack, owner: coin.owner, magnitude: coin.magnitude, origin: coin.claimableHash });
  }
  const columns = useMemo(
    () => [
      {
        Header: 'Coins',
        columns: [
          {
            Header: 'Hash',
            accessor: 'hash',
            Cell: (e: { value: React.ReactNode }) => <Link to={`/coins/${e.value}`}>{e.value}</Link>,
          },
          {
            Header: 'Claimable',
            accessor: 'claimable',
          },
          {
            Header: 'Ack',
            accessor: 'ack',
          },
          {
            Header: 'Owner',
            accessor: 'owner',
          },
          {
            Header: 'Magnitude',
            accessor: 'magnitude',
          },
          {
            Header: 'Origin',
            accessor: 'origin',
            Cell: (e: { value: React.ReactNode }) => <Link to={`/claimables/${e.value}`}>{e.value}</Link>,
          },
        ],
      },
    ],
    []
  );

  return (
    <div>
      <h1>All Coins ({coins.length})</h1>
      <CustomTable columns={columns} data={filteredCoins} />
    </div>
  );
}

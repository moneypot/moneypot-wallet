import React from 'react';
import * as Docs from '../../wallet/docs';
import { useCoins, getSpendingClaimables } from '../../state/wallet';
import { Link } from 'react-router-dom';
import * as mp from 'moneypot-lib';
import { Table } from 'reactstrap';
import useSortableData from './table-util';

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

  const { items, requestSort, sortConfig } = useSortableData(filteredCoins, null);
  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };
  // TODO: this is soo slow @ large wallets.
  return (
    <div>
      <h1>Coins ({coins.length})</h1>
      {/* <table style={{ borderSpacing: '3px', borderCollapse: 'separate' }}> */}
      <Table hover className="table">
        <thead>
          <tr>
            <th>
              <button type="button" onClick={() => requestSort('claimable')} className={getClassNamesFor('claimable')}>
                Spent in
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('ack')} className={getClassNamesFor('ack')}>
                Spent ack'd
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('owner')} className={getClassNamesFor('owner')}>
                owner
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('magnitude')} className={getClassNamesFor('magnitude')}>
                magnitude
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('origin')} className={getClassNamesFor('origin')}>
                origin
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.hash}>
              <td>{item.claimable === 'UNSPENT' ? <p>UNSPENT</p> : <Link to={`/claimables/${item.claimable}`}>{item.claimable}</Link>}</td>
              <td>{item.ack}</td>
              <td>{item.owner}</td>
              <td>{item.magnitude}</td>

              <td>
                <code>
                  <Link to={`/claimables/${item.origin}`}>{item.origin}</Link>
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { wallet, useClaimableStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import HookinAccepted from 'moneypot-lib/dist/status/hookin-accepted';
import useSortableData from './table-util';
// import Claimed from 'moneypot-lib/dist/status/claimed';
import { Table } from 'reactstrap';

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
  for (const hookin of hookins) {
    const memo = localStorage.getItem(hookin.hash);

    const statuses = useClaimableStatuses(hookin.hash);
    let statusT: string | undefined = undefined;
    if (statuses) {
      for (const status of statuses) {
        if (status instanceof HookinAccepted) {
          statusT = 'ACCEPTED';
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
      created: hookin.created,
      hookin,
    });
  }

  const { items, requestSort, sortConfig } = useSortableData(filteredHookins, null);
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
            <button type="button" onClick={() => requestSort('txid')} className={getClassNamesFor('txid')}>
              txid
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
            <td>
              {/* don't think this is necessary anymore */}
              {item.txid != undefined ? (
                <a href={`https://blockstream.info/testnet/tx/${item.txid}?input:${item.hookin.vout}`} target="_blank" rel="noreferrer">
                  {item.txid}...
                  {/* .substring(0, 8) */}
                </a>
              ) : (
                undefined
              )}
            </td>
            <td>{item.memo}</td>
            <td>
              {item.status === 'ACCEPTED' ? (
                <p>
                  <i className="fad fa-check" /> ACCEPTED
                </p>
              ) : item.status === 'UNACKED' ? (
                x(item.hookin)
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

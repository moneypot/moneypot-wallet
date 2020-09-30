import React from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { wallet } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';

export default function HookinsTable({ hookins }: { hookins: (Docs.Claimable & hi.POD.Hookin)[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>address</th>
          <th>amount</th>
          <th>tx</th>
          <th>ackd</th>
          <th>memo</th>
          <th>created</th>
        </tr>
      </thead>
      <tbody>
        {hookins.map(hookin => (
          <Hookin key={hookin.hash} hookinDoc={hookin} />
        ))}
      </tbody>
    </table>
  );
}

function Hookin({ hookinDoc }: { hookinDoc: Docs.Claimable & hi.POD.Hookin }) {
  const memo = localStorage.getItem(hookinDoc.bitcoinAddress);

  function renderAckStatus() {
    if (hookinDoc.acknowledgement) {
      return <span>Acknowledged</span>;
    }

    return (
      <button
        onClick={() => {
          const hookin = notError(hi.Hookin.fromPOD(hookinDoc));
          wallet.acknowledgeClaimable(hookin);
        }}
      >
        Claim
      </button>
    );
  }

  return (
    <tr>
      <td>
        <Link to={`/claimables/${hookinDoc.hash}`}>{hookinDoc.hash.substring(0, 32)}...</Link>
      </td>
      <td>
        <Link to={`/addresses/${hookinDoc.bitcoinAddress}`}>{hookinDoc.bitcoinAddress}</Link>
      </td>
      <td>{hookinDoc.amount} sat</td>
      <td>
        {/* don't think this is necessary anymore */}
        {hookinDoc.txid != undefined && (
          <a href={`https://blockstream.info/testnet/tx/${hookinDoc.txid}?input:${hookinDoc.vout}`} target="_blank" rel="noreferrer">
            {hookinDoc.txid.substring(0, 8)}...
          </a>
        )}
      </td>
      <td>{renderAckStatus()}</td>
      <td>{memo != undefined && memo}</td>

      <td>{hookinDoc.created.toISOString()}</td>
    </tr>
  );
}

import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as hi from 'hookedin-lib';

import { wallet } from '../state/wallet';

import * as Docs from '../wallet/docs';
import { notError } from '../util';

export default function HookinsTable({ hookins }: { hookins: (Docs.Claimable & hi.POD.Hookin)[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>hash</th>
          <th>address</th>
          <th>amount</th>
          <th>tx</th>
          <th>ackd</th>
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
        <Link to={`/claimables/${hookinDoc.hash}`}>{hookinDoc.hash.substring(0, 8)}...</Link>
      </td>
      <td>
        <Link to={`/addresses/${hookinDoc.bitcoinAddress}`}>{hookinDoc.bitcoinAddress.substring(0, 8)}...</Link>
      </td>
      <td>{hookinDoc.amount} sat</td>
      <td>
        <a href={`https://blockstream.info/testnet/tx/${hookinDoc.txid}?input:${hookinDoc.vout}`} target="_blank">
          {hookinDoc.txid.substring(0, 8)}...
        </a>
      </td>
      <td>{renderAckStatus()}</td>
    </tr>
  );
}

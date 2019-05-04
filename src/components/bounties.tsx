import React from 'react';

import { Link } from 'react-router-dom';

import { wallet, useBounties, useClaimStatus, useTransferByInputOutputHash } from '../state/wallet';
import * as Docs from '../wallet/docs';

export default function Bounties() {
  const bounties = useBounties();

  return (
    <div>
      <h1>Bounties ({bounties.length})</h1>
      <table>
        <thead>
          <tr>
            <th />
            <th>Claimant</th>
            <th>Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bounties.map(bounty => (
            <Bounty key={bounty.hash} bounty={bounty} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bounty({ bounty }: { bounty: Docs.Bounty }) {
  const associatedTransfer = useTransferByInputOutputHash(bounty.hash);
  const claimStatus = useClaimStatus(bounty.hash);

  let status: 'LOADING' | 'UNASSOCIATED' | 'CLAIMED' | 'UNCOLLECTED';
  if (associatedTransfer === 'LOADING' || claimStatus === 'LOADING') {
    status = 'LOADING';
  } else if (associatedTransfer === 'NONE' || associatedTransfer.status.kind !== 'ACKNOWLEDGED') {
    status = 'UNASSOCIATED';
  } else {
    status = typeof claimStatus === 'string' ? claimStatus : 'CLAIMED';
  }

  function action() {
    if (status !== 'UNCOLLECTED') {
      return;
    }
    return <button onClick={() => wallet.claimBounty(bounty)}>Claim</button>;
  }

  return (
    <tr>
      <td>
        <Link to={`/bounties/${bounty.hash}`}>#</Link>
      </td>
      <td>
        <code>{bounty.claimant}</code>
      </td>
      <td>{bounty.amount}</td>
      <td>{status}</td>
      <td>{action()}</td>
    </tr>
  );
}

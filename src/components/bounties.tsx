import React from 'react';

import wallet, { useAckdBounties, useClaimStatus } from '../state/wallet';
import * as Docs from '../wallet/docs';

export default function Bounties() {
  const bounties = useAckdBounties();

  return (
    <div>
      <h1>Bounties ({bounties.length})</h1>
      <table>
        <thead>
          <tr>
            <th>Claimant</th>
            <th>Amount</th>
            <th>Index</th>
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
  const claimStatus = useClaimStatus(bounty.hash);
  const status = typeof claimStatus === 'string' ? claimStatus : 'CLAIMED';

  function action() {
    if (status === 'LOADING' || status === 'CLAIMED') {
      return;
    }
    return <button onClick={() => wallet.claimBounty(bounty)}>Claim</button>;
  }

  return (
    <tr>
      <td>
        <code>{bounty.claimant}</code>
      </td>
      <td>{bounty.amount}</td>
      <td>{status}</td>
      <td>{action()}</td>
    </tr>
  );
}

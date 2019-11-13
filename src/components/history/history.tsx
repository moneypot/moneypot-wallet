import React from 'react';
import HistoryTransaction from './history-transaction';
import { useClaimables } from '../../state/wallet';

export default function History() {
  const claimables = useClaimables();

  return (
    <div>
      <h5>Transaction History</h5>
      <div className="history-table">
        <div>
          <span>Created</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {claimables.map(c => (
          <HistoryTransaction key={c.hash} claimable={c} />
        ))}
      </div>
    </div>
  );
}

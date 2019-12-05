import React from 'react';
import TransactionItem from './transaction-item';
import { useClaimables } from '../../state/wallet';
import { Button } from 'reactstrap';

export default function History() {
  const claimables = useClaimables();

  return (
    <div>
      <h5 className="main-header">Transactions</h5>
      <div className="history-table">
        <div>
          <span>Created</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {claimables.map(c => (
          <TransactionItem key={c.hash} claimable={c} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button color="primary">Load More</Button>
      </div>
    </div>
  );
}

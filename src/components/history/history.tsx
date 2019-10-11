import React from 'react';
import HistoryTransaction from './history-transaction';
import { useClaimables } from '../../state/wallet';

export default function History() {

  const claimables = useClaimables();

  return (
    <div>
      <h5>Transaction History</h5>
      {
        claimables.map(c => <HistoryTransaction key={ c.hash } claimable={c} />)
      }
    </div>
  );
}

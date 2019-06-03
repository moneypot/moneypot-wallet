import React from 'react';
import HistoryTransaction from './history-transaction';

export default function History() {
  return (
    <div>
      <h3>Transaction History</h3>
      <HistoryTransaction amount="0.000146" type="sent" time="2018-10-19 17:25:56" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" />
    </div>
  );
}

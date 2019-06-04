import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HistoryTransaction from '../history/history-transaction';
import { useBalance } from '../../state/wallet'


export default function Dashboard() {
  const balance = useBalance();

  return (
    <div>
      <h5>Balance</h5>
      <div className="inner-container balance-container">
        <p className="balance-display">{ (balance/1e8).toFixed(8) } BTC</p>
        <p className="balance-display-conversion">≈ ??? USD</p>
      </div>
      <h5>This Month</h5>
      <h5>Recent (mocked out for now...)</h5>
      <HistoryTransaction amount="0.000146" type="sent" time="2018-10-19 17:25:56" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" />
    </div>
  );
}

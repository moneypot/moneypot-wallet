import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HistoryTransaction from '../history/history-transaction';


export default function Dashboard() {

  return (
    <div>
      <h5>Balance</h5>
      <div className="inner-container balance-container">
        <p className="balance-display">9.056792 BTC</p>
        <p className="balance-display-conversion">≈ 76,794.62 USD</p>
      </div>
      <h5>This Month</h5>
      <h5>Recent</h5>
      <HistoryTransaction amount="0.000146" type="sent" time="2018-10-19 17:25:56" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" />
    </div>
  );
}

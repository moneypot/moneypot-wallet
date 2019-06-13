import React from 'react';
import HistoryTransaction from '../history/history-transaction';
import { Link } from 'react-router-dom';
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

      <h5>Actions</h5>
        <div className="flex-container-columns">

          <Link to="/receive" className="btn btn-success btn-hookedin same-width-btn-dashboard">
            Receive <i className="far fa-arrow-from-top fa" />
          </Link>
          <Link to="/send" className="btn btn-danger btn-hookedin same-width-btn-dashboard">
            Send <i className="far fa-arrow-to-top fa" />
          </Link>
        </div>
      <h5>Recent (mocked out for now...)</h5>
      <HistoryTransaction amount="0.000146" type="sent" time="2018-10-19 17:25:56" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" />
    </div>
  );
}

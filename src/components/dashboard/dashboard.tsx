import React from 'react';
import HistoryTransaction from '../history/history-transaction';
import { Link } from 'react-router-dom';
import { useBalance } from '../../state/wallet';

export default function Dashboard() {
  const balance = useBalance();

  return (
    <div>
      <h5>Balance</h5>
      <div className="inner-container balance-container">
        <p className="balance-display">{(balance / 1e8).toFixed(8)} BTC</p>
        <p className="balance-display-conversion">≈ ??? USD</p>
      </div>

      <h5>Actions</h5>
      <div className="flex-container-columns">
        <Link to="/receive" className="btn btn-success btn-moneypot same-width-btn-dashboard">
          Receive <i className="far fa-arrow-from-top fa" />
        </Link>
        <Link to="/send" className="btn btn-danger btn-moneypot same-width-btn-dashboard">
          Send <i className="far fa-arrow-to-top fa" />
        </Link>
      </div>
    </div>
  );
}

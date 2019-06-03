import React from 'react';
import { Badge } from 'reactstrap';

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

function HistoryTransaction(props: any) {
  return (
    <div className="transaction-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <i className={props.type === 'sent' ? 'fas fa-long-arrow-up fa-lg' : 'fas fa-long-arrow-down fa-lg'} />
          <span className={props.type === 'sent' ? 'sent' : 'received'}>{props.amount} BTC</span>
          <Badge className={props.confirmed ? 'confirmed' : 'pending'}>{props.confirmed ? 'confirmed' : 'pending'}</Badge>
        </div>
        <span className="text-muted">{props.time}</span>
      </div>
    </div>
  );
}

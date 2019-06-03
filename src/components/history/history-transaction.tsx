import React from 'react';
import { Badge } from 'reactstrap';

export default function HistoryTransaction(props: any) {
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

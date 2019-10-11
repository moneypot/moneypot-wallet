import React from 'react';
import { Badge } from 'reactstrap';

import * as Docs from '../../wallet/docs';

export default function HistoryTransaction({ claimable }: { claimable: Docs.Claimable }) {


  return (
    <div className="transaction-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        { claimable.kind }
        <span className="text-muted">{ claimable.created.toISOString() }</span>
      </div>
    </div>
  );
}


function ShowHookin(props: any) {
  <div>
    <i className={props.type === 'sent' ? 'fas fa-long-arrow-up fa-lg' : 'fas fa-long-arrow-down fa-lg'} />
    <span className={props.type === 'sent' ? 'sent' : 'received'}>{props.amount} BTC</span>
    <Badge className={props.confirmed ? 'confirmed' : 'pending'}>{props.confirmed ? 'confirmed' : 'pending'}</Badge>
  </div>
}
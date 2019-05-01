import React from 'react';
import { Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './history-card.scss'

export default function History() {
  return (
    <div>
      <h3>Transaction History</h3>
      <HistoryTransaction amount="0.000146" type="sent" time="2018-10-19 17:25:56" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34" confirmed />
      <HistoryTransaction amount="0.00005" type="received" time="2018-09-17 11:09:34"  />

    </div>
  );
}

function HistoryTransaction(props: any) {
  return(
  <div className="content-card">
    <div style={{ display: 'flex', justifyContent: 'space-between'}}>
      <div>
        <FontAwesomeIcon icon="circle" className={props.confirmed ? 'confirmed circle-icon' : 'not-confirmed circle-icon'}/>
        <span className={props.type === 'sent'? 'sent' : 'received'}>{props.amount} BTC</span>
        <Badge className={props.type === 'sent'? 'sent' : 'received'}>
          {props.type === 'sent'? 'sent' : 'received'}
          </Badge>
      </div>
      <span className="text-muted">{props.time}</span>
    </div>
    <Badge className={props.confirmed ? 'confirmed' : 'not-confirmed'}>{props.confirmed ? 'confirmed' : 'not-confirmed'}</Badge>
  </div>
  );
}
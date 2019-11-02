import React from 'react';
import { Link } from 'react-router-dom';
import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';

import * as Docs from '../../wallet/docs';

export default function HistoryTransaction({ claimable }: { claimable: Docs.Claimable }) {
  console.log('claimable is: ', claimable);

  function getAmount() {
    if (claimable.kind === 'LightningInvoice') {
      return GetLightningPaymentRequestAmount(claimable.paymentRequest);
    }

    if (claimable.kind === 'Hookin' || 'Hookout' || 'FeeBump' || 'LightningPayment') {
      return claimable.amount;
    }
    return 'unknown';
  }

  function TransactionIcon(claimable: string) {
    let icon = 'fa-exclamation-triangle';
    if (claimable === 'Hookin') {
      icon = 'fa-arrow-circle-down';
    }
    if (claimable === 'Hookout') {
      icon = 'fa-arrow-circle-up';
    }
    if (claimable === 'FeeBump') {
      icon = 'fa-arrow-circle-up';
    }
    if (claimable === 'LightningPayment') {
      icon = 'fa-bolt lightning-payment';
    }
    if (claimable === 'LightningInvoice') {
      icon = 'fa-bolt lightning-invoice';
    }
    return <i className={'fa-2x fad ' + icon} />;
  }

  return (
    <div className="transaction-card">
      <Link to={`claimables/${claimable.hash}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>#</span>
        <span className="text-muted">{claimable.created.toISOString()}</span>
        <span>
          {TransactionIcon(claimable.kind)} {claimable.kind}
        </span>
        <span>{getAmount()}</span>
        <span>Status</span>
      </Link>
    </div>
  );
}

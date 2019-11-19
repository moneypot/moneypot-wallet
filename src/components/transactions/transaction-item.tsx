import React from 'react';
import { Link } from 'react-router-dom';
import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';

import * as Docs from '../../wallet/docs';

export default function TransactionItem({ claimable }: { claimable: Docs.Claimable }) {
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
      icon = 'fa-arrow-down';
    }
    if (claimable === 'Hookout') {
      icon = 'fa-arrow-up';
    }
    if (claimable === 'FeeBump') {
      icon = 'fa-arrow-up';
    }
    if (claimable === 'LightningPayment') {
      icon = 'fa-bolt';
    }
    if (claimable === 'LightningInvoice') {
      icon = 'fa-bolt';
    }
    return (
      <span className="fa-stack">
        <i className="fas fa-circle fa-stack-2x" />
        <i className={'fad fa-stack-1x fa-inverse ' + icon} />
      </span>
    );
  }

  return (
    <Link to={`claimables/${claimable.hash}`} className={'transaction-card ' + claimable.kind}>
      <div className="text-muted">{claimable.created.toISOString()}</div>
      <div>
        {TransactionIcon(claimable.kind)}
        <span>{claimable.kind}</span>
      </div>
      <div>{getAmount()}</div>
      <div>Status</div>
    </Link>
  );
}

import React from 'react';
// import { Link } from 'react-router-dom';
// import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';

import * as Docs from '../../wallet/docs';
// import Timeago from '../../util/timeago';
import { useClaimableStatuses } from '../../state/wallet';
import LightningInvoiceItem from './lightning-invoice-item';
import HookinItem from './hookin-item';
import HookoutItem from './hookout-item';
import FeeBumpItem from './FeeBump-item';
import LightningPaymentItem from './lightning-payment-item';

export default function TransactionItem({ claimable }: { claimable: Docs.Claimable }) {
  const statuses = useClaimableStatuses(claimable.hash);

  switch (claimable.kind) {
    case 'Hookin':
      return <HookinItem claimable={claimable} statuses={statuses} />;
    case 'LightningInvoice':
      return <LightningInvoiceItem claimable={claimable} statuses={statuses} />;
    case 'LightningPayment':
      return <LightningPaymentItem claimable={claimable} statuses={statuses} />;
    case 'FeeBump':
      return <FeeBumpItem claimable={claimable} statuses={statuses} />;
    case 'Hookout':
      return <HookoutItem claimable={claimable} statuses={statuses} />;
  }

  // if (claimable.kind === 'LightningInvoice') {
  //   return <LightningInvoiceItem claimable={claimable} statuses={statuses} />;
  // }
  // if (claimable.kind === 'Hookin') {
  //   return <HookinItem claimable={claimable} statuses={statuses} />;
  // }
  // if (claimable.kind === 'Hookout') {
  //   return <HookoutItem claimable={claimable} statuses={statuses} />;
  // }
  // if (claimable.kind === 'FeeBump') {
  //   return <FeeBumpItem claimable={claimable} statuses={statuses} />;
  // }
  // if (claimable.kind === "LightningPayment") {
  //   return <LightningPaymentItem claimable={claimable} statuses={statuses}/>
  // }

  // function getAmount() {
  //   if (claimable.kind === 'LightningInvoice') {
  //     return GetLightningPaymentRequestAmount(claimable.paymentRequest);
  //   }

  //   if (claimable.kind === 'Hookin' || 'Hookout' || 'FeeBump' || 'LightningPayment') {
  //     return claimable.amount;
  //   }
  //   return 'unknown';
  // }

  // function TransactionIcon(claimable: string) {
  //   let icon = 'fa-exclamation-triangle';
  //   if (claimable === 'Hookin') {
  //     icon = 'fa-arrow-down';
  //   }
  //   if (claimable === 'Hookout') {
  //     icon = 'fa-arrow-up';
  //   }
  //   if (claimable === 'FeeBump') {
  //     icon = 'fa-arrow-up';
  //   }
  //   if (claimable === 'LightningPayment') {
  //     icon = 'fa-bolt';
  //   }
  //   if (claimable === 'LightningInvoice') {
  //     icon = 'fa-bolt';
  //   }
  //   return (
  //     <span className="fa-stack">
  //       <i className="fas fa-circle fa-stack-2x" />
  //       <i className={'fad fa-stack-1x fa-inverse ' + icon} />
  //     </span>
  //   );
  // }

  // return (
  //   <Link to={`claimables/${claimable.hash}`} className={'transaction-card ' + claimable.kind}>
  //     <div className="text-muted">
  //       <Timeago date={claimable.created} />
  //     </div>
  //     <div>
  //       {TransactionIcon(claimable.kind)}
  //       <span>{claimable.kind}</span>
  //     </div>
  //     <div>{getAmount()}</div>
  //     <div>Status</div>
  //   </Link>
  // );
}

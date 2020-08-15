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
}

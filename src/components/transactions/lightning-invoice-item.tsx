import React from 'react';
import { Link } from 'react-router-dom';
import * as mp from 'moneypot-lib';
import InvoiceSettledStatus from 'moneypot-lib/dist/status/invoice-settled';

import * as Docs from '../../wallet/docs';
import Timeago from '../../util/timeago';

import { notError } from '../../util';

type Props = {
  statuses: mp.Status[] | undefined;
  claimable: Docs.Claimable;
};

export default function LightningInvoiceItem({ claimable, statuses }: Props) {
  if (claimable.kind !== 'LightningInvoice') {
    return null;
  }

  const pro = notError(mp.decodeBolt11(claimable.paymentRequest));

  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === 'description') {
      description = tag.data;
    }
  }
  let icon = (
    <span className="fa-stack">
      <i className="fas fa-circle fa-stack-2x" />
      <i className={'fad fa-stack-1x fa-inverse fa-bolt'} />
    </span>
  );

  let amount = 0;

  let status = 'unpaid';
  if (statuses === undefined) {
    status = '';
  } else {
    for (const s of statuses) {
      if (s instanceof InvoiceSettledStatus) {
        amount = s.amount;
        status = 'paid';
      }
    }
  }

  return (
    <Link to={`claimables/${claimable.hash}`} className="transaction-card LightningInvoice">
      <div className="text-muted">
        <Timeago date={claimable.created} />
      </div>
      <div>
        {icon}
        <span>
          Lightning Invoice
          <br />( {description} )
        </span>
      </div>
      <div>{amount} satoshis</div>
      <div>{status}</div>
    </Link>
  );
}

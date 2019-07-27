import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import * as hi from 'hookedin-lib';
import * as Docs from '../wallet/docs';

import { wallet, useLightningInvoice, useLightningPaymentOfInvoice } from '../state/wallet';
import { notError } from '../util';

function RenderInvoice({ invoice }: { invoice: Docs.LightningInvoice }) {
  const payment = useLightningPaymentOfInvoice(invoice.hash);
  return (
    <div>
      <h1>Invoice {invoice.hash}</h1>
      <code>
        <pre>{JSON.stringify(invoice, null, 2)}</pre>
      </code>
      <hr />
          { payment ? <RenderPayment payment={payment} /> : 'no payment found' }
      <hr />
      <button onClick={() => {
        wallet.checkLightningInvoiceForPayment(invoice)
      }}>Check!</button>
    </div>
  );
}

function RenderPayment({ payment }:  {payment: Docs.LightningInvoicePayment }) {
  return <code>
    <pre>{JSON.stringify(payment, null, 2)}</pre>
  </code>
}


export default function LightningInvoiceInfo(props: RouteComponentProps<{ hash: string }>) {
  const invoiceHashStr = props.match.params.hash;
  const invoiceHash = hi.Hash.fromPOD(invoiceHashStr);

  if (invoiceHash instanceof Error) {
    return <h1>Error invalid invoice hash: {invoiceHash.message}</h1>;
  }

  const invoice = useLightningInvoice(invoiceHashStr);

  if (invoice === 'LOADING') {
    return <div>Loading invoice: {invoiceHashStr}</div>;
  }

  if (invoice === undefined) {
    return <div>Could not find transfer: {invoiceHashStr}</div>;
  }

  return <RenderInvoice invoice={invoice} />;
}

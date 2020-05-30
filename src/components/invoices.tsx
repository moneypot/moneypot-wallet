import React from 'react';
import { RouteComponentProps } from 'react-router';

import * as hi from 'moneypot-lib';

import * as Docs from '../wallet/docs';
import { useClaimableKinds } from '../state/wallet';
import InvoicesTable from './invoices-table';

export default function(props: RouteComponentProps<{ hash: string }>) {
  const invoices = useClaimableKinds('LightningInvoice');

  if (invoices === 'LOADING') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>All Lightning Invoices</h1>
      <InvoicesTable invoices={invoices as (Docs.Claimable & hi.POD.LightningInvoice)[]} />
    </div>
  );
}

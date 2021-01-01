import React from 'react';
import { RouteComponentProps } from 'react-router';

import * as hi from 'moneypot-lib';

import * as Docs from '../../wallet/docs';
import { useClaimableKinds } from '../../state/wallet';
import LnPaymentsTable from './payments-table';

export default function (props: RouteComponentProps<{ hash: string }>) {
  const lnPayments = useClaimableKinds('LightningPayment');

  if (lnPayments === 'LOADING') {
    return <p>Loading...</p>;
  }
  return (
    <div>
      <h1>All Lightning Payments ({lnPayments.length})</h1>
      <LnPaymentsTable payments={lnPayments as (Docs.Claimable & hi.POD.LightningPayment)[]} />
    </div>
  );
}

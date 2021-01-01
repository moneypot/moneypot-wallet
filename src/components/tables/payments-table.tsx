import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { getAllStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import Failed from 'moneypot-lib/dist/status/failed';
import LightningPaymentSent from 'moneypot-lib/dist/status/lightning-payment-sent';
import { CustomTable } from './table-util';

let value: string | undefined = undefined;

export default function LnPaymentsTable({ payments }: { payments: (Docs.Claimable & hi.POD.LightningPayment)[] }) {
  // this is ugly, goddamn
  let filteredPayments = [];
  const statuses = getAllStatuses();

  for (const payment of payments) {
    const pro = notError(hi.decodeBolt11(payment.paymentRequest));

    let description;
    for (const tag of pro.tags) {
      if (tag.tagName === 'description') {
        description = tag.data;
      }
    }

    let memo = description != null ? description : '';

    // const statuses = useClaimableStatuses(payment.hash);
    let totalFees = 0;
    let rebate = 0;
    let failureReason = '';
    if (statuses) {
      for (const s of statuses) {
        if (s.claimableHash.toPOD() === payment.hash) {
          if (s instanceof LightningPaymentSent) {
            totalFees = s.totalFees;
          }
          if (s instanceof Failed) {
            rebate = s.rebate;
            failureReason = s.reason;
          }
        }
      }
    }

    filteredPayments.push({
      hash: payment.hash,
      paymentRequest: payment.paymentRequest,
      memo,
      amount: payment.amount,
      totalFees,
      rebate,
      failureReason,
      created: payment.created.toString(),
    });
  }

  const columns = useMemo(
    () => [
      {
        Header: 'Lightning Payments',
        columns: [
          {
            Header: 'Hash',
            accessor: 'hash',
            Cell: (e: { value: React.ReactNode }) => <Link to={`/claimables/${e.value}`}>{e.value}</Link>,
          },
          {
            Header: 'PaymentRequest',
            accessor: 'paymentRequest',
          },
          {
            Header: 'Amount',
            accessor: 'amount',
          },
          {
            Header: 'Memo',
            accessor: 'memo',
          },
          {
            Header: 'Totalfees',
            accessor: 'totalFees',
          },
          {
            Header: 'Rebate',
            accessor: 'rebate',
          },
          {
            Header: 'FailureReason',
            accessor: 'failureReason',
          },
          {
            Header: 'Created',
            accessor: 'created',
          },
        ],
      },
    ],
    []
  );

  return <CustomTable columns={columns} data={filteredPayments} />;
}

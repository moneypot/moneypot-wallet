import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { useClaimableStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import Failed from 'moneypot-lib/dist/status/failed';
import LightningPaymentSent from 'moneypot-lib/dist/status/lightning-payment-sent';
import useSortableData from './table-util';
import { Table } from 'reactstrap';

export default function LnPaymentsTable({ payments }: { payments: (Docs.Claimable & hi.POD.LightningPayment)[] }) {
  let filteredPayments = [];
  for (const payment of payments) {
    const pro = notError(hi.decodeBolt11(payment.paymentRequest));

    let description;
    for (const tag of pro.tags) {
      if (tag.tagName === 'description') {
        description = tag.data;
      }
    }

    let memo = description != null ? description : '';

    const statuses = useClaimableStatuses(payment.hash);
    let totalFees = 0;
    let rebate = 0;
    let failureReason = '';
    if (statuses) {
      for (const s of statuses) {
        if (s instanceof LightningPaymentSent) {
          totalFees = s.totalFees;
        }
        if (s instanceof Failed) {
          rebate = s.rebate;
          failureReason = s.reason;
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
      created: payment.created,
    });
  }

  const { items, requestSort, sortConfig } = useSortableData(filteredPayments, null);
  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  return (
    <Table hover className="table">
      <thead>
        <tr>
          <th>
            <button type="button" onClick={() => requestSort('hash')} className={getClassNamesFor('hash')}>
              hash
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('paymentRequest')} className={getClassNamesFor('paymentRequest')}>
              payment
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('memo')} className={getClassNamesFor('memo')}>
              memo
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('amount')} className={getClassNamesFor('amount')}>
              amount
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('totalFees')} className={getClassNamesFor('totalFees')}>
              total Fees
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('rebate')} className={getClassNamesFor('rebate')}>
              rebate
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('failureReason')} className={getClassNamesFor('failureReason')}>
              reason
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('created')} className={getClassNamesFor('created')}>
              created
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.hash}>
            <td>
              <Link to={`/claimables/${item.hash}`}>{item.hash.substring(0, 32)}...</Link>
            </td>
            <td>
              <Link to={`/claimables/${item.hash}`}>{item.paymentRequest.substring(0, 32)}...</Link>
            </td>
            <td>{item.memo}</td>
            <td>{item.amount}</td>
            <td>{item.totalFees}</td>
            <td>{item.rebate}</td>
            <td>{item.failureReason}</td>
            <td>{item.created.toISOString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

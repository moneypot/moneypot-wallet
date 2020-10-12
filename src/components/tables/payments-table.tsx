import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { useClaimableStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import Failed from 'moneypot-lib/dist/status/failed';
import LightningPaymentSent from 'moneypot-lib/dist/status/lightning-payment-sent';

export default function LnPaymentsTable({ payments }: { payments: (Docs.Claimable & hi.POD.LightningPayment)[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>hash</th>
          <th>invoice</th>
          {/* <th>payment preimage</th> */}
          <th>memo</th>
          <th>amount</th>
          <th>fees</th>
          <th>rebate?</th>
          <th>reason?</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(payment => (
          <Payment key={payment.hash} paymentsDoc={payment} />
        ))}
      </tbody>
    </table>
  );
}

function Payment({ paymentsDoc }: { paymentsDoc: Docs.Claimable & hi.POD.LightningPayment }) {
  const [totalfees, setTotalFees] = useState<Number>();
  const [paymentpreimage, setPaymentPreimage] = useState<String>();
  const [rebate, setRebate] = useState<Number>();
  const [failurereason, setFailureReason] = useState<string>();

  const pro = notError(hi.decodeBolt11(paymentsDoc.paymentRequest));
  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === 'description') {
      description = tag.data;
    }
  }

  let memo = description != null ? description : '';

  // compare speeds, which is faster, hooks, or functions?
  const statuses = useClaimableStatuses(paymentsDoc.hash);
  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof LightningPaymentSent) {
              setTotalFees(s.totalFees);
              setPaymentPreimage(hi.Buffutils.toHex(s.paymentPreimage));
            }
            if (s instanceof Failed) {
              setRebate(s.rebate);
              setFailureReason(s.reason);
            }
          }
        }
      }
    };
    getData();
  });

  return (
    <tr>
      <td>
        <Link to={`/claimables/${paymentsDoc.hash}`}>{paymentsDoc.hash.substring(0, 32)}...</Link>
      </td>
      <td>
        {' '}
        <Link to={`/claimables/${paymentsDoc.hash}`}>{paymentsDoc.paymentRequest.substring(0, 32)}...</Link>
      </td>
      <td>{memo}</td>
      <td>{paymentsDoc.amount} sat</td>
      <td>{totalfees ? totalfees : undefined}</td>
      <td>{rebate ? rebate : undefined}</td>
      <td>{failurereason ? failurereason : undefined}</td>
    </tr>
  );
}

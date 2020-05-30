import React from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { useClaimableStatuses } from '../state/wallet';

import * as Docs from '../wallet/docs';
import { notError } from '../util';

export default function LnPaymentsTable({ payments }: { payments: (Docs.Claimable & hi.POD.LightningPayment)[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>hash</th>
          <th>invoice</th>
          <th>payment preimage</th>
          <th> memo</th>
          <th> amount</th>
          <th>fees</th>
          <th>rebate?</th>
          <th> reason?</th>
          {/* <th>ackd</th> */}
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
 // invoice will always be acknowledged so this is pretty useless. 
 const pro = notError(hi.decodeBolt11(paymentsDoc.paymentRequest));
 let description;
 for (const tag of pro.tags) {
   if (tag.tagName === 'description') {
     description = tag.data;
   }
 }
// let payment_hash;
// for (const tag of pro.tags) {
// if (tag.tagName === "payment_hash") {
//   payment_hash = tag.data;
// }
// }
// let hash = payment_hash != null ? payment_hash : "";
let memo = description != null ? description : "";

 const statuses = useClaimableStatuses(paymentsDoc.hash)
 function getTotalFees() {
    if (statuses != undefined) {
     if (statuses.length > 1) {
       for (var i = statuses.length; i--; ) {
         const element = statuses[i];
         // rPreimage === invoice paid
         if ("totalFees" in element) { 
           return element.totalFees
         }
       }
     }
   }
   return "NOT FOUND"
   }
   // if transaction failed?
   function hasRebate() {
    if (statuses != undefined) {
        if (statuses.length > 1) {
          for (var i = statuses.length; i--; ) {
            const element = statuses[i];
            // rPreimage === invoice paid
            if ("rebate" in element) { 
              return (element.rebate + " " + "sat")
            }
          }
        }
      }
      return "..."
      }
      // reason for failure
      function hasReason() {
        if (statuses != undefined) {
            if (statuses.length > 1) {
              for (var i = statuses.length; i--; ) {
                const element = statuses[i];
                // rPreimage === invoice paid
                if ("reason" in element) { 
                  return element.reason 
                }
              }
            }
          }
          return "..."
          }

          function rPreimage() {
            if (statuses != undefined) {
                if (statuses.length > 1) {
                  for (var i = statuses.length; i--; ) {
                    const element = statuses[i];
                    // rPreimage === invoice paid
                    if ("paymentPreimage" in element) { 
                      return hi.Buffutils.toHex(element.paymentPreimage)
                    }
                  }
                }
              }
              return "..."
              }

   // maybe if payment has failed && users want to know if the invoice is still valid?
//    function isExpired() {
//     const pro = notError(hi.decodeBolt11(invoiceDoc.paymentRequest));
//     const currentTime = new Date().getTime()
//     const expiryTime = new Date(pro.timeExpireDateString).getTime()
//     if(currentTime > expiryTime) { 
//      return "Invoice has expired"
//     }
//     else if(currentTime < expiryTime) { 
//      return "Invoice is stil valid"
//     }
//     return " ???"
//   }

  return (
    <tr>
      <td>
        <Link to={`/claimables/${paymentsDoc.hash}`}>{paymentsDoc.hash.substring(0, 8)}...</Link>
      </td>
      <td>
       {paymentsDoc.paymentRequest.substring(0, 32)}...
      </td>
      <td>{rPreimage().toString().substring(0, 32)}</td>
      <td>{memo}</td>
      <td>{paymentsDoc.amount} sat</td>
      <td>{getTotalFees()}</td> 
      <td>{hasRebate()}</td>
      <td>{hasReason()}</td>
    </tr>
  );
}

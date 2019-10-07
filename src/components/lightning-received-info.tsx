import React from 'react';

export default function() {
  return 'TODO';
}

// import { useLightningReceiveds, useClaimStatus, wallet } from '../state/wallet';
// import * as Docs  from '../wallet/docs';
// import { Link } from 'react-router-dom';

// export default function LightningReceivedInfo({ payment }: { payment: Docs.LightningReceived }) {

//   const spentStatus = useClaimStatus(payment.lightningInvoiceHash);

//   function renderSpentStatus() {
//     if (spentStatus === 'LOADING') {
//       return <span>loading...</span>;
//     } else if (spentStatus === 'UNCOLLECTED') {
//       return <button onClick={() => {  wallet.claimLightning(payment) } }>Collect</button>;
//     } else {
//       return (
//         <span>
//           Claimed by <code>{ spentStatus.claimRequest.claimHash.substring(0, 8) }...</code>
//         </span>
//       );
//     }
//   }

//   return <div>
//     <h2>Invoice Paid!</h2>
//     <b>Invoice: </b> <Link to={ `/lightning-invoices/${payment.lightningInvoiceHash}` }>{ payment.lightningInvoiceHash }</Link><br />
//     <b>Amount:</b> { payment.amount }<br />
//     { renderSpentStatus() }
//     <hr />
//     <code><pre>{ JSON.stringify(payment, null, 2) }</pre></code>
//   </div>;

// }

import React from 'react';
import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import React from 'react';
// import { RouteComponentProps } from 'react-router';
// import { Link } from 'react-router-dom';

// import * as hi from 'moneypot-lib';
// import * as Docs from '../wallet/docs';

// // @ts-ignore
// import { TheQr } from 'the-qr';

// import { wallet, useLightningInvoice, useLightningReceived } from '../state/wallet';
// import LightningReceivedInfo from './lightning-received-info';

// function RenderInvoice({ invoice }: { invoice: Docs.LightningInvoice }) {
//   const payment = useLightningReceived(invoice.hash);
//   return (
//     <div>
//       <h1>Invoice {invoice.hash}</h1>

//       <TheQr text={ invoice.paymentRequest.toUpperCase() } />

//       <hr />

//       <code>
//         <pre>{JSON.stringify(invoice, null, 2)}</pre>
//       </code>
//       <hr />
//       {payment ? <LightningReceivedInfo payment={payment} /> : 'no payment found'}
//       <hr />
//       <button
//         onClick={() => {
//           wallet.checkLightningReceived(invoice);
//         }}
//       >
//         Check!
//       </button>
//     </div>
//   );
// }

// export default function LightningInvoiceInfo(props: RouteComponentProps<{ hash: string }>) {
//   const invoiceHashStr = props.match.params.hash;
//   const invoiceHash = hi.Hash.fromPOD(invoiceHashStr);

//   if (invoiceHash instanceof Error) {
//     return <h1>Error invalid invoice hash: {invoiceHash.message}</h1>;
//   }

//   const invoice = useLightningInvoice(invoiceHashStr);

//   if (invoice === 'LOADING') {
//     return <div>Loading invoice: {invoiceHashStr}</div>;
//   }

//   if (invoice === undefined) {
//     return <div>Could not find transfer: {invoiceHashStr}</div>;
//   }

//   return <RenderInvoice invoice={invoice} />;
// }

import React from 'react';
import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import { useLightningReceiveds } from '../state/wallet';

// import LightningReceivedInfo from './lightning-received-info';

// export default function LightningReceiveds() {
//   const payments = useLightningReceiveds();
//   return (
//     <div>
//       <h1>All Lightning Invoice Payments</h1>
//       {
//         payments.map(payment => <LightningReceivedInfo payment={ payment } key={ payment.lightningInvoiceHash } />)
//       }
//     </div>
//   );
// }

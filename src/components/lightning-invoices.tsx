import React from 'react';

import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import { useBitcoinAddresses, useInvoices } from '../state/wallet';
// import { Link } from 'react-router-dom';

// export default function LightningInvoices(props: any) {
//   const allInvoices = useInvoices();

//   return (
//     <table>
//       <thead>
//         <tr>
//           <th>Hash</th>
//           <th>Claimant</th>
//           <th>Created</th>
//         </tr>
//       </thead>
//       <tbody>
//         {allInvoices.map(invoice => {
//           return (
//             <tr key={invoice.hash}>
//               <td>
//                 <Link to={`/lightning-invoices/${invoice.hash}`}>{ invoice.hash.substring(0, 8) }...</Link>
//               </td>
//               <td>{ invoice.claimant }</td>
//               <td>{invoice.created.toISOString()}</td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>
//   );
// }

import React from 'react';
import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import { Link } from 'react-router-dom';
// import { wallet, useHookouts } from '../state/wallet';

// import * as Docs from '../wallet/docs';

// export default function Hookins() {
//   const hookouts = useHookouts();

//   return (
//     <div>
//       <h1>Hookouts ( {hookouts.length} )</h1>
//       <table className="table">
//         <tbody>
//           <tr>
//             <th>#</th>
//             <th>bitcoin address</th>
//             <th>amount</th>
//             <th>created</th>
//           </tr>
//           {hookouts.map(hookout => (
//             <Hookout key={hookout.hash} hookoutDoc={hookout} />
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function Hookout({ hookoutDoc }: { hookoutDoc: Docs.Hookout }) {
//   return (
//     <tr>
//       <td>
//         <Link to={`hookouts/${hookoutDoc.hash}`}>{hookoutDoc.hash.substring(0, 8)}...</Link>
//       </td>
//       <td>
//         {' '}
//         <a href={`https://blockstream.info/testnet/address/${hookoutDoc.bitcoinAddress}`} target="_blank">
//           {hookoutDoc.bitcoinAddress}
//         </a>
//       </td>
//       <td>{hookoutDoc.amount} sats</td>
//       <td>{hookoutDoc.created.toISOString()}</td>
//     </tr>
//   );
// }

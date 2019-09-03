import React from 'react';
import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import React, { useState, useEffect } from 'react';
// import { RouteComponentProps } from 'react-router';
// import { Link } from 'react-router-dom';
// import * as hi from 'hookedin-lib';

// import { wallet, useHookout } from '../state/wallet';

// import fetchBitcoinReceives, { BitcoinReceiveInfo } from '../wallet/requests/bitcoin-receives';
// import * as Docs from '../wallet/docs';

// export default function HookoutInfo(props: RouteComponentProps<{ hash: string }>) {
//   const hash = props.match.params.hash;

//   const hookoutDoc = useHookout(hash);

//   if (hookoutDoc === 'LOADING') {
//     return <div>{hookoutDoc}</div>;
//   }
//   if (hookoutDoc === undefined) {
//     return <div>not found</div>;
//   }

//   return (
//     <div>
//       <HookoutTable hookout={hookoutDoc} />
//       <hr />
//       <h3>Raw Hookout</h3>
//       <div>
//         <pre>
//           <code>{JSON.stringify(hookoutDoc, null, 2)}</code>
//         </pre>
//       </div>
//     </div>
//   );
// }

// export function HookoutTable({ hookout }: { hookout: Docs.Hookout }) {
//   return (
//     <div>
//       <table className="table">
//         <tbody>
//           <tr>
//             <th>hash</th>
//             <td>
//               <Link to={`/hookouts/${hookout.hash}`}>{hookout.hash}</Link>
//             </td>
//           </tr>
//           <tr>
//             <th>bitcoin address</th>
//             <td>
//               <Link to={`/addresses/bitcoin/${hookout.bitcoinAddress}`}>{hookout.bitcoinAddress}</Link>
//             </td>
//           </tr>
//           <tr>
//             <th>amount</th>
//             <td>{hookout.amount} sat</td>
//           </tr>
//           <tr>
//             <th>tx</th>
//             <td>
//               <RenderHookoutTxInfo hookout={hookout} />
//             </td>
//           </tr>
//           <tr>
//             <th>nonce</th>
//             <td>
//               <code>{hookout.nonce}</code>
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function RenderHookoutTxInfo({ hookout }: { hookout: Docs.Hookout }) {
//   const bri = useBitcoinSendTo(hookout.bitcoinAddress, hookout.amount);

//   if (bri === 'LOADING') {
//     return <div>searching for transaction...</div>;
//   }

//   if (bri === 'NOT_FOUND') {
//     return <div>Unable to find transaction on blockchain, for help use support</div>;
//   }

//   const txid = hi.Buffutils.toHex(bri.txid);

//   return (
//     <span>
//       <a href={`https://blockstream.info/testnet/tx/${txid}?output:${bri.vout}`} target="_blank">
//         {txid}
//       </a>
//       {bri.confirmed ? ' (confirmed)' : ' (not confirmed)'}
//     </span>
//   );
// }

// function useBitcoinSendTo(bitcoinAddress: string, amount: number): BitcoinReceiveInfo | 'LOADING' | 'NOT_FOUND' {
//   const [bri, setBri] = useState<BitcoinReceiveInfo | 'LOADING' | 'NOT_FOUND'>('LOADING');
//   useEffect(() => {
//     fetchBitcoinReceives(bitcoinAddress).then(ris => {
//       let alreadyFound = false;
//       for (const ri of ris) {
//         if (ri.amount === amount) {
//           if (alreadyFound) {
//             console.error('Found multiple sends to: ', bitcoinAddress, ' for amount: ', amount, ' which we can not disambiguate');
//           } else {
//             setBri(ri);
//             alreadyFound = true;
//           }
//         }
//       }
//     });
//   }, [bitcoinAddress, amount]);
//   return bri;
// }

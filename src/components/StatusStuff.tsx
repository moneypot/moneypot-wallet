// import React, { useState, useEffect } from 'react';
// import { Col, Row } from 'reactstrap';
// import CopyToClipboard from '../util/copy-to-clipboard';

// import * as hi from 'moneypot-lib';
// import { wallet, useClaimableStatuses } from '../state/wallet';
// import { Link } from 'react-router-dom';
// import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
// import HookinAccepted from 'moneypot-lib/dist/status/hookin-accepted';
// import Claimed from 'moneypot-lib/dist/status/claimed';

// type StatusStuffProps = {
//   claimableHash: string;
//   amount: number;
//   created: object;
//   claimable: any;
//   //   address: string; // not.
//   kind: string;
// };

// type isHookin = {
//   kind: string;
//   claimable: any;
//   current: string;
// };

// type clhash = {
//   claimableHash: string;
//   kind: string;
//   // hasLength: number;
// };

// type kind = {
//   kind: string;
// };

// const Pending = ({ kind }: kind): JSX.Element => {
//   return kind === 'Hookin' ? (
//     <a href="#status" className="btn btn-outline-warning status-badge">
//       {kind} is waiting for confirmation! <i className="fad fa-question" />
//     </a>
//   ) : (
//     <a href="#status" className="btn btn-outline-warning status-badge">
//       {kind} is in queue! <i className="fad fa-question" />
//     </a>
//   );
// };

// // not requesting the custodian for updates but instead relying on the wallet may cause false positives, so let's relax the tone..?
// const Failed = ({ kind }: kind): JSX.Element => {
//   return (
//     <a href="#status" className="btn btn-outline-warning status-badge">
//       {kind} might be invalid! Please sync! <i className="fad fa-question" />
//     </a>
//   );
// };

// const Sent = ({ kind }: kind): JSX.Element => {
//   return kind === 'Hookin' ? (
//     <a href="#status" className="btn btn-outline-success status-badge">
//       {kind} Confirmed! <i className="fad fa-check" />
//     </a>
//   ) : (
//     <a href="#status" className="btn btn-outline-success status-badge">
//       {kind} Sent! <i className="fad fa-check" />
//     </a>
//   );
// };

// const GetStatuses = (props: clhash) => {
//   const statuses = useClaimableStatuses(props.claimableHash);

//   if (!statuses) {
//     return <span>Loading statuses...</span>;
//   } else if (statuses.length > 0) {
//     for (const s of statuses) {
//       if (s instanceof BitcoinTransactionSent) {
//         return <Sent kind={props.kind} />;
//       }
//       if (s instanceof HookinAccepted) {
//         return <Sent kind={props.kind} />; // merge these two
//       }
//       if (!statuses.some(status => status instanceof HookinAccepted || status instanceof BitcoinTransactionSent)) {
//         return <Pending kind={props.kind} />;
//       }
//     }
//   }
//   return <Failed kind={props.kind} />;
// };

// const IsHookin = ({ kind, current, claimable }: isHookin): JSX.Element => {
//   if (kind === 'Hookin') {
//     return (
//       <Row>
//         <Col sm={{ size: 2, offset: 0 }}>
//           <p className="address-title">Transaction ID: </p>
//         </Col>
//         <Col sm={{ size: 8, offset: 0 }}>
//           <div className="claimable-text-container">
//             {claimable.txid}
//             <CopyToClipboard className="btn btn-light" style={{}} text={claimable.txid}>
//               <i className="fa fa-copy" />
//             </CopyToClipboard>
//           </div>
//         </Col>
//       </Row>
//     );
//   } else {
//     return (
//       <Row>
//         <Col sm={{ size: 2, offset: 0 }}>
//           <p className="address-title">Transaction ID: </p>
//         </Col>
//         <Col sm={{ size: 8, offset: 0 }}>
//           <div className="claimable-text-container">
//             {current}
//             <CopyToClipboard className="btn btn-light" style={{}} text={current}>
//               <i className="fa fa-copy" />
//             </CopyToClipboard>
//           </div>
//         </Col>
//       </Row>
//     );
//   }
// };

// export default function StatusStuff(props: StatusStuffProps): JSX.Element {
//   const [CurrentTxid, setCurrentTxid] = useState('');
//   const [CurrentConsolidationFee, setCurrentConsolidationFee] = useState(0);

//   const statuses = useClaimableStatuses(props.claimableHash);

//   useEffect(() => {
//     const getData = async (): Promise<void> => {
//       // const statuses = await getAlreadyStoredStatuses;
//       if (statuses != undefined) {
//         if (statuses.length > 0) {
//           // TODO: we don't check for feebumps..?
//           for (const s of statuses) {
//             if (s instanceof BitcoinTransactionSent) {
//               setCurrentTxid(hi.Buffutils.toHex(s.txid));
//             }
//             if (s instanceof HookinAccepted) {
//               setCurrentConsolidationFee(s.consolidationFee);
//             }
//           }
//           // before looking for a claim we can also requestStatuses, as this is usually double.
//           props.kind === 'Hookin' &&
//             !statuses.some(status => status instanceof Claimed) &&
//             wallet.requestStatuses(props.claimableHash).then(() => {
//               !statuses.some(status => status instanceof Claimed) && wallet.claimClaimable(props.claimable);
//             });
//           props.kind === 'Hookout' && !statuses.some(status => status instanceof BitcoinTransactionSent) && wallet.requestStatuses(props.claimableHash);
//           // || todo
//           props.kind === 'FeeBump' && !statuses.some(status => status instanceof BitcoinTransactionSent) && wallet.requestStatuses(props.claimableHash);
//         } else await wallet.requestStatuses(props.claimableHash);
//       }
//     };
//     getData();
//   });
//   const fee = (): number => {
//     if (props.kind === 'Hookin') {
//       return CurrentConsolidationFee;
//     } else return props.kind === 'Hookout' || props.kind === 'Feebump' ? props.claimable.fee : '...';
//   };
//   return (
//     <div>
//       <h5>{props.kind}</h5>
//       <div className="inner-container">
//         <GetStatuses
//           claimableHash={props.claimableHash}
//           // hasLength={statusLength}
//           kind={props.kind}
//         />
//         <Row>
//           <Col sm={{ size: 2, offset: 0 }}>
//             {props.kind === 'Hookout' || props.kind === 'Hookin' ? (
//               <p className="address-title">Address: </p>
//             ) : (
//               <p className="address-title">Original TXID: </p>
//             )}
//           </Col>
//           <Col sm={{ size: 8, offset: 0 }}>
//             <div className="claimable-text-container">
//               {props.kind === 'Hookout' || props.kind === 'Hookin' ? props.claimable.bitcoinAddress : props.claimable.txid}
//               <CopyToClipboard
//                 className="btn btn-light"
//                 style={{}}
//                 text={props.kind === 'Hookout' || props.kind === 'Hookin' ? props.claimable.bitcoinAddress : props.claimable.txid}
//               >
//                 <i className="fa fa-copy" />
//               </CopyToClipboard>
//             </div>
//           </Col>
//         </Row>
//         <IsHookin claimable={props.claimable} kind={props.kind} current={CurrentTxid} />
//         <Row>
//           <Col sm={{ size: 2, offset: 0 }}>
//             <p className="address-title">Amount: </p>
//           </Col>
//           <Col sm={{ size: 8, offset: 0 }}>
//             <div className="claimable-text-container">
//               {`${props.amount} sat`}
//               <CopyToClipboard className="btn btn-light" style={{}} text={props.amount.toString()}>
//                 <i className="fa fa-copy" />
//               </CopyToClipboard>
//             </div>
//           </Col>
//         </Row>
//         <Row>
//           <Col sm={{ size: 2, offset: 0 }}>
//             <p className="address-title">Fee: </p>
//           </Col>
//           <Col sm={{ size: 8, offset: 0 }}>
//             <div className="claimable-text-container">
//               {`${fee()} sat`}

//               <CopyToClipboard className="btn btn-light" style={{}} text={fee().toString()}>
//                 <i className="fa fa-copy" />
//               </CopyToClipboard>
//             </div>
//           </Col>
//         </Row>
//         {props.kind === 'Hookout' && (
//           <Row>
//             <Col sm={{ size: 2, offset: 0 }}>
//               <p className="address-title">Priority: </p>
//             </Col>
//             <Col sm={{ size: 8, offset: 0 }}>
//               <div className="claimable-text-container">{props.claimable.priority}</div>
//             </Col>
//           </Row>
//         )}
//         <Row>
//           <Col sm={{ size: 2, offset: 0 }}>
//             <p className="address-title">Created: </p>
//           </Col>
//           <Col sm={{ size: 8, offset: 0 }}>
//             <div className="claimable-text-container">{props.created.toString()}</div>
//           </Col>
//         </Row>
//         <br />
//         {props.kind == 'Hookout' || props.kind == 'FeeBump' ? (
//           <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
//             <button className="btn btn-secondary">Feebump this transaction!</button>
//           </Link>
//         ) : null}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../util/copy-to-clipboard';

import * as hi from 'moneypot-lib';
// import { useClaimableStatuses, useClaimable } from "../state/wallet";
import { getStatusesByClaimable } from '../wallet/requests';
import { wallet, useClaimableStatuses } from '../state/wallet';
import { Link } from 'react-router-dom';

// import getClaimableByClaimant from '../wallet/requests/get-claimable-by-claimant';

type StatusStuffProps = {
  claimableHash: string;
  amount: number;
  created: object;
  claimable: any;
  //   address: string; // not.
  kind: string;
};

type isHookin = {
  kind: string;
  claimable: any;
  current: string;
};

type clhash = {
  claimableHash: string;
  kind: string;
  // hasLength: number;
};

type kind = {
  kind: string;
};

const Pending = ({ kind }: kind) => {
  if (kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Waiting for confirmation{' '}
      </a>
    );
  } else if (kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        In queue!{' '}
      </a>
    );
  } else if (kind === 'FeeBump') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        In queue!{' '}
      </a>
    );
  }
  return <div>Not found!</div>;
};

// not requesting the custodian for updates but instead relying on the wallet may cause false positives, so let's relax the tone..? (TODO)
const Failed = ({ kind }: kind) => {
  if (kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Hookin might be invalid! Please sync!{' '}
      </a>
    );
  } else if (kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Hookout might be invalid! Please sync!{' '}
      </a>
    );
  } else if (kind === 'FeeBump') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Feebump might be invalid! Please sync!
      </a>
    );
  }
  return <div>Not found!</div>;
};

const Sent = ({ kind }: kind) => {
  if (kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-success status-badge">
        {' '}
        Confirmed!{' '}
      </a>
    );
  } else if (kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-success status-badge">
        {' '}
        Sent!{' '}
      </a>
    );
  } else if (kind === 'FeeBump') {
    return (
      <a href="#status" className="btn btn-outline-success status-badge">
        {' '}
        Sent!{' '}
      </a>
    );
  }
  return <div>Not found!</div>;
};

const GetStatuses = (props: clhash) => {
  const statuses = useClaimableStatuses(props.claimableHash);
  // const s = props.hasLength;
  if (!statuses) {
    return null;
  } else if (statuses.length >= 2) {
    return <Sent kind={props.kind} />;
  } else if (statuses.length == 1) {
    return <Pending kind={props.kind} />;
  }
  if (statuses.length === 0) {
    return <Failed kind={props.kind} />;
  }
  return null;
};

// async function txid(claimableHashProp: string) {
//   let statuses = useClaimableStatuses(claimableHashProp)
//   if(!statuses) {
//   } else if(statuses.length >= 0){
//   for (let index = 0; index < statuses.length; index++) {
//  const element = statuses[index];
//    if('txid' in element) {
//   // return (element['txid'])
// }}}}
// else if('contents' in claimable) {
//   let gettxid = claimable['contents']
//   if('txid' in gettxid) {
//     return hi.Buffutils.toHex(gettxid['txid'])
//   }
// }

// TODO: cache reqs??
async function gettxid(a: string, e: string) {
  const statuses = await getStatusesByClaimable(wallet.config, a);
  // const claimable = await getClaimableByClaimant(wallet.config, e);
  // if (!claimable) {
  //   return null;
  // }
  if (!statuses) {
    return null;
  } else if (statuses.length > 0) {
    for (var i = statuses.length; i--; ) {
      const element = statuses[i];
      if ('contents' in element) {
        let txidstatus = element['contents'];
        if ('txid' in txidstatus) {
          // check if this always returns the last (first) txid in case of feebumps
          return hi.Buffutils.toHex(txidstatus['txid']);
        }
        //  else if (!("txid" in txidstatus)) {
        //   let hookin = claimable["contents"];
        //   if ("txid" in hookin) {
        //     return hi.Buffutils.toHex(hookin["txid"]);
        //   }
        // }
      }
    }
  }
}

// const getStatuses = async (a: string) => {
//   const statuses = await getStatusesByClaimable(wallet.config, a);
//   return statuses.length;
// };

const IsHookin = ({ kind, current, claimable }: isHookin) => {
  if (kind === 'Hookin') {
    return (
      <Row>
        <Col sm={{ size: 2, offset: 0 }}>
          <p className="address-title">Transaction ID: </p>
        </Col>
        <Col sm={{ size: 8, offset: 0 }}>
          <div className="claimable-text-container">
            {claimable.txid}
            <CopyToClipboard className="btn btn-light" style={{}} text={claimable.txid}>
              <i className="fa fa-copy" />
            </CopyToClipboard>
          </div>
        </Col>
      </Row>
    );
  } else if (kind === 'Hookout' || kind === 'FeeBump') {
    return (
      <Row>
        <Col sm={{ size: 2, offset: 0 }}>
          <p className="address-title">Transaction ID: </p>
        </Col>
        <Col sm={{ size: 8, offset: 0 }}>
          <div className="claimable-text-container">
            {current}
            <CopyToClipboard className="btn btn-light" style={{}} text={current}>
              <i className="fa fa-copy" />
            </CopyToClipboard>
          </div>
        </Col>
      </Row>
    );
  }
  return null;
};

const walletStatuses = async (claimablehash: string) => {
  const statuses = await useClaimableStatuses(claimablehash);
  if (statuses != undefined) {
    return statuses;
  } else return null;
};
export default function StatusStuff(props: StatusStuffProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  // const [statusLength, setStatusLength] = useState(Number);
  //  const [actualTxid, setactualTxid] = useState('')

  const xyz = walletStatuses(props.claimableHash)
    .then(data => {
      if (data != null) {
        return data;
      }
    })
    .catch(error => {
      console.error(error);
      return undefined;
    });
  const a = async () => props.claimableHash;
  const e = async () => props.claimable.claimant;
  const amount = props.amount;
  useEffect(() => {
    const getData = async () => {
      const isReal = await xyz;
      if (isReal != undefined) {
        if (isReal.length > 1) {
          // filter for txid. and if it is confirmed???
          for (var i = isReal.length; i--; ) {
            const element = isReal[i];
            if ('txid' in element) {
              let txidstatus = element['txid'];
              // check if this always returns the last (first) txid in case of feebumps
              setCurrentTxid(hi.Buffutils.toHex(txidstatus));
            }
          }
        }
      } else if (isReal === undefined) {
        const data = await gettxid(await a(), await e());
        if (data != undefined) {
          setCurrentTxid(data);
        }
      }
    };
    getData();
    // const getStatus = async () => {
    //   const data = await getStatuses(await a());
    //   if (data != undefined) {
    //     setStatusLength(data);
    //   }
    // };
    // getStatus();
  });

  const fee = () => {
    if (props.kind === 'Hookin') {
      // we can also ask the custodian but let's just do this for now. (It won't be dynamic anyway and i don't think we want to send too many req's to the custodian for a const value anyway?)
       if(addressType(props.claimable["bitcoinAddress"]) === "p2sh"){
         return 500
       }
      return 100; // return consolidation fee
    } else if (props.kind === 'Hookout' || props.kind === 'FeeBump') {
      return props.claimable.fee;
    }
  };
  return (
    <div>
      <h5>{props.kind}</h5>
      <div className="inner-container">
        <GetStatuses
          claimableHash={props.claimableHash}
          // hasLength={statusLength}
          kind={props.kind}
        />

        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Address: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {props.claimable.bitcoinAddress}

              <CopyToClipboard className="btn btn-light" style={{}} text={props.claimable.bitcoinAddress}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <IsHookin claimable={props.claimable} kind={props.kind} current={CurrentTxid}></IsHookin>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Amount: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {`${amount} sat`}
              <CopyToClipboard className="btn btn-light" style={{}} text={amount.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Fee: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {`${fee()} sat`}

              <CopyToClipboard className="btn btn-light" style={{}} text={fee()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Priority: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{props.claimable.priority}</div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Created: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{props.created.toString()}</div>
          </Col>
        </Row>
        <br/>
        {props.kind == "Hookout" || props.kind == "FeeBump" ? 
        <Link to={{pathname: '/feebump-send', state: {txid: {CurrentTxid}} }} >
        <button className="btn btn-secondary">Feebump this transaction!</button>
      </Link> : null
         }
      </div>
    </div>
  );
}

// good enough
function addressType(address: string) {
  if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
    return 'legacy';
  }
  if (address.startsWith('2') || address.startsWith('3')) {
    return 'p2sh';
  }
  if (address.startsWith('tb1') || address.startsWith('bc1')) {
   //don't need p2wsh
    return 'bech32';
  }

  throw new Error('unrecognized address: ' + address);
}

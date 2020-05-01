import React, { useState, useEffect } from 'react';
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../util/copy-to-clipboard';

import * as hi from 'moneypot-lib';
// import { useClaimableStatuses, useClaimable } from "../state/wallet";
import { getStatusesByClaimable } from '../wallet/requests';

import { wallet } from '../state/wallet';

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
  hasLength: number;
};

type kind = {
  kind: string;
};

const Pending = (props: kind) => {
  if (props.kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Waiting for confirmation{' '}
      </a>
    );
  } else if (props.kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        In queue!{' '}
      </a>
    );
  } else if (props.kind === 'FeeBump') {
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        In queue!{' '}
      </a>
    );
  }
  return <div>Not found!</div>;
};

// remove (TODO)

const Failed = (props: kind) => {
  if (props.kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-danger status-badge">
        Invalid Hookin!{' '}
      </a>
    );
  } else if (props.kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-danger status-badge">
        Hookout failed! Please discard!{' '}
      </a>
    );
  } else if (props.kind === 'FeeBump') {
    return (
      <a href="#status" className="btn btn-outline-danger status-badge">
        Feebump failed! please discard!
      </a>
    );
  }
  return <div>Not found!</div>;
};

const Sent = (props: kind) => {
  if (props.kind === 'Hookin') {
    return (
      <a href="#status" className="btn btn-outline-success status-badge">
        {' '}
        Confirmed!{' '}
      </a>
    );
  } else if (props.kind === 'Hookout') {
    return (
      <a href="#status" className="btn btn-outline-success status-badge">
        {' '}
        Sent!{' '}
      </a>
    );
  } else if (props.kind === 'FeeBump') {
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
  // const statuses = useClaimableStatuses(props.claimableHash);
  const s = props.hasLength;
  if (!s) {
    return <Failed kind={props.kind} />;
  } else if (s >= 2) {
    return <Sent kind={props.kind} />;
  } else if (s == 1) {
    return <Pending kind={props.kind} />;
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
          // todo: check if this always returns the last (first) txid in case of feebumps
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

// todo: cache
const getStatuses = async (a: string) => {
  const statuses = await getStatusesByClaimable(wallet.config, a);
  return statuses.length;
};

const IsHookin = (props: isHookin) => {
  if (props.kind === 'Hookin') {
    return (
      <Row>
        <Col sm={{ size: 2, offset: 0 }}>
          <p className="address-title">Transaction ID: </p>
        </Col>
        <Col sm={{ size: 8, offset: 0 }}>
          <div className="claimable-text-container">
            {props.claimable.txid}
            <CopyToClipboard className="btn btn-light" style={{}} text={props.claimable.txid}>
              <i className="fa fa-copy" />
            </CopyToClipboard>
          </div>
        </Col>
      </Row>
    );
  } else
    return (
      <Row>
        <Col sm={{ size: 2, offset: 0 }}>
          <p className="address-title">Transaction ID: </p>
        </Col>
        <Col sm={{ size: 8, offset: 0 }}>
          <div className="claimable-text-container">
            {props.current}
            <CopyToClipboard className="btn btn-light" style={{}} text={props.current}>
              <i className="fa fa-copy" />
            </CopyToClipboard>
          </div>
        </Col>
      </Row>
    );
};

export default function StatusStuff(props: StatusStuffProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const [statusLength, setStatusLength] = useState(Number);
  //  const [actualTxid, setactualTxid] = useState('')
  const a = async () => props.claimableHash;
  const e = async () => props.claimable.claimant;
  const amount = props.amount;

  useEffect(() => {
    const getData = async () => {
      const data = await gettxid(await a(), await e());
      if (data != undefined) {
        setCurrentTxid(data);
      }
    };
    getData();
    const getStatus = async () => {
      const data = await getStatuses(await a());
      if (data != undefined) {
        setStatusLength(data);
      }
    };
    getStatus();
  });

  const fee = () => {
    if (props.kind === 'Hookin') {
      return 100; // return consolidation fee
    } else if (props.kind === 'Hookout' || props.kind === 'FeeBump') {
      return props.claimable.fee;
    }
  };
  return (
    <div>
      <h5>
        {props.kind}
      </h5>
      <div className="inner-container">
        <GetStatuses claimableHash={props.claimableHash} hasLength={statusLength} kind={props.kind}></GetStatuses>
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
      </div>
    </div>
  );
}

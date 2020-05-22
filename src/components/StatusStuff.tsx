import React, { useState, useEffect } from 'react';
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../util/copy-to-clipboard';

import * as hi from 'moneypot-lib';
import { getStatusesByClaimable } from '../wallet/requests';
import { wallet, useClaimableStatuses } from '../state/wallet';
import { Link } from 'react-router-dom';

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

const Pending = ({ kind }: kind): JSX.Element => {
  return kind === 'Hookin' ? (
    <a href="#status" className="btn btn-outline-warning status-badge">
      Waiting for confirmation!{" "} <i className="fad fa-question"/>
    </a>
  ) : kind === 'Hookout' || kind === 'FeeBump' ? (
    <a href="#status" className="btn btn-outline-warning status-badge">
      In queue!{" "} <i className="fad fa-question"/>
    </a>
  ) : <></>;
};

// not requesting the custodian for updates but instead relying on the wallet may cause false positives, so let's relax the tone..?
const Failed = ({ kind }: kind): JSX.Element => {
  return kind === 'Hookin' ? (
    <a href="#status" className="btn btn-outline-warning status-badge">
      Hookin might be invalid! Please sync!{" "} <i className="fad fa-question"/>
    </a>
  ) : kind === 'Hookout' ? (
    <a href="#status" className="btn btn-outline-warning status-badge">
      Hookout might be invalid! Please sync!{" "} <i className="fad fa-question"/>
    </a>
  ) : kind === 'FeeBump' ? (
    <a href="#status" className="btn btn-outline-warning status-badge">
      Feebump might be invalid! Please sync!{" "} <i className="fad fa-question"/>
    </a>
  ) : <></>;
};

const Sent = ({ kind }: kind): JSX.Element => {
  return kind === 'Hookin' ? (
    <a href="#status" className="btn btn-outline-success status-badge">
      Confirmed!{" "} <i className="fad fa-check"/>
    </a>
  ) : kind === 'Hookout' || kind === 'FeeBump' ? (
    <a href="#status" className="btn btn-outline-success status-badge">
      Sent!{" "}   <i className="fad fa-check"/>
    </a>
  ) : <></>;
};

const GetStatuses = (props: clhash): JSX.Element => {
  const statuses = useClaimableStatuses(props.claimableHash);
  return (!(statuses)) ? <></> : statuses.length >= 2 ? (
    <Sent kind={props.kind}/>
  ) : statuses.length === 1 ? (
    <Pending kind={props.kind}/>
  ) : statuses.length === 0 ? (
    <Failed kind={props.kind}/>
  ) : <></>;
};

async function gettxid(a: string): Promise<string | undefined> {
  const statuses = await getStatusesByClaimable(wallet.config, a);
  // if the function is called anyway, lets fetch new statuses.
  wallet.requestStatuses(a);
  if (!statuses) {
    return undefined;
  } else if (statuses.length > 0) {
    for (var i = statuses.length; i--; ) {
      const element = statuses[i];
      if ('contents' in element) {
        let txidstatus = element.contents;
        if ('txid' in txidstatus) {
          return hi.Buffutils.toHex(txidstatus.txid);
        }
      }
    }
  }
}

const IsHookin = ({ kind, current, claimable }: isHookin): JSX.Element => {
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
  return <></>;
};

const walletStatuses = async (claimablehash: string): Promise<hi.Status[] | undefined>  => {
  const statuses = await useClaimableStatuses(claimablehash);
  if (statuses != undefined) {
    return statuses;
  } else return undefined;
};
export default function StatusStuff(props: StatusStuffProps): JSX.Element {
  const [CurrentTxid, setCurrentTxid] = useState('');

  const getAlreadyStoredStatuses = walletStatuses(props.claimableHash)
    .then(data => {
      if (data != null) {
        return data;
      }
    })
    .catch(error => {
      console.error(error);
      return undefined;
    });

  useEffect(() => {
    const getData = async (): Promise<void> => {
      const isReal = await getAlreadyStoredStatuses;
      if (isReal != undefined) {
        if (isReal.length > 1) {
          // TODO: we don't check for feebumps..?
          for (var i = isReal.length; i--; ) {
            const element = isReal[i];
            if ('txid' in element) {
              let txidstatus = element.txid;
              // check if this always returns the last (first) txid in case of feebumps
              setCurrentTxid(hi.Buffutils.toHex(txidstatus));
            }
          }
        } else {
          const data = await gettxid(props.claimableHash);
          if (data != undefined) {
            setCurrentTxid(data);
          } else {
            setCurrentTxid('');
          }
        }
      }
    };
    getData();
  });

  const fee = (): number => {
    if (props.kind === 'Hookin') {
      // we can also ask the custodian but let's just do this for now. (It won't be dynamic anyway and i don't think we want to send too many req's to the custodian for a const value anyway?)
     return addressType(props.claimable.bitcoinAddress) === 'p2sh' ? 500 : 100
    } 
    else return props.kind === 'Hookout' || props.kind === "Feebump" ? props.claimable.fee : 100
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
            {props.kind === 'Hookout' || props.kind === 'Hookin' ? (
              <p className="address-title">Address: </p>
            ) : (
              <p className="address-title">Original TXID: </p>
            )}
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {props.kind === 'Hookout' || props.kind === 'Hookin' ? props.claimable.bitcoinAddress : props.claimable.txid}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={props.kind === 'Hookout' || props.kind === 'Hookin' ? props.claimable.bitcoinAddress : props.claimable.txid}
              >
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
              {`${props.amount} sat`}
              <CopyToClipboard className="btn btn-light" style={{}} text={props.amount.toString()}>
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

              <CopyToClipboard className="btn btn-light" style={{}} text={fee().toString()}>
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
        <br />
        {props.kind == 'Hookout' || props.kind == 'FeeBump' ? (
          <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
            <button className="btn btn-secondary">Feebump this transaction!</button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// good enough
function addressType(address: string): string {
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

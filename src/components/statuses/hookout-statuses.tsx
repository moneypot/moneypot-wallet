import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import { Link } from 'react-router-dom';
import {
  legacyTransactionWeight,
  wrappedTransactionWeight,
  segmultiTransactionWeight,
  templateTransactionWeight,
  legacyOutput,
  wrappedOutput,
  segmultiOutput,
  segwitOutput,
} from '../../config';

type HookoutProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.Hookout & Partial<mp.Acknowledged.Claimable>;
};

export default function HookoutStatuses(props: HookoutProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const claimable = props.claimable.toPOD();
  const statuses = useClaimableStatuses(props.claimableHash);
  const [sent, isSent] = useState(false);

  const [Memo, setMemo] = useState<undefined | string>(undefined);

  // we calculate this each time...
  const addressType = mp.decodeBitcoinAddress(claimable.bitcoinAddress);
  // deal with non-standard maybe..?
  if (addressType instanceof Error) {
    throw 'invalid address? Huh?';
  }

  const calcFeeRate = () => {
    if (claimable.priority === 'IMMEDIATE' || claimable.priority === 'CUSTOM') {
      switch (addressType.kind) {
        case 'p2pkh':
          return claimable.fee / legacyTransactionWeight;
        case 'p2sh':
          return claimable.fee / wrappedTransactionWeight;
        case 'p2wsh':
          return claimable.fee / segmultiTransactionWeight;
        default:
          return claimable.fee / templateTransactionWeight;
      }
    }
    if (claimable.priority === 'BATCH') {
      switch (addressType.kind) {
        case 'p2pkh':
          return claimable.fee / legacyOutput;
        case 'p2sh':
          return claimable.fee / wrappedOutput;
        case 'p2wsh':
          return claimable.fee / segmultiOutput;
        default:
          return claimable.fee / segwitOutput;
      }
    } else return 1; // free
  };

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof BitcoinTransactionSent) {
              setCurrentTxid(mp.Buffutils.toHex(s.txid));
              isSent(true);
            }
          }
          !statuses.some(status => status instanceof BitcoinTransactionSent) && (await wallet.requestStatuses(props.claimableHash));

          if (props.claimable instanceof mp.Acknowledged.default) {
            !statuses.some(status => status instanceof Claimed) && wallet.claimClaimable(props.claimable);
          }
        } else await wallet.requestStatuses(props.claimableHash);
      }
      const memo = localStorage.getItem(claimable.hash);
      if (memo != undefined) {
        setMemo(memo);
      }
    };
    getData();
  });

  const GetStatuses = () => {
    if (!statuses) {
      return <span> Loading Statuses...</span>;
    } else if (statuses.length > 0) {
      for (const s of statuses) {
        if (s instanceof BitcoinTransactionSent) {
          return (
            <a href="#status" className="btn btn-outline-success status-badge">
              Hookout Sent!
            </a>
          );
        }
      }
    }
    if (!statuses.some(status => status instanceof BitcoinTransactionSent)) {
      if (statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-warning status-badge">
            Hookout Pending! (In Queue!)
          </a>
        );
      } else if (!statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-danger status-badge">
            Hookout not in queue! Please Sync!
          </a>
        );
      }
    }
    return <span>Loading Statuses...</span>;
  };

  return (
    <div>
      <h5>
        <i className="fad fa-arrow-from-bottom" /> Hookout
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Address: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {claimable.bitcoinAddress}
              <CopyToClipboard className="btn btn-light" style={{}} text={claimable.bitcoinAddress}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Transaction ID: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {CurrentTxid}
              <CopyToClipboard className="btn btn-light" style={{}} text={CurrentTxid}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Amount: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {`${claimable.amount} sat`}
              <CopyToClipboard className="btn btn-light" style={{}} text={claimable.amount.toString()}>
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
              {`${claimable.fee} sat` + ' || ' + ` (${(calcFeeRate() * 4).toFixed(2)} sat/vB)`}

              <CopyToClipboard className="btn btn-light" style={{}} text={claimable.fee.toString()}>
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
            <div className="claimable-text-container">{claimable.priority}</div>
          </Col>
        </Row>

        {Memo != undefined && (
          <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">Memo: </p>
            </Col>
            <Col sm={{ size: 8, offset: 0 }}>
              <div className="claimable-text-container">{Memo}</div>
            </Col>
          </Row>
        )}
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Created: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{props.created.toString()}</div>
          </Col>
        </Row>
        {sent === true && (
          <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
            <button className="btn btn-secondary">Feebump this transaction!</button>
          </Link>
        )}
      </div>
    </div>
  );
}

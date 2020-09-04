import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import { Link } from 'react-router-dom';
import fetchTxReceives from '../../wallet/requests/bitcoin-txs';

type FeeBumpProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.FeeBump & Partial<mp.Acknowledged.Claimable>;
};

export default function FeeBumpStatuses(props: FeeBumpProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const claimable = props.claimable.toPOD();
  const statuses = useClaimableStatuses(props.claimableHash);
  const [IsConfirmed, hasConfirmed] = useState(true); // prevent false positives when loading

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof BitcoinTransactionSent) {
              setCurrentTxid(mp.Buffutils.toHex(s.txid));
              getConfirmationStatus(mp.Buffutils.toHex(s.txid)); // have to do the operation twice....
            }
          }
          !statuses.some(status => status instanceof BitcoinTransactionSent) && (await wallet.requestStatuses(props.claimableHash));
          if (props.claimable instanceof mp.Acknowledged.default) {
            !statuses.some(status => status instanceof Claimed) && wallet.claimClaimable(props.claimable);
          }
        } else {
          await wallet.requestStatuses(props.claimableHash);
        }
      }
    };
    getData();
    async function getConfirmationStatus(txid: string) {
      const request = await fetchTxReceives(txid);
      hasConfirmed(request.status.confirmed);
    }
  });

  const GetStatuses = () => {
    if (!statuses) {
      return <span> Loading Statuses...</span>;
    } else if (statuses.length > 0) {
      for (const s of statuses) {
        if (s instanceof BitcoinTransactionSent) {
          return (
            <a href="#status" className="btn btn-outline-success status-badge">
              Feebump Sent!
            </a>
          );
        }
      }
    }
    if (!statuses.some(status => status instanceof BitcoinTransactionSent)) {
      if (statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-warning status-badge">
            Feebump Pending! (In Queue!)
          </a>
        );
      } else if (!statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-danger status-badge">
            Feebump not in queue! Please Sync!
          </a>
        );
      }
    }
    return <span>Loading Statuses...</span>;
  };

  return (
    <div>
      <h5>
        <i className="fad fa-history" /> feebump
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Original transaction ID: </p>
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
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">New transaction ID: </p>
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
        {/* <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Fee: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {`${claimable.fee} sat`}

              <CopyToClipboard className="btn btn-light" style={{}} text={claimable.fee.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row> */}
        {/* <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Priority: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
           {claimable.priority}
            </div>
          </Col>
        </Row> */}
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Created: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{props.created.toString()}</div>
          </Col>
        </Row>
        {IsConfirmed === false && (
          <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
            <button className="btn btn-secondary">Feebump this transaction!</button>
          </Link>
        )}
      </div>
    </div>
  );
}

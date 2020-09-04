import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import HookinAccepted from 'moneypot-lib/dist/status/hookin-accepted';

type HookinProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.Hookin & Partial<mp.Acknowledged.Claimable>;
};

export default function HookinStatuses(props: HookinProps) {
  const [CurrentConsolidationFee, setCurrentConsolidationFee] = useState(0);
  const claimable = props.claimable.toPOD();

  const statuses = useClaimableStatuses(props.claimableHash);
  const [Memo, setMemo] = useState<undefined | string>(undefined);

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof HookinAccepted) {
              setCurrentConsolidationFee(s.consolidationFee);
            }
          }
          !statuses.some(status => status instanceof HookinAccepted) && (await wallet.requestStatuses(props.claimableHash));
          if (props.claimable instanceof mp.Acknowledged.default) {
            !statuses.some(status => status instanceof Claimed) && (await wallet.claimClaimable(props.claimable));
          }
        } else if (statuses === undefined) {
          await wallet.requestStatuses(props.claimableHash);
        }
        // if we have no ack - we need an ack.
        if (!(props.claimable instanceof mp.Acknowledged.default)) {
          wallet.acknowledgeClaimable(props.claimable);
        }
      }
    };
    const memo = localStorage.getItem(claimable.bitcoinAddress);
    if (memo != undefined) {
      setMemo(memo);
    }
    getData();
  });

  const GetStatuses = () => {
    if (!statuses) {
      return <span> Loading Statuses...</span>;
    } else if (statuses.length > 0) {
      for (const s of statuses) {
        if (s instanceof HookinAccepted) {
          return (
            <a href="#status" className="btn btn-outline-success status-badge">
              Hookin received!
            </a>
          );
        }
      }
    }
    if (!statuses.some(status => status instanceof HookinAccepted)) {
      if (statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-warning status-badge">
            Waiting for confirmations!?
          </a>
        );
      }
      if (!statuses.some(status => status instanceof Claimed) && props.claimable instanceof mp.Acknowledged.default) {
        return (
          <a href="#status" className="btn btn-outline-warning status-badge">
            Custodian has not yet accepted the hookin!
          </a>
        );
      } else if (!(props.claimable instanceof mp.Acknowledged.default)) {
        return (
          <a href="#status" className="btn btn-outline-danger status-badge">
            Custodian is not aware of the hookin!
          </a>
        );
      }
    }
    return <span>Loading Statuses...</span>;
  };

  return (
    <div>
      <h5>
        <i className="fad fa-arrow-from-top" /> Hookin
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
              {claimable.txid}
              <CopyToClipboard className="btn btn-light" style={{}} text={claimable.txid}>
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
              {`${CurrentConsolidationFee} sat`}

              <CopyToClipboard className="btn btn-light" style={{}} text={CurrentConsolidationFee.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
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
        {claimable.amount < CurrentConsolidationFee && (
          <Row>
            <Col sm={{ size: 8, offset: 0 }}>
              <div className="claimable-text-container">
                {' '}
                <a href="#status" className="btn btn-outline-danger status-badge">
                  the fees for this Hookin are greater than the inputs itself! It's worthless!{' '}
                </a>
              </div>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}

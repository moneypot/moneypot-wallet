import React, { useState, useEffect } from 'react';
// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import { notError } from '../../util';
import Failed from 'moneypot-lib/dist/status/failed';
import LightningPaymentSent from 'moneypot-lib/dist/status/lightning-payment-sent';
type LightningInvoiceProps = {
  paymentRequest: string;
  memo: string;
  created: Date;
  claimableHash: string;
  claimable: mp.LightningPayment & Partial<mp.Acknowledged.Claimable>; // reversed typing
};

export default function LightningPayment(props: LightningInvoiceProps) {
  let amount = GetLightningPaymentRequestAmount(props.paymentRequest);

  if (amount === ' ') {
    amount = props.claimable.toPOD().amount;
  }

  const statuses = useClaimableStatuses(props.claimableHash);

  const [paymentStatusFailed, setPaymentStatusFailed] = useState<Failed>(Object);
  const [paymentStatusSuccess, setPaymentStatusSuccess] = useState<LightningPaymentSent>(Object);
  const [paymentPreimage, setpaymentPreimage] = useState('');
  const pro = notError(mp.decodeBolt11(props.paymentRequest));
  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === 'description') {
      description = tag.data;
    }
  }
  let payment_hash;
  for (const tag of pro.tags) {
    if (tag.tagName === 'payment_hash') {
      payment_hash = tag.data;
    }
  }

  let memo = description != null ? description : '';
  let hash = payment_hash != null ? payment_hash : '';

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof LightningPaymentSent) {
              setPaymentStatusSuccess(s);
              setpaymentPreimage(mp.Buffutils.toHex(s.paymentPreimage));
            }
            if (s instanceof Failed) {
              setPaymentStatusFailed(s);
            }
          }
          !statuses.some(status => status instanceof LightningPaymentSent) && (await wallet.requestStatuses(props.claimableHash));
        } else await wallet.requestStatuses(props.claimableHash);
      }
    };
    getData();
  });

  const GetStatuses = () => {
    if (!statuses) {
      return <span>Loading statuses...</span>;
    } else if (statuses.length > 0) {
      for (const s of statuses) {
        if (s instanceof LightningPaymentSent) {
          return (
            <a href="#status" className="btn btn-outline-success status-badge">
              Sent!
            </a>
          );
        }
        if (s instanceof Failed) {
          return (
            <a href="#status" className="btn btn-outline-danger status-badge">
              payment has failed!
              {/* {s.reason} */}
            </a>
          );
        }
      }
    }
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Pending!
      </a>
    );
  };

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Payment!
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <div className="qr-code-wrapper">
          <div className="qr-code-container">
            <span>
              <TheQr text={props.paymentRequest.toUpperCase()} />
            </span>
          </div>
        </div>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Address:</p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="address-text-container">
              <code>{props.paymentRequest}</code>{' '}
              <CopyToClipboard className="btn btn-light" style={{}} text={props.paymentRequest}>
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
              <p>{amount} sat</p>
              <CopyToClipboard className="btn btn-light" style={{}} text={amount.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Payment Hash: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {hash}
              <CopyToClipboard className="btn btn-light" style={{}} text={hash.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">
              {paymentStatusSuccess.hash != undefined ? 'rPreimage:' : paymentStatusFailed != undefined ? 'Reason for failure:' : 'Waiting for statuses?'}{' '}
            </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {paymentStatusSuccess.hash != undefined ? paymentPreimage : paymentStatusFailed != undefined ? paymentStatusFailed.reason : '...'}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={paymentStatusSuccess.hash != undefined ? paymentPreimage : paymentStatusFailed != undefined ? paymentStatusFailed.reason : '...'}
              >
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">
              {paymentStatusSuccess.hash != undefined ? 'total fees:' : paymentStatusFailed != undefined ? 'rebate:' : 'Waiting for statuses?'}{' '}
            </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {paymentStatusSuccess.hash != undefined ? paymentStatusSuccess.totalFees : paymentStatusFailed != undefined ? paymentStatusFailed.rebate : '...'}{' '}
              {' sat'}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Memo: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{memo}</div>
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

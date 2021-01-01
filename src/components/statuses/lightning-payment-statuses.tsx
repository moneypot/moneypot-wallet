import * as hi from 'moneypot-lib';
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
import Claimed from 'moneypot-lib/dist/status/claimed';
import { ToastContainer } from 'react-toastify';
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
  const [Loading, setLoading] = useState<boolean>(false);

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
      if (!statuses) {
        return;
      }
      if (statuses) {
        for (const s of statuses) {
          if (s instanceof LightningPaymentSent) {
            setPaymentStatusSuccess(s);
            setpaymentPreimage(mp.Buffutils.toHex(s.paymentPreimage));
          }
          if (s instanceof Failed) {
            setPaymentStatusFailed(s);
          }
        }
        if (!statuses.some((status) => status instanceof LightningPaymentSent) && !statuses.some((status) => status instanceof Failed)) {
          await wallet.requestStatuses(props.claimableHash);
        }
        if (props.claimable instanceof mp.Acknowledged.default) {
          // we want to claim on fail, and initial.
          if (statuses.some((status) => status instanceof LightningPaymentSent) || statuses.some((status) => status instanceof Failed)) {
            if (statuses.filter((status) => status instanceof Claimed).length < 2) {
              const amountToClaim = hi.computeClaimableRemaining(props.claimable.contents, statuses);
              if (amountToClaim > 0) {
                if (!Loading) {
                  setLoading(!Loading);
                  await wallet.claimClaimable(props.claimable);
                }
              }
            }
          }
        } else {
          // await wallet.acknowledgeClaimable(props.claimable);
        }
      }
    };
    getData();
  }, [statuses]);
  const GetStatuses = () => {
    if (!statuses) {
      return <span>Loading statuses...</span>;
    }
    // we don't know how many claims are required, could be 1, could be 2
    if (statuses.some((status) => status instanceof LightningPaymentSent)) {
      return (
        <a href="#status" className="btn btn-outline-success status-badge">
          Sent!
        </a>
      );
    }
    if (statuses.some((status) => status instanceof Failed)) {
      return (
        <a href="#status" className="btn btn-outline-danger status-badge">
          payment has failed!
          {/* {s.reason} */}
        </a>
      );
    }
    if (
      !statuses.some((status) => status instanceof LightningPaymentSent) &&
      !statuses.some((status) => status instanceof Failed) &&
      props.claimable instanceof mp.Acknowledged.default
    ) {
      return (
        <a href="#status" className="btn btn-outline-primary status-badge">
          payment is in transition!
          {/* {s.reason} */}
        </a>
      );
    } else if (!(props.claimable instanceof mp.Acknowledged.default)) {
      return (
        <a href="#status" className="btn btn-outline-danger status-badge">
          Custodian is not yet aware of the payment request! You can discard it and resync to get your funds back!
          {/* {s.reason} */}
        </a>
      );
    }

    return <span>Loading statuses...</span>;
  };

  return (
    <div>
      <ToastContainer />
      <h5>
        <i className="far fa-bolt" /> Lightning Payment!
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <br /> &nbsp;
        <div className="qr-code-wrapper">
          <div className="qr-code-container">
            <span>
              <TheQr text={props.paymentRequest.toUpperCase()} />
            </span>
          </div>
        </div>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Invoice:</p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="address-text-container">
              <code style={{ wordBreak: 'break-word' }}>{props.paymentRequest}</code>{' '}
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
              {/* <CopyToClipboard className="btn btn-light" style={{}} text={amount.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard> */}
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
              {/* <CopyToClipboard className="btn btn-light" style={{}} text={hash.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">
              {paymentStatusSuccess.hash != undefined ? 'Preimage:' : paymentStatusFailed != undefined ? 'Reason for failure:' : 'Waiting for statuses?'}{' '}
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

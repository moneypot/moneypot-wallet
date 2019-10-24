import React from 'react';
// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import * as hi from 'hookedin-lib';
import { Col, Row } from "reactstrap";
import CopyToClipboard from "../util/copy-to-clipboard";

type LightningInvoiceProps = {
  paymentRequest: string,
  memo: string,
  created: object,
};

export default function LightningInvoice(props: LightningInvoiceProps) {

  const pro = hi.decodeBolt11(props.paymentRequest);
  let amount;
    if (pro instanceof Error) {
    amount = 'error';
    throw pro;
  }
  if (pro.satoshis) {
    // this invoice has a specific amount...
    amount = pro.satoshis.toString()
  } else {
    // this invoice is for any amount
    amount = 'Not determined'
  }
  return (
    <div>
      <h5>< i className = "far fa-bolt" />{' '}Lightning Invoice</h5>
      <div className="inner-container">

        <a href="#status"
          className="btn btn-outline-warning status-badge">
          Pending
        </a>
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
            {amount}{pro.satoshis? ' sat': ''}
            <CopyToClipboard className="btn btn-light" style={{}} text={amount}>
              <i className="fa fa-copy" />
            </CopyToClipboard>
          </div>
        </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Memo: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {props.memo}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Created: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {props.created.toString()}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet, useClaimable } from '../../state/wallet';
import { notError } from '../../util';
import InvoiceSettledStatus from 'moneypot-lib/dist/status/invoice-settled';
import Claimed from 'moneypot-lib/dist/status/claimed';

type LightningInvoiceProps = {
  paymentRequest: string;
  // memo: string;
  created: Date;
  claimableHash: string;
  claimable: mp.Acknowledged.Claimable;
  // mp.Claimable & mp.Acknowledged.Claimable; // mp.Acknowledged.Claimable
};

export default function LightningInvoice(props: LightningInvoiceProps) {
  const amount = GetLightningPaymentRequestAmount(props.paymentRequest);
  const [infiniteAmount, setFiniteAmount] = useState(0);
  const statuses = useClaimableStatuses(props.claimableHash);

  // this is not that interesting, just placeholders. maybe we want to call the custodian for transfer hashes
  const [hasPreimage, setPreimage] = useState<string | undefined>(undefined);

  const pro = notError(mp.decodeBolt11(props.paymentRequest));
  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === 'description') {
      description = tag.data;
    }
  }
  function isExpired() {
    const pro = notError(mp.decodeBolt11(props.paymentRequest));
    const currentTime = new Date().getTime();
    const expiryTime = new Date(pro.timeExpireDateString).getTime();
    if (currentTime > expiryTime) {
      return false;
    } else if (currentTime < expiryTime) {
      return true;
    }
    return false;
  }

  // doesn't automatically claim.

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 0) {
          for (const s of statuses) {
            if (s instanceof InvoiceSettledStatus) {
              setPreimage(mp.Buffutils.toHex(s.rPreimage));
              if (amount === ' ') {
                setFiniteAmount(s.amount);
              }
            }
          }
          !statuses.some(status => status instanceof InvoiceSettledStatus) && (await wallet.requestStatuses(props.claimableHash));

          if (props.claimable instanceof mp.Acknowledged.default) {
            !statuses.some(status => status instanceof Claimed) && (await wallet.claimClaimable(props.claimable));
          }
          // if (!(statuses instanceof Claimed )) {
          //   wallet.claimClaimable(props.claimable)
          // }
        } else await wallet.requestStatuses(props.claimableHash);
      }
    };
    getData();
  });

  const GetStatuses = () => {
    if (!statuses) {
      return <span> Loading Statuses...</span>;
    } else if (statuses.length > 0) {
      for (const s of statuses) {
        if (s instanceof InvoiceSettledStatus) {
          return (
            <a href="#status" className="btn btn-outline-success status-badge">
              Received!
            </a>
          );
        }
      }
    }
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Pending...
      </a>
    );
  };

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Invoice
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
            <p className="address-title">Invoice:</p>
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
        {hasPreimage != undefined && (
          <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">rPreimage:</p>
            </Col>
            <Col sm={{ size: 8, offset: 0 }}>
              <div className="address-text-container">
                {hasPreimage}{' '}
                <CopyToClipboard className="btn btn-light" style={{}} text={hasPreimage}>
                  <i className="fa fa-copy" />
                </CopyToClipboard>
              </div>
            </Col>
          </Row>
        )}
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Amount: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {amount === ' ' && infiniteAmount != 0 ? `${infiniteAmount} sat` : amount === ' ' ? 'any amount of sat' : `${amount} sat`}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={amount === ' ' ? '0' : amount === ' ' && infiniteAmount != 0 ? infiniteAmount.toString() : amount.toString()}
              >
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
            <div className="claimable-text-container" style={{ wordBreak: 'break-word' }}>
              {description != null && description.toString()}
            </div>
            <br />
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
        {isExpired() === false && statuses != undefined
          ? !statuses.some(status => status instanceof InvoiceSettledStatus) && (
              <Row>
                <Col sm={{ size: 8, offset: 0 }}>
                  <div className="claimable-text-container">
                    {' '}
                    <a href="#status" className="btn btn-outline-danger status-badge">
                      This invoice has expired!
                    </a>
                  </div>
                </Col>
              </Row>
            )
          : undefined}
      </div>
    </div>
  );
}

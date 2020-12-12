import React, { useEffect, useState } from 'react';
// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import { Col, Row, Button } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import GetLightningPaymentRequestAmount from '../../util/get-lightning-payment-request-amount';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet, useClaimable } from '../../state/wallet';
import { notError } from '../../util';
import InvoiceSettledStatus from 'moneypot-lib/dist/status/invoice-settled';
import Claimed from 'moneypot-lib/dist/status/claimed';
import useUniqueId from '../../util/use-unique-id';
import InvoiceSettled from 'moneypot-lib/dist/status/invoice-settled';
import Timer from '../../util/timer';

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
  const [expired] = useState<boolean>(isExpired());
  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === 'description') {
      description = tag.data;
    }
  }
  // refactor TODO
  function isExpired() {
    const pro = notError(mp.decodeBolt11(props.paymentRequest));
    const currentTime = new Date().getTime();
    const expiryTime = new Date(pro.timeExpireDateString).getTime();
    if (currentTime >= expiryTime) {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
        for (const s of statuses) {
          if (s instanceof InvoiceSettledStatus) {
            setPreimage(mp.Buffutils.toHex(s.rPreimage));
            if (amount === ' ') {
              setFiniteAmount(s.amount);
            }
          }
        }

        if (props.claimable instanceof mp.Acknowledged.default) {
          if (!statuses.some(status => status instanceof InvoiceSettledStatus)) {
            if (!expired) {
              await wallet.requestStatuses(props.claimableHash);
            }
          }
          if (!statuses.some(status => status instanceof Claimed)) {
            if (statuses.some(status => status instanceof InvoiceSettledStatus)) {
              await wallet.claimClaimable(props.claimable);
            }
          }
        } else {
          await wallet.acknowledgeClaimable(props.claimable);
        }
        // if (!(statuses instanceof Claimed )) {
        //   wallet.claimClaimable(props.claimable)
        // }
      }
    };
    getData();
  }, [statuses]);

  const GetStatuses = () => {
    if (!statuses) {
      return <span> Loading Statuses...</span>;
    }
    if (statuses.some(status => status instanceof InvoiceSettled)) {
      if (statuses.some(status => status instanceof Claimed)) {
        return (
          <a href="#status" className="btn btn-outline-success status-badge">
            Received and claimed!
          </a>
        );
      } else {
        return (
          <a href="#status" className="btn btn-outline-primary status-badge">
            Received but not yet claimed!
          </a>
        );
      }
    } else {
      return (
        <a href="#status" className="btn btn-outline-warning status-badge">
          Pending...
        </a>
      );
    }
    // return <span> Loading Statuses...</span>;
  };

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Invoice
      </h5>
      <div className="inner-container">
        <GetStatuses />
        {statuses && !statuses.some(status => status instanceof InvoiceSettledStatus) && !expired ? (
          <div className="qr-code-wrapper">
            <div className="qr-code-container">
              <span>
                <TheQr text={props.paymentRequest.toUpperCase()} />
              </span>
            </div>
          </div>
        ) : (
          undefined
        )}
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
        {hasPreimage != undefined ? (
          <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">rPreimage:</p>
            </Col>
            <Col sm={{ size: 8, offset: 0 }}>
              <div className="address-text-container">
                {hasPreimage}{' '}
                {/* <CopyToClipboard className="btn btn-light" style={{}} text={hasPreimage}>
          <i className="fa fa-copy" />
        </CopyToClipboard> */}
              </div>
            </Col>
          </Row>
        ) : (
          undefined
        )}
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Amount: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {amount === ' ' && infiniteAmount != 0 ? `${infiniteAmount} sat` : amount === ' ' ? 'any amount of sat' : `${amount} sat`}
              {/* <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={amount === ' ' ? '0' : amount === ' ' && infiniteAmount != 0 ? infiniteAmount.toString() : amount.toString()}
              >
                <i className="fa fa-copy" />
              </CopyToClipboard> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Memo: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container" style={{ wordBreak: 'break-word' }}>
              {description != null ? description.toString() : undefined}
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
        {statuses && !statuses.some(status => status instanceof InvoiceSettledStatus) && !expired ? <Timer p={pro.timeExpireDate * 1000} /> : undefined}
      </div>
    </div>
  );
}

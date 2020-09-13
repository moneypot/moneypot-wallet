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

type LightningInvoiceProps = {
  paymentRequest: string;
  // memo: string;
  created: Date;
  claimableHash: string;
  claimable: mp.Acknowledged.Claimable;
  // mp.Claimable & mp.Acknowledged.Claimable; // mp.Acknowledged.Claimable
};

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function LightningInvoice(props: LightningInvoiceProps) {
  const calculateTimeLeft = (year: Date) => {
    if (!year) {
      return;
    }
    const difference = +year - +new Date();
    let timeLeft = {} as TimeLeft;

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const amount = GetLightningPaymentRequestAmount(props.paymentRequest);
  const [infiniteAmount, setFiniteAmount] = useState(0);
  const statuses = useClaimableStatuses(props.claimableHash);

  // this is not that interesting, just placeholders. maybe we want to call the custodian for transfer hashes
  const [hasPreimage, setPreimage] = useState<string | undefined>(undefined);
  const pro = notError(mp.decodeBolt11(props.paymentRequest));
  const [year] = useState<Date | undefined>(pro.timeExpireDateString === undefined ? undefined : new Date(pro.timeExpireDateString));
  const [timeLeft, setTimeLeft] = useState<undefined | any>(year === undefined ? undefined : calculateTimeLeft(year));
  const [expired] = useState<boolean>(isExpired())

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
    if (currentTime >= expiryTime) {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    if (pro.timeExpireDateString) {
      if (year) {
        setTimeout(() => {
          setTimeLeft(calculateTimeLeft(year));
        }, 1000);
      }
    }
  });

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
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
  }, [statuses]);

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

  let timerComponents: JSX.Element[] = [];
  if (pro.timeExpireDateString) {
    for (const [key, value] of Object.entries(timeLeft)) {
      timerComponents.push(
        <span key={useUniqueId()}>
          {value} {key}{' '}
        </span>
      );
    }
  }
  let Tcolor: string | undefined;
  if (timeLeft) {
    Tcolor = timeLeft.minutes < 10 && timeLeft.hours === 0 ? 'danger' : 'info';
  }

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Invoice
      </h5>
      <div className="inner-container">
        <GetStatuses />    
        { statuses && !statuses.some(status => status instanceof InvoiceSettledStatus) && (!expired) &&  <div className="qr-code-wrapper">
          <div className="qr-code-container">
            <span>
              <TheQr text={props.paymentRequest.toUpperCase()} />
            </span>
          </div>
        </div>}
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
                {/* <CopyToClipboard className="btn btn-light" style={{}} text={hasPreimage}>
                  <i className="fa fa-copy" />
                </CopyToClipboard> */}
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
        {expired && statuses
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
        {!expired && statuses
          ? !statuses.some(status => status instanceof InvoiceSettledStatus) && (
              <Button color={Tcolor}>
                {' '}
                {(timeLeft.minutes > 30 && <i className="fad fa-hourglass-start" />) ||
                  (timeLeft.hours >= 1 && <i className="fad fa-hourglass-start" />) ||
                  (timeLeft.minutes > 10 && <i className="fad fa-hourglass-half" />) ||
                  (timeLeft.days <= 10 && <i className="fad fa-hourglass-end" />)}{' '}
                {timerComponents}
              </Button>
            )
          : undefined}
      </div>
    </div>
  );
}

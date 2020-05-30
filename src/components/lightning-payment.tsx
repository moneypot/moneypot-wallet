import React, { useState, useEffect } from "react";
// @ts-ignore
import { TheQr } from "@the-/ui-qr";
import { Col, Row } from "reactstrap";
import CopyToClipboard from "../util/copy-to-clipboard";
import GetLightningPaymentRequestAmount from "../util/get-lightning-payment-request-amount";
import * as mp from "moneypot-lib";
import { useClaimableStatuses, wallet } from "../state/wallet";
import { notError } from "../util";
import { getStatusesByClaimable } from "../wallet/requests";
import Failed from "moneypot-lib/dist/status/failed";
import LightningPaymentSent from "moneypot-lib/dist/status/lightning-payment-sent";
type LightningInvoiceProps = {
  paymentRequest: string;
  memo: string;
  created: object;
  claimableHash: string;
};

export default function LightningPayment(props: LightningInvoiceProps) {
  const amount = GetLightningPaymentRequestAmount(props.paymentRequest);
  const statuses = useClaimableStatuses(props.claimableHash);

  const [paymentStatusFailed, setPaymentStatusFailed] = useState<Failed>(
    Object
  );
  const [paymentStatusSuccess, setPaymentStatusSuccess] = useState<
    LightningPaymentSent
  >(Object);
  const [paymentPreimage, setpaymentPreimage] = useState("");
  const pro = notError(mp.decodeBolt11(props.paymentRequest));
     let description;
     for (const tag of pro.tags) {
       if (tag.tagName === 'description') {
         description = tag.data;
       }
     }
  let payment_hash;
  for (const tag of pro.tags) {
    if (tag.tagName === "payment_hash") {
      payment_hash = tag.data;
    }
  }
  
  let memo = description != null ? description : "";
  let hash = payment_hash != null ? payment_hash : "";

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 1) {
          for (var i = statuses.length; i--; ) {
            const element = statuses[i];
            if ("reason" in element) {
              setPaymentStatusFailed(element);
            } else if ("totalFees" in element) {
              setPaymentStatusSuccess(element);
              setpaymentPreimage(mp.Buffutils.toHex(element.paymentPreimage));
            }
          }
        } else if (statuses.length <= 1) {
          // get statuses...
          await getNewStatuses(props.claimableHash);
        }
      }
    };
    getData();
  });

  async function getNewStatuses(a: string): Promise<mp.Status | undefined> {
    const statuses = await getStatusesByClaimable(wallet.config, a);
    // if the function is called anyway, lets fetch new statuses.
    wallet.requestStatuses(a);
    if (!statuses) {
      return undefined;
    } else if (statuses.length > 0) {
      for (var i = statuses.length; i--; ) {
        const element = statuses[i];
        if ("contents" in element) {
          return element.contents;
        }
      }
    }
  }

  function GetStatuses() {
    if (!statuses) {
      return <span>Loading statuses...</span>;
    } else if (statuses.length >= 2 && paymentStatusFailed.hash === undefined) {
      return (
        <a href="#status" className="btn btn-outline-success status-badge">
          Sent!
        </a>
      );
    } else if (
      statuses.length >= 2 &&
      paymentStatusSuccess.hash === undefined
    ) {
      return (
        <a href="#status" className="btn btn-outline-danger status-badge">
          payment has failed!
        </a>
      );
    }
    return (
      <a href="#status" className="btn btn-outline-warning status-badge">
        Pending
      </a>
    );
  }

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Payment!
      </h5>
      <div className="inner-container">
        <GetStatuses></GetStatuses>
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
              <code>{props.paymentRequest}</code>{" "}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={props.paymentRequest}
              >
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
              {amount}
              {typeof amount === "number" ? "" : " sat"}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={amount.toString()}
              >
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
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={hash.toString()}
              >
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">
              {paymentStatusSuccess.hash != undefined
                ? "rPreimage"
                : paymentStatusFailed != undefined
                ? "Reason for failure"
                : "Waiting for statuses"}{" "}
            </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {paymentStatusSuccess.hash != undefined
                ? paymentPreimage
                : paymentStatusFailed != undefined
                ? paymentStatusFailed.reason
                : "..."}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={
                  paymentStatusSuccess.hash != undefined
                    ? paymentPreimage
                    : paymentStatusFailed != undefined
                    ? paymentStatusFailed.reason
                    : "..."
                }
              >
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">
              {paymentStatusSuccess.hash != undefined
                ? "total fees"
                : paymentStatusFailed != undefined
                ? "rebate"
                : "Waiting for statuses"}{" "}
            </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {paymentStatusSuccess.hash != undefined
                ? paymentStatusSuccess.totalFees
                : paymentStatusFailed != undefined
                ? paymentStatusFailed.rebate
                : "..."}{" "}
              {" sat"}
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
            <div className="claimable-text-container">
              {props.created.toString()}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

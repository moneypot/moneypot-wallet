import React, { useEffect, useState } from "react";
// @ts-ignore
import { TheQr } from "@the-/ui-qr";
import { Col, Row } from "reactstrap";
import CopyToClipboard from "../util/copy-to-clipboard";
import GetLightningPaymentRequestAmount from "../util/get-lightning-payment-request-amount";
import * as mp from "moneypot-lib";
import { useClaimableStatuses, wallet } from "../state/wallet";
import { notError } from "../util";
import { getStatusesByClaimable } from "../wallet/requests";
import InvoiceSettled from "moneypot-lib/dist/status/invoice-settled";
type LightningInvoiceProps = {
  paymentRequest: string;
  memo: string;
  created: object;
  claimableHash: string;
};

// export interface InvoiceSettled {
//   kind: string;
//   hash: string;
//   claimableHash: string;
//   amount: number;
//   rPreimage: string;
//   time: Date;
// }

export default function LightningInvoice(props: LightningInvoiceProps) {
  const amount = GetLightningPaymentRequestAmount(props.paymentRequest);
  const statuses = useClaimableStatuses(props.claimableHash);

  // this is not that interesting, just placeholders. maybe we want to call the custodian for transfer hashes
  const [hasInvoiceSettled, setInvoiceSettled] = useState<InvoiceSettled>(
    Object
  );
  const [hasPreimage, setPreimage] = useState("");

  const pro = notError(mp.decodeBolt11(props.paymentRequest));
  let description;
  for (const tag of pro.tags) {
    if (tag.tagName === "description") {
      description = tag.data;
    }
  }

  // we need to build a bit of a makeshift fetching solution to continously check if the invoice has been paid and claimed. (Simply getstatuses against the custodian..)
  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses != undefined) {
        if (statuses.length > 1) {
          for (var i = statuses.length; i--; ) {
            const element = statuses[i];
            if ("rPreimage" in element) {
              setInvoiceSettled(element);
              setPreimage(mp.Buffutils.toHex(element.rPreimage));
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
    } else if (statuses.length >= 2) {
      return (
        <a href="#status" className="btn btn-outline-success status-badge">
          Received!
        </a>
      );
    } else
      return (
        <a href="#status" className="btn btn-outline-warning status-badge">
          Pending
        </a>
      );
  }

  return (
    <div>
      <h5>
        <i className="far fa-bolt" /> Lightning Invoice
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
            <p className="address-title">rPreimage:</p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="address-text-container">
              <code>{hasPreimage}</code>{" "}
              <CopyToClipboard
                className="btn btn-light"
                style={{}}
                text={hasPreimage}
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
            <p className="address-title">Memo: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{description}</div>
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

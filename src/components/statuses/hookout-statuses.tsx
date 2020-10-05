import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import { Link } from 'react-router-dom';
import {
  legacyTransactionWeight,
  wrappedTransactionWeight,
  segmultiTransactionWeight,
  templateTransactionWeight,
  legacyOutput,
  wrappedOutput,
  segmultiOutput,
  segwitOutput,
} from '../../config';
import fetchTxReceives from '../../wallet/requests/bitcoin-txs';
import { RequestError } from '../../wallet/requests/make-request';
import Failed from 'moneypot-lib/dist/status/failed';

type HookoutProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.Hookout & Partial<mp.Acknowledged.Claimable>;
};

export default function HookoutStatuses(props: HookoutProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const claimable = props.claimable.toPOD();
  const statuses = useClaimableStatuses(props.claimableHash);
  const [IsConfirmed, hasConfirmed] = useState(true); // prevent false positives when loading
  const [Memo, setMemo] = useState<undefined | string>(undefined);

  async function getConfirmationStatus(txid: string) {
    const request = await fetchTxReceives(txid);
    if (!(request instanceof RequestError)) {
      hasConfirmed(request.status.confirmed);
      setCurrentTxid(txid);
    } else if (request instanceof RequestError) {
      if (statuses && statuses.filter(status => status instanceof BitcoinTransactionSent).length === 1) {
        setCurrentTxid(txid);
      }
    }
  }

  // we calculate this each time...
  const addressType = mp.decodeBitcoinAddress(claimable.bitcoinAddress);
  if (addressType instanceof Error) {
    throw 'invalid address? Huh?';
  }

  const calcFeeRate = () => {
    if (claimable.priority === 'IMMEDIATE' || claimable.priority === 'CUSTOM') {
      switch (addressType.kind) {
        case 'p2pkh':
          return claimable.fee / legacyTransactionWeight;
        case 'p2sh':
          return claimable.fee / wrappedTransactionWeight;
        case 'p2wsh':
          return claimable.fee / segmultiTransactionWeight;
        default:
          return claimable.fee / templateTransactionWeight;
      }
    }
    if (claimable.priority === 'BATCH') {
      switch (addressType.kind) {
        case 'p2pkh':
          return claimable.fee / legacyOutput;
        case 'p2sh':
          return claimable.fee / wrappedOutput;
        case 'p2wsh':
          return claimable.fee / segmultiOutput;
        default:
          return claimable.fee / segwitOutput;
      }
    } else return 1; // free
  };

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
        for (const s of statuses) {
          if (s instanceof BitcoinTransactionSent) {
            // setCurrentTxid(mp.Buffutils.toHex(s.txid));
            getConfirmationStatus(mp.Buffutils.toHex(s.txid));
          }
        }
        if (props.claimable instanceof mp.Acknowledged.default) {
          if (!statuses.some(status => status instanceof BitcoinTransactionSent) && !statuses.some(status => status instanceof Failed)) {
            await wallet.requestStatuses(props.claimableHash);
          }
          if (!statuses.some(status => status instanceof Claimed) && props.claimable.claimableAmount != 0) {
            await wallet.claimClaimable(props.claimable);
          }
          if (statuses.some(status => status instanceof Failed)) {
            if (mp.computeClaimableRemaining(props.claimable.contents, statuses) != 0) { 
              await wallet.claimClaimable(props.claimable)
            }
          }
        } else {
          await wallet.acknowledgeClaimable(props.claimable);
        }
      }
      const memo = localStorage.getItem(claimable.hash);
      if (memo != undefined) {
        setMemo(memo);
      }
    };
    getData();
  }, [statuses]); // this usually triggers double requests w/ new transfers, but we cannot render upon loading.

  const GetStatuses = () => {
    if (!statuses && props.claimable.contents != undefined && props.claimable.contents.claimableAmount != 0) {
      return <span> Loading Statuses...</span>;
    }
    if (statuses) {
      if (props.claimable instanceof mp.Acknowledged.default) {
        if (statuses.some(status => status instanceof BitcoinTransactionSent)) {
          if (statuses.some(status => status instanceof Claimed) || (props.claimable.contents != undefined && props.claimable.contents.claimableAmount === 0)) {
            return (
              <a href="#status" className="btn btn-outline-success status-badge">
                Transaction sent!
              </a>
            );
          }
        }
        if (statuses.some(status => status instanceof Failed)) {
          return (
            <a href="#status" className="btn btn-outline-danger status-badge">
              Hookout failed!
            </a>
          );
        }
        if (!statuses.some(status => status instanceof Claimed) && props.claimable.contents.claimableAmount != 0) {
          return (
            <a href="#status" className="btn btn-outline-info status-badge">
              Hookout remainder not yet claimed!
            </a>
          );
        } else {
          return (
            <a href="#status" className="btn btn-outline-info status-badge">
              Hookout is in queue! (PENDING!)
            </a>
          );
        }
      } else {
        return (
          <a href="#status" className="btn btn-outline-info status-badge">
            Custodian is not yet aware of the Hookout!
          </a>
        );
      }
    }

    return <span>Loading Statuses...</span>;
  };

  return (
    <div>
      <h5>
        <i className="fad fa-arrow-from-bottom" /> Hookout
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
              {
                <CopyToClipboard className="btn btn-light" style={{}} text={claimable.bitcoinAddress}>
                  <i className="fa fa-copy" />
                </CopyToClipboard>
              }
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Transaction ID: </p>
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
              {/* <CopyToClipboard className="btn btn-light" style={{}} text={claimable.amount.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Fee: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              {`${claimable.fee} sat` + ' || ' + ` (${(calcFeeRate() * 4).toFixed(2)} sat/vB)`}

              {/* <CopyToClipboard className="btn btn-light" style={{}} text={claimable.fee.toString()}>
                <i className="fa fa-copy" />
              </CopyToClipboard> */}
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Priority: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{claimable.priority}</div>
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
        {IsConfirmed === false && (
          <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
            <button className="btn btn-secondary">Feebump this transaction!</button>
          </Link>
        )}
      </div>
    </div>
  );
}

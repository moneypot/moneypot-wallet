import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import { Link } from 'react-router-dom';
import fetchTxReceives from '../../wallet/requests/bitcoin-txs';
import { RequestError } from '../../wallet/requests/make-request';
import Failed from 'moneypot-lib/dist/status/failed';
import { ToastContainer } from 'react-toastify';

type FeeBumpProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.FeeBump & Partial<mp.Acknowledged.Claimable>;
};

let blockD: string = '';

export default function FeeBumpStatuses(props: FeeBumpProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const claimable = props.claimable.toPOD();
  const statuses = useClaimableStatuses(props.claimableHash);
  const [IsConfirmed, hasConfirmed] = useState(true); // prevent false positives when loading
  const [Loading, setLoading] = useState<boolean>(false);

  if (!Loading) {
    blockD = '';
  }

  async function getConfirmationStatus(txid: string) {
    const request = await fetchTxReceives(txid);
    if (!(request instanceof RequestError)) {
      hasConfirmed(request.status.confirmed);
      setCurrentTxid(txid);
    } else if (request instanceof RequestError) {
      if (statuses && statuses.filter((status) => status instanceof BitcoinTransactionSent).length === 1) {
        setCurrentTxid(txid);
      }
    }
  }

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
        // TODO: do we want to refilter all this fetching stuff?
        for (const s of statuses) {
          if (s instanceof BitcoinTransactionSent) {
            // setCurrentTxid(mp.Buffutils.toHex(s.txid));
            const txid = mp.Buffutils.toHex(s.txid);
            if (!(blockD === txid)) {
              blockD = txid;
              await getConfirmationStatus(txid);
            }
          }
        }

        if (props.claimable instanceof mp.Acknowledged.default) {
          if (!statuses.some((status) => status instanceof BitcoinTransactionSent) && !statuses.some((status) => status instanceof Failed)) {
            if (!Loading) {
              setLoading(!Loading);
              await wallet.requestStatuses(props.claimableHash);
            }
          }
          if (!statuses.some((status) => status instanceof Claimed) && props.claimable.claimableAmount != 0) {
            await wallet.claimClaimable(props.claimable);
          }
          if (statuses.some((status) => status instanceof Failed)) {
            if (mp.computeClaimableRemaining(props.claimable.contents, statuses) != 0) {
              await wallet.claimClaimable(props.claimable);
            }
          }
        } else {
          // wallet.acknowledgeClaimable(props.claimable);
        }
      }
    };
    getData();
  }, [statuses]);

  const GetStatuses = () => {
    if (!statuses && props.claimable.contents != undefined && props.claimable.contents.claimableAmount != 0) {
      return <span> Loading Statuses...</span>;
    }
    if (statuses) {
      if (props.claimable instanceof mp.Acknowledged.default) {
        if (statuses.some((status) => status instanceof BitcoinTransactionSent)) {
          if (
            statuses.some((status) => status instanceof Claimed) ||
            (props.claimable.contents != undefined && props.claimable.contents.claimableAmount === 0)
          ) {
            return (
              <a href="#status" className="btn btn-outline-success status-badge">
                Feebump sent!
              </a>
            );
          }
        }
        if (statuses.some((status) => status instanceof Failed)) {
          return (
            <a href="#status" className="btn btn-outline-danger status-badge">
              Feebump failed!
            </a>
          );
        }
        if (!statuses.some((status) => status instanceof Claimed) && props.claimable.contents.claimableAmount != 0) {
          return (
            <a href="#status" className="btn btn-outline-primary status-badge">
              Feebump remainder not yet claimed!
            </a>
          );
        } else {
          return (
            <a href="#status" className="btn btn-outline-primary status-badge">
              Feebump is in queue!
            </a>
          );
        }
      } else {
        return (
          <a href="#status" className="btn btn-outline-primary status-badge">
            Custodian is not yet aware of the Feebump! You can discard it and resync to get your funds back!
          </a>
        );
      }
    }
    return <span>Loading Statuses...</span>;
  };

  const txid = wallet.config.custodian.currency === 'tBTC' ? `https://blockstream.info/testnet/tx/${CurrentTxid}` : `https://blockstream.info/tx/${CurrentTxid}`

  return (
    <div>
      <ToastContainer />
      <h5>
        <i className="fad fa-history" /> feebump
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <br /> &nbsp;
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Original transaction ID: </p>
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
            <p className="address-title">New transaction ID: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">
              <a href={txid} target="_blank" rel="noreferrer">
                {' '}
                {CurrentTxid}
              </a>
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
            <p className="address-title">Created: </p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="claimable-text-container">{props.created.toString()}</div>
          </Col>
        </Row>
        {!IsConfirmed ? (
          <Link to={{ pathname: '/feebump-send', state: { txid: { CurrentTxid } } }}>
            <button className="btn btn-secondary">Feebump this transaction!</button>
          </Link>
        ) : undefined}
      </div>
    </div>
  );
}

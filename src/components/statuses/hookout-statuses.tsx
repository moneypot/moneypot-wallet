import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Col, Row } from 'reactstrap';
import CopyToClipboard from '../../util/copy-to-clipboard';
import * as mp from 'moneypot-lib';
import { useClaimableStatuses, wallet } from '../../state/wallet';
import Claimed from 'moneypot-lib/dist/status/claimed';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';
import { Link } from 'react-router-dom';
import * as config from '../../config';
import fetchTxReceives from '../../wallet/requests/bitcoin-txs';
import { RequestError } from '../../wallet/requests/make-request';
import Failed from 'moneypot-lib/dist/status/failed';
import { ToastContainer } from 'react-toastify';

type HookoutProps = {
  created: Date;
  claimableHash: string;
  claimable: mp.Hookout & Partial<mp.Acknowledged.Claimable>;
};

let blockD: string = '';

export default function HookoutStatuses(props: HookoutProps) {
  const [CurrentTxid, setCurrentTxid] = useState('');
  const claimable = props.claimable.toPOD();
  const statuses = useClaimableStatuses(props.claimableHash);
  const [IsConfirmed, hasConfirmed] = useState(true); // prevent false positives when loading
  const [Memo, setMemo] = useState<undefined | string>(undefined);
  const [Loading, setLoading] = useState<boolean>(false);

  if (!Loading) {
    blockD = '';
  }

  // TODO improve this for when there are feebumps?!
  async function getConfirmationStatus(txid: string) {
    const request = await fetchTxReceives(txid);
    let nRBF: boolean = false;
    if (!(request instanceof RequestError)) {
      for (let index = 0; index < request.vin.length; index++) {
        const sequence = request.vin[index];
        // needs to be lower than 0xfffffffe
        if (!(sequence.sequence < parseInt('0xfffffffe', 16))) {
          nRBF = true;
        }
      }
      hasConfirmed(nRBF ? true : request.status.confirmed);
      setCurrentTxid(txid);
    } else if (request instanceof RequestError) {
      if (statuses && statuses.filter((status) => status instanceof BitcoinTransactionSent).length === 1) {
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
          return claimable.fee / config.p2pkhTransactionWeight;
        case 'p2sh':
          return claimable.fee / config.p2shp2wpkhTransactionWeight;
        case 'p2wsh':
          return claimable.fee / config.p2wshTransactionWeight;
        case 'p2tr':
          return claimable.fee / config.p2trTransactionWeight;  
        case 'p2wpkh':
          return claimable.fee / config.p2wpkhTransactionWeight;
      }
    }
    if (claimable.priority === 'BATCH') {
      switch (addressType.kind) {
        case 'p2pkh':
          return claimable.fee / config.p2pkh;
        case 'p2sh':
          return claimable.fee / config.p2shp2wpkh;
        case 'p2wsh':
          return claimable.fee / config.p2wsh;
        case 'p2tr':
          return claimable.fee / config.p2tr;  
        case 'p2wpkh':
          return claimable.fee / config.p2wpkh;
      }
    } else return 0.25; // free
  };

  useEffect(() => {
    const getData = async (): Promise<void> => {
      if (statuses) {
        // TODO: this requests twice on new hookouts. refactor //
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
          // await wallet.acknowledgeClaimable(props.claimable);
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
        if (statuses.some((status) => status instanceof BitcoinTransactionSent)) {
          if (
            statuses.some((status) => status instanceof Claimed) ||
            (props.claimable.contents != undefined && props.claimable.contents.claimableAmount === 0)
          ) {
            return (
              <a href="#status" className="btn btn-outline-success status-badge">
                Transaction sent!
              </a>
            );
          }
        }
        if (statuses.some((status) => status instanceof Failed)) {
          return (
            <a href="#status" className="btn btn-outline-danger status-badge">
              Hookout failed!
            </a>
          );
        }
        if (!statuses.some((status) => status instanceof Claimed) && props.claimable.contents.claimableAmount != 0) {
          return (
            <a href="#status" className="btn btn-outline-primary status-badge">
              Hookout remainder not yet claimed!
            </a>
          );
        } else {
          return (
            <a href="#status" className="btn btn-outline-primary btn-color-primary status-badge">
              Hookout is in queue!
            </a>
          );
        }
      } else {
        return (
          <a href="#status" className="btn btn-outline-primary status-badge">
            Custodian is not yet aware of the Hookout/ It was not accepted! You can discard it and resync to get your funds back!
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
        <i className="fad fa-arrow-from-bottom" /> Hookout
      </h5>
      <div className="inner-container">
        <GetStatuses />
        <br /> &nbsp;
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
        {Memo != undefined ? (
          <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">Memo: </p>
            </Col>
            <Col sm={{ size: 8, offset: 0 }}>
              <div className="claimable-text-container">{Memo}</div>
            </Col>
          </Row>
        ) : undefined}
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

import React from 'react';
// @ts-ignore
import { TheQr } from '@the-/ui-qr';
import { Button, Row, Col, UncontrolledCollapse, InputGroup, Input } from 'reactstrap';
import * as Docs from '../../wallet/docs';
import { wallet, useUnusedBitcoinAddress } from '../../state/wallet';
import CopyToClipboard from '../../util/copy-to-clipboard';
import { toast, ToastContainer } from 'react-toastify';

function show(addressDoc: Docs.BitcoinAddress) {
  let memo: string | undefined;
  const fetchedMemo = localStorage.getItem(addressDoc.address);
  if (fetchedMemo) {
    memo = fetchedMemo;
  }
  function PushMemo(memo: string | undefined) {
    if (memo) {
      localStorage.setItem(addressDoc.address, memo);
      toast.success("Memo saved!")
    }
  }

  return (
    <div>
      <ToastContainer />
      <h5 className="main-header">Receive</h5>
      <div className="inner-container">
        <div className="qr-code-wrapper">
          <div className="qr-code-container">
            <span>
              <TheQr text={addressDoc.address.toUpperCase()} />
            </span>
          </div>
        </div>
        <Row>
          <Col sm={{ size: 2, offset: 0 }}>
            <p className="address-title">Address:</p>
          </Col>
          <Col sm={{ size: 8, offset: 0 }}>
            <div className="address-text-container">
              <code>{addressDoc.address}</code>{' '}
              <CopyToClipboard className="btn btn-light" style={{}} text={addressDoc.address}>
                <i className="fa fa-copy" />
              </CopyToClipboard>
            </div>
          </Col>
        </Row>
        <div className="text-container">
          <p className="text-muted">
            <span>
              <i className="fa fa-info-circle" />{' '}
            </span>
            After N confirmations, funds will be usable.
          </p>
        </div>
        <Button color="secondary" onClick={() => wallet.checkBitcoinAddress(addressDoc)}>
          Check
        </Button>{' '}
        <Button color="secondary" id="addMemo">
          Add local memo
        </Button>
        <UncontrolledCollapse toggler="addMemo">
          <br />
          <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">Add local memo to deposit address:</p>
            </Col>

            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input
                  defaultValue={memo}
                  onChange={e => {
                    memo = e.target.value;
                  }}
                  type="text"
                  className="to-text-input"
                />
              </InputGroup>
              <br />
              <Button color="primary" onClick={() => PushMemo(memo)}>
                Save!
              </Button>
            </Col>
          </Row>
        </UncontrolledCollapse>
      </div>
    </div>
  );
}

export default function Receive() {
  const address = useUnusedBitcoinAddress();

  if (address === undefined) {
    return <p>Loading...</p>;
  }

  return show(address);
}

import * as hi from 'hookedin-lib';
import React, { useState } from 'react';

import { wallet } from '../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup, CustomInput } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import './send.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [speedSelection, setSpeedSelection] = useState('fast');
  const [feeText, setFeeText] = useState('');
  const [noteText, setNoteText] = useState<string | undefined>(undefined);

  const send = async () => {
    const address = toText;
    // TODO: proper validation...
    if (address.length < 5 || address.length > 100) {
      toast.error('Oops! invalid address');
      return;
    }

    const isBitcoinSend =
      address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('2') || address.startsWith('3');

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Oops! invalid amount');
      return;
    }

    let transferHash: 'NOT_ENOUGH_FUNDS' | hi.Hash;

    if (isBitcoinSend) {
      const feeRate = 0.25;

      transferHash = await wallet.sendToBitcoinAddress(address, amount, feeRate);
    } else {
      const to = hi.Address.fromPOD(address);
      if (to instanceof Error) {
        console.warn('could not parse address, got: ', to);
        toast.error('Oops! invalid direct address');
        return;
      }
      // TODO: make sure sending to same custodian, lolz

      transferHash = await wallet.sendDirect(to, amount);
    }

    if (transferHash === 'NOT_ENOUGH_FUNDS') {
      toast.error('Oops! not enough funds');
      return;
    }

    history.push(`/transfers/${transferHash.toPOD()}`);
  };

  const setMaxAmount = async () => {
    toast('Max amount selected');
    // TODO
  };

  function ShowCustomFeeInput() {
    return (
      <FormGroup row>
        <Label for="feeText" sm={3}>
          Fee:
        </Label>
        <Col sm={{ size: 9, offset: 0 }}>
          <InputGroup>
            <Input value={feeText} onChange={event => setFeeText(event.target.value)} />
            <InputGroupAddon addonType="append">satoshi</InputGroupAddon>
          </InputGroup>
        </Col>
      </FormGroup>
    );
  }

  function ShowNoteInput() {
    if (noteText === undefined) {
      return;
    }
    return (
      <FormGroup row>
        <Col sm={{ size: 12, offset: 0 }}>
          <Input type="text" value={noteText} placeholder="Optional text" onChange={event => setNoteText(event.target.value)} />
        </Col>
      </FormGroup>
    );
  }

  function handleSpeedSelectionChange(e: any) {
    setSpeedSelection(e.target.value);
  }

  function handleNoteSelected() {
    setNoteText(noteText === undefined ? '' : undefined);
  }

  return (
    <div>
      <ToastContainer />
      <h3>Send</h3>
      <div className="inner-container" style={{ padding: '5rem 20vw' }}>
        <Form>
          <FormGroup row>
            <Label for="toText" sm={3}>
              To:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <Input value={toText} onChange={event => setToText(event.target.value)} placeholder="bitcoin address (or direct address)" type="text" required />
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="amountText" sm={3}>
              Amount:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={amountText} onChange={event => setAmountText(event.target.value)} />
                <InputGroupAddon addonType="append">satoshi</InputGroupAddon>
                <InputGroupAddon addonType="append">
                  <Button color="danger" onClick={setMaxAmount}>
                    max
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Col>
          </FormGroup>
          <div className="fee-fields-wrapper">
            <FormGroup row>
              <Label for="speedSelection" sm={4}>
                Speed:
              </Label>
              <Col sm={{ size: 12, offset: 0 }}>
                <FormGroup
                  row
                  style={{
                    justifyContent: 'center',
                  }}
                >
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="speedSelection" value="fast" defaultChecked onChange={handleSpeedSelectionChange} /> Fast
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="speedSelection" value="medium" onChange={handleSpeedSelectionChange} /> Medium
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="speedSelection" value="slow" onChange={handleSpeedSelectionChange} /> Slow
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="speedSelection" value="custom" onChange={handleSpeedSelectionChange} /> Custom
                    </Label>
                  </FormGroup>
                </FormGroup>
              </Col>
            </FormGroup>
            {speedSelection === 'custom' ? ShowCustomFeeInput() : <ShowFeeText />}
            <small className="text-muted">This transaction will be sent with 324 sat/byte and a ETA of 3 blocks (30 mins).</small>
          </div>
          <FormGroup row>
            <Button color="light" onClick={handleNoteSelected}>
              <FontAwesomeIcon icon="edit" />
              Add Optional Note
            </Button>
          </FormGroup>
          {ShowNoteInput()}
          <FormGroup row>
            <Col className="submit-button-container">
              <Button color="success" className="btn-hookedin" onClick={send}>
                Send
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    </div>
  );
}

function ShowFeeText() {
  return (
    <Row>
      <Col sm={3}>Fee:</Col>
      <Col sm={{ size: 9, offset: 0 }}>
        <p style={{ fontWeight: 'bold' }}>1078 satoshi</p>
      </Col>
    </Row>
  );
}

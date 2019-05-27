import React, { useState } from 'react';

import { wallet } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import ShowCustomFeeInput from './custom-fee';
type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [speedSelection, setSpeedSelection] = useState('fast');
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

    if (!isBitcoinSend) {
      toast.error('Oops! not a bitcoin address');
      return;
    }

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Oops! invalid amount');
      return;
    }

    const feeRate = 0.25;

    const transferHash = await wallet.sendToBitcoinAddress(address, amount, feeRate);

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
      <div className="inner-container">
        <Form>
          <FormGroup row>
            <Label for="toText" sm={3}>
              To:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <Input value={toText} onChange={event => setToText(event.target.value)} placeholder="bitcoin address" type="text" required />
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
                <Button className="max-button" color="danger" onClick={setMaxAmount}>
                  max
                </Button>
              </InputGroup>
            </Col>
          </FormGroup>

          <div className="send-radio-buttons-container">
            <input type="radio" id="radioFast" name="speedSelection" value="fast" defaultChecked onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioFast">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Fast </h5>
              <i className="fal fa-rabbit-fast fa-2x" />
              <ul>
                <li>priority</li>
              </ul>
              <span>
                <i className="fab fa-btc" />
                <i className="fab fa-btc" />
                <i className="fab fa-btc" />
              </span>
            </label>
            <input type="radio" id="radioSlow" name="speedSelection" value="slow" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioSlow">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Slow </h5>
              <i className="fal fa-turtle fa-2x" />
              <ul>
                <li>economical</li>
              </ul>
              <span>
                <i className="fab fa-btc" />
                <i className="fab fa-btc" style={{ color: '#ced4da' }} />
                <i className="fab fa-btc" style={{ color: '#ced4da' }} />
              </span>
            </label>
            <input type="radio" id="radioCustom" name="speedSelection" value="custom" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioCustom">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Custom </h5>
              <i className="fal fa-edit fa-2x" />
              <ul>
                <li>choose your fee</li>
              </ul>
            </label>
          </div>

          <div className="fee-wrapper">
            {speedSelection === 'custom' ? <ShowCustomFeeInput /> : <ShowFeeText />}
            <small className="text-muted">This transaction will be sent with 324 sat/byte and a ETA of 3 blocks (30 mins).</small>
          </div>
          <FormGroup row>
            <Button color="light" onClick={handleNoteSelected}>
              <i className="fa fa-edit" />
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

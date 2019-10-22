import React, { useState } from 'react';
import * as hi from 'hookedin-lib';

import { wallet } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import BitcoinUnitSwitch from './bitcoin-unit-switch';
import OptionalNote from '../optional-note';
import SubNavbar from './sub-navbar';

type Props = { history: { push: (path: string) => void } };

export default function SendLightning({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');

  const send = async () => {
    const address = toText;
    // TODO: proper validation...
    if (!address.startsWith('ln')) {
      toast.error('Oops! invalid payment request');
      return;
    }

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Oops! invalid amount');
      return;
    }

    const feeLimit = 100; // todo...
    // const payment = new hi.LightningPayment(toText, amount, feeLimit);

    const transferHash = await wallet.sendLightningPayment(address, amount, feeLimit);
    if (transferHash === 'NOT_ENOUGH_FUNDS') {
      toast.error('Oops! not enough funds');
      return;
    }

    history.push(`/claimables/${transferHash.toPOD()}`);
  };

  const setMaxAmount = async () => {
    toast('Max amount selected');
    // TODO
  };

  function calcFee(): number {
    return 100;
  }

  return (
    <div>
      <ToastContainer />
      <h5>Send</h5>
      <SubNavbar />
      <div className="inner-container">
        <Form>
          <FormGroup row>
            <Label for="toText" sm={3}>
              To:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input
                  value={toText}
                  onChange={event => setToText(event.target.value)}
                  placeholder="payment request"
                  type="text"
                  className="to-text-input"
                  required
                />
                <Button className="scan-button" color="light">
                  <i className="far fa-camera-alt" />
                </Button>
              </InputGroup>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="amountText" sm={3}>
              Amount:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={amountText} onChange={event => setAmountText(event.target.value)} />
                <BitcoinUnitSwitch name="unit" valueOne="btc" valueTwo="sat" />
                <Button className="max-button" color="danger" onClick={setMaxAmount}>
                  max
                </Button>
              </InputGroup>
            </Col>
          </FormGroup>
          <OptionalNote />
          <FormGroup row>
            <Col className="submit-button-container">
              <Button color="success" className="btn-moneypot" onClick={send}>
                Send
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    </div>
  );
}

import * as hi from 'hookedin-lib';
import React, { useState } from 'react';

import { wallet } from '../state/wallet';
import { Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [feeText, setFeeText] = useState('');


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
    toast('max amount selected');
    // TODO
  }
  return (
    <div>
      <ToastContainer />
      <h3>Send Bitcoin</h3>
      <div className="inner-container" style={{ padding: '5rem 20vw' }}>
        <Form>
          <FormGroup row>
            <Label for="toText" sm={4}>
              To:
            </Label>
            <Col sm={{ size: 8, offset: 0 }}>
              <Input value={toText} onChange={event => setToText(event.target.value)} placeholder="bitcoin address (or direct address)" type="text" required />
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="amountText" sm={4}>
              Amount (sat):
            </Label>
            <Col sm={{ size: 8, offset: 0 }}>
              <InputGroup>
              <Input value={amountText} onChange={event => setAmountText(event.target.value)} />
              <InputGroupAddon addonType="append">
                <Button color="info"
                        onClick={setMaxAmount}
                >max</Button>
              </InputGroupAddon>
              </InputGroup>
            </Col>

          </FormGroup>

          <FormGroup row>
            <Label for="feeText" sm={4}>
              Fee (sat):
            </Label>
            <Col sm={{ size: 8, offset: 0 }}>
              <InputGroup>
                <Input value={feeText} onChange={event => setFeeText(event.target.value)} />
                <Button>fast</Button>
                <Button>medium</Button>
                <Button>slow</Button>
              </InputGroup>
            </Col>

          </FormGroup>
          <small className="text-muted">This transaction will be sent with 324 sat/byte and a ETA of 3 blocks (30 mins).</small>

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

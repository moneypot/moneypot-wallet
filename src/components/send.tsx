import * as hi from 'hookedin-lib';
import React, { useState } from 'react';

import { wallet } from '../state/wallet';
import { Button, Form, FormGroup, Label, Input, Col } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | undefined>();

  const send = async () => {
    const address = toText;
    // TODO: proper validation...
    if (address.length < 5 || address.length > 100) {
      setError('invalid address');
      toast.error('Oops! ' + error);
      return;
    }

    const isBitcoinSend =
      address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('2') || address.startsWith('3');

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('invalid amount');
      toast.error('Oops! ' + error);
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
        setError('invalid direct address');
        toast.error('Oops! ' + error);
        return;
      }
      // TODO: make sure sending to same custodian, lolz

      transferHash = await wallet.sendDirect(to, amount);
    }

    if (transferHash === 'NOT_ENOUGH_FUNDS') {
      setError('not enough funds');
      toast.error('Oops! ' + error);
      return;
    }

    history.push(`/transfers/${transferHash.toPOD()}`);
  };

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
              <Input value={amountText} name="custodianUrl" onChange={event => setAmountText(event.target.value)} />
            </Col>
          </FormGroup>
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

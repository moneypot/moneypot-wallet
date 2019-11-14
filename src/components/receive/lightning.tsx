import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import SubNavbar from './sub-navbar';

import { wallet } from '../../state/wallet';
import { Button, Col, Form, FormGroup, Input, InputGroup, Label } from 'reactstrap';
import BitcoinAmountInput from '../bitcoin-amount-input';

export default function ReceiveLightning(props: RouteComponentProps) {
  const [memo, setMemo] = useState('deposit');
  const [amount, setAmount] = useState(0);


  async function genInvoice() {
    const amountInt = amount;
    if (!Number.isFinite(amountInt) || amountInt < 0) {
      console.warn('amount must be an integer >= 0');
      return;
    }

    const res = await wallet.requestLightningInvoice(memo, amountInt);

    props.history.push(`/claimables/${res.hash}`, res);
  }

  return (
    <div>
      <h5>Receive</h5>
      <SubNavbar />
      <div className="inner-container">
        <Form>
          <h6 style={{ marginBottom: '2rem' }}>Generate Lightning Invoice</h6>
          <FormGroup row>
            <Label for="memo" sm={3}>
              Memo:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={memo} onChange={e => setMemo(e.target.value)} type="text" className="to-text-input" />
              </InputGroup>
            </Col>
          </FormGroup>
          <FormGroup row>
      <Label for="amount" sm={3}>
        Amount:
      </Label>
      <Col sm={{ size: 9, offset: 0 }}>
      <InputGroup>
        <BitcoinAmountInput  onAmountChange={setAmount} />
      </InputGroup>
      </Col>
    </FormGroup>         
          <FormGroup row>
            <Col className="submit-button-container">
              <Button color="success" className="btn-moneypot" onClick={() => genInvoice()}>
                Generate
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    </div>
  );
}

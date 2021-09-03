import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';

import { wallet } from '../../state/wallet';
import { Button, Col, Form, FormGroup, Input, InputGroup, Label } from 'reactstrap';
import BitcoinAmountInput from '../../util/bitcoin-amount-input';
import * as Docs from '../../wallet/docs';

export default function ReceiveLightning(props: RouteComponentProps) {
  const [memo, setMemo] = useState('deposit');
  const [amount, setAmount] = useState(0);
  const [lightninginfo, setlightninginfo] = useState<Docs.LND | null>(null);
  useEffect(() => {
    const getCapabilities = async () => {
      setlightninginfo(await wallet.requestLightningInfo());
    };
    getCapabilities();
  }, []);

  async function genInvoice() {
    const amountInt = amount;
    if (amount)
      if (!Number.isFinite(amountInt) || amountInt < 0) {
        console.warn('amount must be an integer >= 0');
        return;
      }
    const res = await wallet.requestLightningInvoice(memo, amountInt);

    props.history.push(`/claimables/${res.hash}`, res);
  }

  return (
    <div>
      <h5 className="main-header">Receive</h5>
      <div className="inner-container">
        <Form>
          <h6 style={{ marginBottom: '2rem' }}>Generate Lightning Invoice</h6>
          <FormGroup row>
            <Label for="memo" sm={3}>
              Memo:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={memo} onChange={(e) => setMemo(e.target.value)} type="text" className="to-text-input" />
              </InputGroup>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="amount" sm={3}>
              Amount:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <BitcoinAmountInput onAmountChange={setAmount} />
              </InputGroup>
            </Col>
          </FormGroup>
          {lightninginfo && amount > lightninginfo.remote_balance ? ( // Multi path payments is a thing? ()
            <code>
              Even if we were using the most optimal route, our node still does not have enough capacity to handle an invoice of such amount, so you can only
              use this invoice for internal transfers!
            </code>
          ) : undefined}
                  {wallet.config.custodian.wipeDate  && (new Date(wallet.config.custodian.wipeDate) < new Date(Date.now() + 48*60*60*1000)) && (
                <div className="text-container">
                <p >
                  <span>
                  <i className="fad fa-exclamation-triangle" />{' '}
                  </span>
                  The custodian will wipe in less than two days or has already wiped. Please do not deposit any more funds!
                </p>
              </div>
        )  }
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

import React, { useState, useEffect } from 'react';
import * as hi from 'hookedin-lib';

import { wallet } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import ShowCustomFeeInput from './custom-fee';
import BitcoinUnitSwitch from './bitcoin-unit-switch';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import OptionalNote from '../optional-note';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const feeSchedule = useFeeSchedule();
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');

  const send = async () => {
    const address = toText;
    // TODO: proper validation...
    if (address.length < 5) {
      toast.error('Oops! invalid address');
      return;
    }

    const isBitcoinSend =
      address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('2') || address.startsWith('3');

    if (!isBitcoinSend && !address.startsWith('ln')) {
      toast.error('Oops! not a bitcoin address, nor a lightning payment request');
      return;
    }

    const amount = Number.parseInt(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Oops! invalid amount');
      return;
    }

    const transferHash = await wallet.sendHookout(address, amount, calcFee()); // TODO: add prioritySelection
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
    if (!feeSchedule) {
      return 0;
    }

    if (prioritySelection === 'IMMEDIATE') {
      return feeSchedule.immediate;
    }
    if (prioritySelection === 'BATCH') {
      return feeSchedule.batch;
    }
    if (prioritySelection === 'CUSTOM') {
      return -1; // TODO:  what ever they Math.round(picked  * hi.Params.templateTransactionWeight)
    }
    if (prioritySelection == 'FREE') {
      return 0;
    }

    throw new Error('unknown priority selection: ' + prioritySelection);
  }

  function ShowFeeText() {
    return (
      <div>
        <Row>
          <Col sm={{ size: 1, offset: 0 }}>
            <p>Fee:</p>
          </Col>
          <Col sm={{ size: 9, offset: 0 }}>
            <p style={{ fontWeight: 'bold' }}>{ (calcFee()/1e8).toFixed(8)  } btc</p>
          </Col>
        </Row>
        <Row style={{ justifyContent: 'center' }}>
    { feeSchedule && <small className="text-muted">This transaction will be sent with { feeSchedule.immediateFeeRate } sat/vbyte</small> }
        </Row>
      </div>
    );
  }

  function handleSpeedSelectionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value as 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE';
    setPrioritySelection(v);
  }

  return (
    <div>
      <ToastContainer />
      <h5>Send</h5>
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
                  placeholder="bitcoin address"
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
          <FormGroup row>
            <Label for="amountText" sm={3}>
              Type of Fee:
            </Label>
          </FormGroup>
          <div className="send-radio-buttons-container">
            <input type="radio" id="radioImmediate" name="speedSelection" value="IMMEDIATE" defaultChecked onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioImmediate">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Immediate </h5>
              <i className="fal fa-dragon fa-2x" />
              <p>time waits for no one</p>
            </label>
            <input type="radio" id="radioBatched" name="speedSelection" value="BATCH" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioBatched">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Batched </h5>
              <i className="fal fa-alicorn fa-2x" />
              <p>economical</p>
              <p>fast ~1 hr </p>
            </label>
            <input type="radio" id="radioFree" name="speedSelection" value="FREE" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioFree">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Free </h5>
              <i className="fal fa-unicorn fa-2x" />
              <p>Minimum 0.01 btc</p>
              <p>slow ~ 1 week</p>
            </label>
            <input type="radio" id="radioCustom" name="speedSelection" value="CUSTOM" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioCustom">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Custom </h5>
              <i className="fal fa-wand-magic fa-2x" />
              <p>choose your fee</p>
            </label>
          </div>

          <div className="fee-wrapper">{prioritySelection === 'CUSTOM' ? <ShowCustomFeeInput /> : <ShowFeeText />}</div>
          <OptionalNote />
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

function useFeeSchedule() {
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleResult | undefined>(undefined);

  useEffect(() => {
    getFeeSchedule(wallet.config).then(setFeeSchedule);
  }, []);

  return feeSchedule;
}

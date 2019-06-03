import React, { useState, useEffect } from 'react';
import * as hi from 'hookedin-lib';

import { wallet } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import ShowCustomFeeInput from './custom-fee';
import BitcoinUnitSwitch from './bitcoin-unit-switch';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const feeSchedule = useFeeSchedule();
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');
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

    const transferHash = await wallet.sendToBitcoinAddress(address, amount, prioritySelection, calcFee());

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

  function calcFee(): number {
    if (!feeSchedule) {
      return 0;
    } 

    if (prioritySelection === 'IMMEDIATE') {
      return Math.round(feeSchedule.immediateFeeRate * hi.Params.templateTransactionWeight);
    }
    if (prioritySelection === 'BATCH') {
      return Math.round(feeSchedule.immediateFeeRate * 32);
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
      <Row>
        <Col sm={3}>Fee:</Col>
        <Col sm={{ size: 9, offset: 0 }}>
          <p style={{ fontWeight: 'bold' }}>{ calcFee() } satoshis</p>
        </Col>
        <small className="text-muted">This transaction will be sent with ??? sat/byte and a ETA of ? blocks (?0 mins).</small>
      </Row>
    );
  }

  function handleSpeedSelectionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value as 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE';
    setPrioritySelection(v);
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
                <BitcoinUnitSwitch name="unit" valueOne="btc" valueTwo="sat"/>
                <Button className="max-button" color="danger" onClick={setMaxAmount}>
                  max
                </Button>
              </InputGroup>
            </Col>
          </FormGroup>

          <div className="send-radio-buttons-container">
            <input type="radio" id="radioImmediate" name="speedSelection" value="IMMEDIATE" defaultChecked onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioImmediate">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Immediate </h5>
              <i className="fal fa-rabbit-immediate fa-2x" />
              <ul>
                <li>priority</li>
                <li>transaction sent immediately</li>
                <li>we will increase the fee as needed</li>
                { feeSchedule && <li>{ Math.round(feeSchedule.immediateFeeRate * hi.Params.templateTransactionWeight) } sats</li> }
              </ul>
              <span>
                <i className="fab fa-btc" />
                <i className="fab fa-btc" />
                <i className="fab fa-btc" />
              </span>
            </label>
            <input type="radio" id="radioBatched" name="speedSelection" value="BATCH" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioBatched">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Batched </h5>
              <i className="fal fa-abacus fa-2x" />
              <ul>
                <li>economical</li>
                <li>~1 hr </li>
                { feeSchedule && <li>{ Math.round(feeSchedule.immediateFeeRate * 32) } sats</li> }
              </ul>
              <span>
                <i className="fab fa-btc" />
                <i className="fab fa-btc" style={{ color: '#ced4da' }} />
                <i className="fab fa-btc" style={{ color: '#ced4da' }} />
              </span>
            </label>
            <input type="radio" id="radioFree" name="speedSelection" value="FREE" onChange={handleSpeedSelectionChange} />
            <label htmlFor="radioFree">
              <i className="fa fa-check-circle fa-2x checked-icon" />
              <h5>Free </h5>
              <i className="fal fa-turtle fa-2x" />
              <ul>
                <li>Minimum 0.01 btc</li>
                <li>slow ~ 1 week</li>
              </ul>
            </label>
            <input type="radio" id="radioCustom" name="speedSelection" value="CUSTOM" onChange={handleSpeedSelectionChange} />
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
            {prioritySelection === 'CUSTOM' ? <ShowCustomFeeInput /> : <ShowFeeText />}
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




function useFeeSchedule() {
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleResult | undefined>(undefined);

  useEffect(() => {
    getFeeSchedule(wallet.config).then(setFeeSchedule);
  }, []);


  return feeSchedule;
}
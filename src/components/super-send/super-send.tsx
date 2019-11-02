import React, { useState, useEffect } from 'react';
import * as hi from 'hookedin-lib';

import { wallet } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import BitcoinUnitSwitch from './bitcoin-unit-switch';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import OptionalNote from '../optional-note';
import QrScanner from './qr-scanner';
import FeeOptionIcon from './fee-option-icon';

type Props = { history: { push: (path: string) => void } };
export default function SuperSend({ history }: Props) {
  const feeSchedule = useFeeSchedule();
  const [toText, setToText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');
  const [feeText, setFeeText] = useState('');
  const [feeLimit, setFeeLimit] = useState('100');

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'lightning'; amount: number } | { kind: 'bitcoin' } => {
    if (toText === '') {
      return { kind: 'empty' };
    }

    let decodedBolt11 = hi.decodeBolt11(toText);
    if (!(decodedBolt11 instanceof Error)) {
      return { kind: 'lightning', amount: decodedBolt11.satoshis || 0 };
    }

    let decodedBitcoinAddress = hi.decodeBitcoinAddress(toText);
    if (!(decodedBitcoinAddress instanceof Error)) {
      return { kind: 'bitcoin' };
    }

    return { kind: 'error', message: 'not a valid invoice or bitcoin address' };
  })();

  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToText(event.target.value);
  }

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

  async function send() {
    const s = await doSend(toText, amountText, calcFee());
    if (s instanceof Error) {
      toast.error(s.message);
    } else {
      history.push(s);
    }
  }

  function ShowFeeText() {
    return (
      <div>
        <Row>
          <Col sm={{ size: 1, offset: 1 }}>
            <p>Fee:</p>
          </Col>
          <Col sm={{ size: 9, offset: 0 }}>
            <p style={{ fontWeight: 500 }}>{(calcFee() / 1e8).toFixed(8)} btc</p>
          </Col>
        </Row>
        <Row style={{ justifyContent: 'center' }}>
          {feeSchedule && <small className="text-muted">This transaction will be sent with {feeSchedule.immediateFeeRate} sat/vbyte</small>}
        </Row>
      </div>
    );
  }

  function handleSpeedSelectionChange(v: 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE') {
    setPrioritySelection(v);
  }

  function showCustom() {
    return (
      <div>
        <FormGroup row>
          <Col sm={{ size: 1, offset: 1 }}>
            <p>Fee:</p>
          </Col>
          <Col sm={{ size: 9, offset: 0 }}>
            <InputGroup>
              <Input value={feeText} onChange={event => setFeeText(event.target.value)} />
              <BitcoinUnitSwitch className="fee-units" name="units" valueOne="sat/vbyte" valueTwo="sat/weight" />
            </InputGroup>
          </Col>
        </FormGroup>
        <Row style={{ justifyContent: 'center' }}>
          <small className="text-muted">This transaction will be sent with ??? sat/byte and a ETA of ? blocks (?0 mins).</small>
        </Row>
      </div>
    );
  }

  function showLightningFeeSelection() {
    return (
      <FormGroup row className="bordered-form-group">
        <Label for="feeLimit" sm={3}>
          Fee Limit:
        </Label>
        <Col sm={{ size: 8, offset: 0 }}>
          <InputGroup>
            <Input value={feeLimit} onChange={event => setFeeLimit(event.target.value)} />
          </InputGroup>
          satoshis
        </Col>
        <Row style={{ justifyContent: 'center', margin: '1rem 2rem' }}>
          <small className="text-muted">
            This is the maximum fee that will be paid. If the fee results less than this, we will refund the remainder to your account.
          </small>
        </Row>
      </FormGroup>
    );
  }
  function showBitcoinFeeSelection() {
    return (
      <FormGroup row className="bordered-form-group">
        <Label for="amountText" sm={3}>
          Type of Fee:
        </Label>

        <div className="send-radio-buttons-container">
          <FeeOptionIcon selection="IMMEDIATE" onSelectionChanged={handleSpeedSelectionChange} />
          <FeeOptionIcon selection="BATCH" onSelectionChanged={handleSpeedSelectionChange} />
          <FeeOptionIcon selection="FREE" onSelectionChanged={handleSpeedSelectionChange} />
          <FeeOptionIcon selection="CUSTOM" onSelectionChanged={handleSpeedSelectionChange} />
        </div>

        <div className="fee-wrapper">{prioritySelection === 'CUSTOM' ? showCustom() : <ShowFeeText />}</div>
      </FormGroup>
    );
  }

  // let feeComponent;

  // let decoded: any = hi.decodeBolt11(toText);
  // if (!(decoded instanceof Error)) {
  //   feeComponent = showLightningFeeSelection();
  // } else {
  //   decoded = hi.decodeBitcoinAddress(toText);
  //   if (decoded instanceof Error) {
  //     feeComponent = <p>send to a bitcoin address or lightning invoice</p>
  //   } else {
  //     feeComponent = showBitcoinFeeSelection();
  //   }
  // }

  return (
    <div>
      <ToastContainer />
      <h5>Send</h5>
      <div className="inner-container">
        <Form>
          <FormGroup row className="bordered-form-group">
            <Label for="toText" sm={3}>
              To:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={toText} onChange={handleToTextChange} type="text" className="to-text-input" required />
                <QrScanner onCodeRead={setToText} />
              </InputGroup>
            </Col>
          </FormGroup>
          <FormGroup row className="bordered-form-group">
            <Label for="amountText" sm={3}>
              Amount:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input
                  value={(sendType.kind === 'lightning' && sendType.amount) || amountText}
                  onChange={event => setAmountText(event.target.value)}
                  disabled={sendType.kind === 'lightning' && sendType.amount !== 0}
                />
                <BitcoinUnitSwitch name="unit" valueOne="btc" valueTwo="sat" />
                <Button className="max-button" color="danger" onClick={setMaxAmount}>
                  max
                </Button>
              </InputGroup>
            </Col>
          </FormGroup>

          {sendType.kind === 'lightning' ? showLightningFeeSelection() : undefined}
          {sendType.kind === 'bitcoin' ? showBitcoinFeeSelection() : undefined}
          {sendType.kind === 'error' ? <p>Could not parse to text: {sendType.message}</p> : undefined}

          {/* add memo */}

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

function useFeeSchedule() {
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleResult | undefined>(undefined);

  useEffect(() => {
    getFeeSchedule(wallet.config).then(setFeeSchedule);
  }, []);

  return feeSchedule;
}

async function doSend(toText: string, amountText: string, fee: number): Promise<string | Error> {
  const address = toText;
  // TODO: proper validation...
  if (address.length < 5) {
    return new Error('Oops! invalid address');
  }

  const isBitcoinSend = address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('2') || address.startsWith('3');

  if (!isBitcoinSend && !address.startsWith('ln')) {
    return new Error('Oops! not a bitcoin address, nor a lightning payment request');
  }

  const amount = Number.parseInt(amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return new Error('Oops! invalid amount');
  }

  const feeLimit = 100; // todo...
  // const payment = new hi.LightningPayment(toText, amount, feeLimit);

  const transferHash = await wallet.sendHookout(address, amount, fee);
  if (transferHash === 'NOT_ENOUGH_FUNDS') {
    return new Error('Oops! not enough funds');
  }

  return `/claimables/${transferHash.toPOD()}`;
  //history.push();
}

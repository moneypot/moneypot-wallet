import React, { useState, useEffect } from 'react';
import * as hi from 'moneypot-lib';

import { wallet, useBalance } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import QrScanner from './qr-scanner';
import FeeOptionIcon from './fee-option-icon';
import BitcoinAmountInput from '../bitcoin-amount-input';

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const feeSchedule = useFeeSchedule();
  const [toText, setToText] = useState('');
  const [amountInput, setAmountInput] = useState(0);
  const [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');
  const [feeText, setFeeText] = useState('');
  const [feeLimit, setFeeLimit] = useState(100);
  const balance = useBalance();

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'lightning'; amount: number } | { kind: 'bitcoin' } => {
    if (toText === '') {
      return { kind: 'empty' };
    }

    let decodedBolt11 = hi.decodeBolt11(toText);
    if (!(decodedBolt11 instanceof Error)) {
      if (decodedBolt11.timeExpireDate * 1000 <= Date.now()) {
        return { kind: 'error', message: `lightning invoice has already expired (${decodedBolt11.timeExpireDateString} )` };
      }

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

  function calcFee(): number {
    if (sendType.kind === 'lightning') {
      return feeLimit;
    }

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

  function getAmount() {
    if (sendType.kind === 'lightning' && sendType.amount) {
      return sendType.amount;
    }
    return amountInput;
  }

  async function send() {
    const amount = getAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('invalid amount');
      return;
    }

    let transferHash;
    if (toText.startsWith('ln')) {
      console.log('sending lightning payment: ', toText, amount, calcFee());
      transferHash = await wallet.sendLightningPayment(toText, amount, calcFee());
    } else {
      transferHash = await wallet.sendHookout(prioritySelection, toText, amount, calcFee());
    }

    if (typeof transferHash === 'string') {
      toast.error('Oops! ' + transferHash);
      return;
    }

    history.push(`/claimables/${transferHash.toPOD()}`);
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
              <div className="input-group-append">
                <span className="input-group-text">sat/vbyte</span>
              </div>
            </InputGroup>
          </Col>
        </FormGroup>
        <Row style={{ justifyContent: 'center' }}>
          <small className="text-muted">This transaction will be sent with ??? sat/vbyte and a ETA of ? blocks (?0 mins).</small>
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
            <BitcoinAmountInput onAmountChange={setFeeLimit} max={maxAmount} defaultAmount={feeLimit} prefix="fee" />
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
        <Label for="feeSelection" sm={3}>
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

  const maxAmount = balance; // TODO: Reduce the tx fee

  return (
    <div>
      <ToastContainer />
      <h5 className="main-header">Send</h5>
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
            <Label for="amountInput" sm={3}>
              Amount:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <BitcoinAmountInput onAmountChange={setAmountInput} max={maxAmount} amount={(sendType.kind === 'lightning' && sendType.amount) || undefined} />
            </Col>
          </FormGroup>

          {sendType.kind === 'lightning' ? showLightningFeeSelection() : undefined}
          {sendType.kind === 'bitcoin' ? showBitcoinFeeSelection() : undefined}
          {sendType.kind === 'error' ? <p>Error: {sendType.message}</p> : undefined}

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

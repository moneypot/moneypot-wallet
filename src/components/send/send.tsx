import React, { useState, useEffect } from 'react';
import * as hi from 'moneypot-lib';

import { wallet, useBalance } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import getEstimatedCustomFee, { BitcoinFees } from '../../wallet/requests/estimate-custom-fee';

import QrScanner from './qr-scanner';
import FeeOptionIcon from './fee-option-icon';
import BitcoinAmountInput from '../bitcoin-amount-input';
import {
  templateTransactionWeight,
  legacyTransactionWeight,
  segwitOutput,
  wrappedTransactionWeight,
  legacyOutput,
  wrappedOutput,
  segmultiOutput,
  segmultiTransactionWeight,
} from '../../config';
import { decodeBitcoinAddress } from 'moneypot-lib';
import { notError } from '../../util';

interface PTMaddress {
  toAddress: string;
  amount: number;
}

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [isRBF, setRBF] = useState(true);
  const updateRBF = () => setRBF(!isRBF);
  const feeSchedule = useFeeSchedule();
  const recommendedFees = useEstimateCustomFee();

  const [toText, setToText] = useState('');

  const [toPTM, setToPTM] = useState('');
  const [ptm, setPTM] = useState(false);

  const [amountInput, setAmountInput] = useState(0);

  let [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');
  const [feeText, setFeeText] = useState('');

  const [feeLimit, setFeeLimit] = useState(100);
  const balance = useBalance();
  useEffect(() => {
    if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) != null) {
      if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) === 'true') {
        setRBF(false);
      }
    }
    if (localStorage.getItem(`${wallet.db.name}-setting4-hasPTM`) != null) {
      if (localStorage.getItem(`${wallet.db.name}-setting4-hasPTM`) === 'true') {
        setPTM(true);
      }
    }
  }, []);

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
  function handleToPTMChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToPTM(event.target.value);
  }
  let ptmarray: PTMaddress[] = [];
  function AmountOfPTM() {
    for (let i = 0; i < toPTM.split(';').length - 1; i++) {
      // all this splitting is redundant for a simple count function, but we might want to do some other stuff here. todo.
      const s = toPTM.replace(/\s/g, '').split(';')[i];
      const sendData = s.split(',');
      const toAddress = sendData[sendData.length - 2];
      const amount = Number(sendData[sendData.length - 1]);

      // if (hi.decodeBitcoinAddress(toAddress) instanceof Error) {
      //   throw `invalid address ${toAddress}`;
      // }
      // if(!(Number.isFinite(amount)))
      // console.log(Number.isFinite(amount), "well, what is it?")
      ptmarray.push({ toAddress, amount });
    }
    //  setcheckedPTM(ptmarray)

    return (
      <Label>you're trying to send {ptmarray != null ? ptmarray.length : 'null'} transaction(s). If this is not correct, please recheck your formatting!</Label>
    );
  }

  function calcFee(PTMaddress?: string): number {
    if (sendType.kind === 'lightning') {
      return feeLimit;
    }
    let isType;
    if (PTMaddress != undefined) {
      isType = decodeBitcoinAddress(PTMaddress);
    } else isType = decodeBitcoinAddress(toText);

    if (isType === undefined) {
      throw isType;
    }
    if (isType instanceof Error) {
      throw isType;
    }

    if (!feeSchedule) {
      return 0;
    }
    if (PTMaddress != undefined) {
      prioritySelection = 'BATCH';
    }
    // check p2wsh sizes, also check if this holds up with dynamic feerates against the custodian (testnet is dull.).
    if (prioritySelection === 'IMMEDIATE') {
      // don't send non-integers, ceil in case of 1/sat/b etc (140.25 eg)
      switch (isType.kind) {
        case 'p2pkh':
          return Math.ceil(feeSchedule.immediateFeeRate * legacyTransactionWeight);
        case 'p2sh':
          return Math.ceil(feeSchedule.immediateFeeRate * wrappedTransactionWeight);
        case 'p2wsh':
          return Math.ceil(feeSchedule.immediateFeeRate * segmultiTransactionWeight);
        default:
          return Math.ceil(feeSchedule.immediateFeeRate * templateTransactionWeight);
      }
    }
    if (prioritySelection === 'BATCH') {
      switch (isType.kind) {
        case 'p2pkh':
          return Math.ceil(feeSchedule.immediateFeeRate * legacyOutput);
        case 'p2sh':
          return Math.ceil(feeSchedule.immediateFeeRate * wrappedOutput);
        case 'p2wsh':
          return Math.ceil(feeSchedule.immediateFeeRate * segmultiOutput);
        default:
          return Math.ceil(feeSchedule.immediateFeeRate * segwitOutput);
      }
    }

    if (prioritySelection === 'CUSTOM') {
      switch (isType.kind) {
        case 'p2pkh':
          // don't send non-integers, per vbyte
          return Math.ceil((Number(feeText) * legacyTransactionWeight) / 4);
        case 'p2sh':
          return Math.ceil((Number(feeText) * wrappedTransactionWeight) / 4);
        case 'p2wsh':
          return Math.ceil((Number(feeText) * segmultiTransactionWeight) / 4);
        default:
          return Math.ceil((Number(feeText) * templateTransactionWeight) / 4);
      }
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
    const disableRBF = () => {
      return prioritySelection === 'CUSTOM' || prioritySelection === 'IMMEDIATE' ? isRBF : true;
      // batched and free transactions aren't initiators anyway
    };
    // if we try to send a PTM and there's residue in toText, won't work. perhaps clear toText hooks?
    if (toText != '') {
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('invalid amount');
        return;
      }
    }

    // this is a really lazy solution. We send a hookout for each line.. Alternative is to modify moneypot-lib a bit to allow Hookout to have multiple output addresses (for this reason?) (TODO?)
    let transferHash;
    if (toText.startsWith('ln')) {
      console.log('sending lightning payment: ', toText, amount, calcFee());
      transferHash = await wallet.sendLightningPayment(toText, amount, calcFee());
    }
    if (toText != '' && toPTM != '') {
      toast.error('Please send either transaction.'); // This might be really confusing for users and it really is kind of a half-assed solution
    }
    if (toText != '' && toPTM === '') {
      transferHash = await wallet.sendHookout(prioritySelection, toText, amount, calcFee(), disableRBF());

      if (typeof transferHash === 'string') {
        toast.error('Oops! ' + transferHash);
        return;
      }
      history.push(`/claimables/${transferHash.toPOD()}`);
    }
    if (toText === '' && toPTM != '') {
      // check if entire array is valid.
      for (let i = 0; i < ptmarray.length; i++) {
        const e: PTMaddress = ptmarray[i];

        if (hi.decodeBitcoinAddress(e.toAddress) instanceof Error) {
          throw `invalid address ${e.toAddress} on index ${i} `;
        }
        if (!Number.isFinite(e.amount)) {
          throw `invalid amount ${e.amount} on index ${i}`;
        }
      }

      // send 1 by 1
      for (let i = 0; i < ptmarray.length; i++) {
        const e: PTMaddress = ptmarray[i];

        transferHash = await wallet.sendHookout('BATCH', e.toAddress, e.amount, calcFee(e.toAddress), disableRBF());
        // it will push to the first hookout.

        if (typeof transferHash === 'string') {
          toast.error('Oops! ' + transferHash);
          return;
        }
        history.push(`/claimables/${transferHash.toPOD()}`);
      }
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
          {feeSchedule && (
            <small className="text-muted">
              This transaction will be sent with {prioritySelection != 'FREE' ? feeSchedule.immediateFeeRate * 4 : 1} sat/vbyte
            </small>
          )}
        </Row>
      </div>
    );
  }

  function handleSpeedSelectionChange(v: 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE') {
    setPrioritySelection(v);
  }

  // request against the custodian to get avg confirmation times?
  const howLong = () => {
    if (recommendedFees === undefined) {
      return undefined;
    }
    if (recommendedFees.fastestFee <= Number(feeText)) {
      return `10 minutes, within 1 block. (recommended fee to get confirmed within 10 minutes is ${recommendedFees.fastestFee} sat/vbyte)`;
    } else if (recommendedFees.halfHourFee <= Number(feeText)) {
      return `half an hour, within 3 blocks. ( recommended fees to get confirmed within half an hour are ${recommendedFees.halfHourFee} sat/vbyte)`;
    } else if (recommendedFees.hourFee <= Number(feeText)) {
      return `probably an hour or more, most likely around 6 blocks. (recommend fees to get confirmed within the hour are ${recommendedFees.hourFee} sa/vbyte)`;
    } else return '???';
  };

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
          <small className="text-muted">
            This transaction will be sent with {feeText} sat/vbyte and has an ETA of confirming within{' '}
            {howLong() != undefined ? howLong() : "...can't load feerates"}
          </small>
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
  function showLightningDescription() {
    const pro = notError(hi.decodeBolt11(toText));
    let description;
    for (const tag of pro.tags) {
      if (tag.tagName === 'description') {
        description = tag.data;
      }
    }
    return (
      <FormGroup row className="bordered-form-group">
        <Label for="" sm={3}>
          Memo:
        </Label>
        <Col sm={{ size: 8, offset: 0 }}>{description}</Col>
        <Row style={{ justifyContent: 'center', margin: '1rem 2rem' }}>
          <small className="text-muted">
            This is the description that was attached to the invoice. If you expected a different memo, you might be getting scammed.
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

  function ShowPayToMany() {
    return (
      <FormGroup row className="bordered-form-group">
        <Label for="toPTM" sm={3}>
          pay to many:
        </Label>
        <Col sm={{ size: 9, offset: 0 }}>
          <InputGroup>
            <Input
              value={toPTM}
              onChange={handleToPTMChange}
              type="textarea"
              className="to-text-input"
              placeholder="format: address, amount; address, amount;"
              required
            />
            {/* <QrScanner onCodeRead={setToText} /> */}
          </InputGroup>
        </Col>
      </FormGroup>
    );
  }

  // send-to-many, format:  <address, amount;>

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

  function isValid(toText: string) {
    if (hi.decodeBitcoinAddress(toText) instanceof Error) {
      return false;
    }
    return true;
  }

  return (
    <div>
      <ToastContainer />
      <h5 className="main-header">Send</h5>
      <div className="inner-container">
        <Form>
          {toPTM === '' && (
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
          )}
          {toPTM === '' && (
            <FormGroup row className="bordered-form-group">
              <Label for="amountInput" sm={3}>
                Amount:
              </Label>
              <Col sm={{ size: 9, offset: 0 }}>
                <BitcoinAmountInput
                  onAmountChange={setAmountInput}
                  max={maxAmount}
                  currentFee={isValid(toText) === true ? calcFee() : 0}
                  amount={(sendType.kind === 'lightning' && sendType.amount) || undefined}
                />
              </Col>
            </FormGroup>
          )}

          {ptm === true && toText === '' && ShowPayToMany()}
          {toPTM != '' && AmountOfPTM()}
          {toPTM === '' && !toText.startsWith('ln') && (
            <FormGroup check>
              <Label check>
                <Input id="setting1" type="checkbox" onChange={updateRBF} checked={!isRBF} /> Disable RBF when sending immediate transactions.
                <p>
                  <b>Note:</b> you will be unable to feebump it. A usecase for this would be if you wanted to use 0-conf at any exchange, shop, or casino.
                </p>
              </Label>
            </FormGroup>
          )}

          {sendType.kind === 'lightning' ? showLightningFeeSelection() : undefined}
          {sendType.kind === 'lightning' ? showLightningDescription() : undefined}
          {toPTM === '' && sendType.kind === 'bitcoin' ? showBitcoinFeeSelection() : undefined}
          {sendType.kind === 'error' ? <p>Error: {sendType.message}</p> : undefined}

          <FormGroup row>
            <Col className="submit-button-container">
              <Button
                id="AppSendButton"
                color="success"
                className="btn-moneypot"
                onClick={() => {
                  send();
                  disableAfterClick();
                }}
              >
                Send
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    </div>
  );
}
// this should prevent accidental double clicks. Not sure if this is most ideal. (Will be gone on refresh.)
function disableAfterClick() {
  return ((document.getElementById('AppSendButton') as HTMLInputElement).disabled = true);
}

function useFeeSchedule() {
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleResult | undefined>(undefined);

  useEffect(() => {
    getFeeSchedule(wallet.config).then(setFeeSchedule);
  }, []);

  return feeSchedule;
}

function useEstimateCustomFee() {
  const [estimatedCustomFee, setEstimatedCustomFee] = useState<BitcoinFees | undefined>(undefined);

  useEffect(() => {
    getEstimatedCustomFee(wallet.config).then(setEstimatedCustomFee);
  }, []);

  return estimatedCustomFee;
}

import React, { useState, useEffect } from 'react';
import * as hi from 'moneypot-lib';

import { wallet, useBalance, useMaxSend } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import getEstimatedCustomFee, { BitcoinFees } from '../../wallet/requests/estimate-custom-fee';

import QrScanner from './qr-scanner';
import FeeOptionIcon from './fee-option-icon';
import BitcoinAmountInput from '../../util/bitcoin-amount-input';
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

import { decodeBitcoinBip21, bip21 } from './bip70paymentprotocol';

interface PTMaddress {
  toAddress: string;
  amount: number;
}

type Props = { history: { push: (path: string) => void } };
export default function Send({ history }: Props) {
  const [IsDisabled, setIsDisabled] = useState(false);

  const [isRBF, setRBF] = useState(true);
  const updateRBF = () => setRBF(!isRBF);
  const feeSchedule = useFeeSchedule();
  const recommendedFees = useEstimateCustomFee();

  const [LocalMemo, setLocalMemo] = useState<string | undefined>(undefined);

  const [toText, setToText] = useState('');

  const [bip21Invoice, setbip21Invoice] = useState<bip21 | undefined>(undefined);
  // const [sendType, setSendType] = useState<{ kind: 'empty'; } | { kind: 'error'; message: string; } | { kind: 'lightning'; amount: number; } | { kind: 'bitcoin'; } | { kind: 'bitcoinInvoice'; }>({kind: "empty"});
  const [sendType, setSendType] = useState<
    { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'lightning'; amount: number } | { kind: 'bitcoin' } | { kind: 'bitcoinbip21Invoice' }
  >({ kind: 'empty' });

  const [toPTM, setToPTM] = useState('');
  const [ptm, setPTM] = useState(false);

  const [amountInput, setAmountInput] = useState(0);

  let [prioritySelection, setPrioritySelection] = useState<'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE'>('IMMEDIATE');
  const [feeText, setFeeText] = useState('');

  const [feeLimit, setFeeLimit] = useState(100);
  // const balance = useBalance();
  const maxSend = useMaxSend();
  useEffect(() => {
    const hasRBF = wallet.settings.setting3_hasDisabledRBF;
    if (hasRBF != undefined) {
      if (hasRBF) {
        setRBF(false);
      }
    }
    const hasPTM = wallet.settings.setting4_hasPTM;
    if (hasPTM != undefined) {
      if (hasPTM) {
        setPTM(true);
      }
    }
  }, []);

  useEffect(() => {
    async function getSendType() {
      if (toText === '') {
        setSendType({ kind: 'empty' });
      } else if (toText != '') {
        let decodedBolt11 = hi.decodeBolt11(toText);
        if (!(decodedBolt11 instanceof Error)) {
          if (decodedBolt11.timeExpireDate * 1000 <= Date.now()) {
            setSendType({ kind: 'error', message: `lightning invoice has already expired (${decodedBolt11.timeExpireDateString} )` });
          }

          setSendType({ kind: 'lightning', amount: decodedBolt11.satoshis || 0 });
          return;
        }

        let decodedBitcoinAddress = hi.decodeBitcoinAddress(toText);
        if (!(decodedBitcoinAddress instanceof Error)) {
          setSendType({ kind: 'bitcoin' });
          return;
        }

        let decodeBitcoinBip20;
        if (toText.startsWith('bitcoin:') && !toText.startsWith('bitcoin:?')) {
          decodeBitcoinBip20 = decodeBitcoinBip21(toText);
          if (!(decodeBitcoinBip20 instanceof Error)) {
            if (!(decodeBitcoinAddress(decodeBitcoinBip20.address) instanceof Error)) {
              setbip21Invoice(decodeBitcoinBip20);
              setSendType({ kind: 'bitcoinbip21Invoice' });
              return;
            }
          }
        }

        if (decodedBitcoinAddress instanceof Error && decodedBolt11 instanceof Error && decodeBitcoinBip20 instanceof Error && toText != '') {
          setSendType({ kind: 'error', message: 'not a valid invoice or bitcoin address' });
        }
      }
    }
    getSendType();
  }, [toText]);

  // is this good practice or should we just change the hook @ the onchange?
  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToText(event.target.value);
    setSendType({ kind: 'empty' });
  }
  function handleMemoChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLocalMemo(event.target.value);
  }
  function handleCustomFeeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFeeText(event.target.value);
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

  // make this a hook?
  function calcFee(PTMaddress?: string): number {
    if (sendType.kind === 'lightning') {
      return feeLimit;
    }

    let isType;
    if (PTMaddress) {
      isType = decodeBitcoinAddress(PTMaddress);
    }
    if (sendType.kind === 'bitcoinbip21Invoice' && bip21Invoice && PTMaddress === undefined) {
      isType = decodeBitcoinAddress(bip21Invoice.address);
    } else if (sendType.kind != 'bitcoinbip21Invoice' && PTMaddress === undefined) {
      isType = decodeBitcoinAddress(toText);
    }

    if (isType === undefined) {
      throw isType;
    }
    if (isType instanceof Error) {
      throw isType;
    }

    if (!feeSchedule) {
      return 0;
    }
    if (PTMaddress) {
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

    if (sendType.kind === 'bitcoinbip21Invoice' && bip21Invoice) {
      if (bip21Invoice.options.amount) {
        return bip21Invoice.options.amount;
      }
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
      if (typeof transferHash === 'string') {
        toast.error('Oops! ' + transferHash);
        return;
      }
      history.push(`/claimables/${transferHash.toPOD()}`);
    }

    if (toText != '' && toPTM != '') {
      toast.error('Please send either transaction.'); // This might be really confusing for users and it really is kind of a half-assed solution
    }

    // this is DEFAULT
    if (toText != '' && toPTM === '' && !toText.startsWith('ln') && !toText.startsWith('bitcoin:')) {
      transferHash = await wallet.sendHookout(prioritySelection, toText, amount, calcFee(), disableRBF());
      if (typeof transferHash === 'string') {
        toast.error('Oops! ' + transferHash);
        return;
      }
      if (LocalMemo) {
        localStorage.setItem(transferHash.toPOD(), LocalMemo);
      }
      history.push(`/claimables/${transferHash.toPOD()}`);
    }

    // this is PAY-TO-MANY
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
        if (LocalMemo) {
          localStorage.setItem(transferHash.toPOD(), LocalMemo);
        }
        history.push(`/claimables/${transferHash.toPOD()}`);
      }
    }

    // this is BIP21
    if (toText.startsWith('bitcoin') && bip21Invoice) {
      console.log('sending bitcoin bip21 Invoice payment: ', bip21Invoice.address, amount, calcFee());

      if (bip21Invoice.options.time) {
        if (bip21Invoice.options.exp) {
          let timeExp = Number(bip21Invoice.options.exp) + Number(bip21Invoice.options.time);
          if (new Date(timeExp * 1000) <= new Date(Date.now())) {
            toast.error('Invoice has already expired! Please request a new one!');
            return;
          }
        }
      }

      transferHash = await wallet.sendHookout(
        prioritySelection,
        bip21Invoice.address,
        bip21Invoice.options.amount ? bip21Invoice.options.amount : amountInput,
        calcFee(),
        disableRBF()
        // bip21Invoice.options.message != undefined ? bip21Invoice.options.message : undefined
      );
      if (typeof transferHash === 'string') {
        toast.error('Oops! ' + transferHash);
        return;
      }
      // tx done, push memo to localstorage..?
      if (bip21Invoice.options.message) {
        localStorage.setItem(transferHash.toPOD(), bip21Invoice.options.message);
      }
      history.push(`/claimables/${transferHash.toPOD()}`);
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
          {feeSchedule ? (
            <small className="text-muted">
              This transaction will be sent with{' '}
              {prioritySelection === 'IMMEDIATE'
                ? feeSchedule.immediateFeeRate * 4
                : prioritySelection === 'CUSTOM'
                ? feeText
                : prioritySelection === 'BATCH'
                ? feeSchedule.immediateFeeRate * 4
                : 1}{' '}
              sat/vbyte
            </small>
          ) : undefined}
        </Row>
      </div>
    );
  }

  function handleSpeedSelectionChange(v: 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE') {
    setPrioritySelection(v);
  }

  // request against the custodian to get avg confirmation times?
  const howLong = () => {
    if (!recommendedFees) {
      return undefined;
    }
    if (recommendedFees.fastestFee <= Number(feeText)) {
      return `10 minutes, within 1 block. (recommended fee to get confirmed within 10 minutes is ${recommendedFees.fastestFee} sat/vbyte)`;
    } else if (recommendedFees.halfHourFee <= Number(feeText)) {
      return `half an hour, within 3 blocks. (recommended fees to get confirmed within half an hour are ${recommendedFees.halfHourFee} sat/vbyte)`;
    } else if (recommendedFees.hourFee <= Number(feeText)) {
      return `Within an hour, most likely around 6 blocks. (recommend fees to get confirmed within the hour are ${recommendedFees.hourFee} sat/vbyte)`;
    } else {
      return `With this feerate it will take longer than an hour to get confirmed. Recommended fees to get confirmed within an hour are ${recommendedFees.hourFee}`;
    }
  };

  function ShowCustom() {
    return (
      <div>
        <Row>
          <Col sm={{ size: 1, offset: 1 }}>
            <p>Fee:</p>
          </Col>
          <Col sm={{ size: 12, offset: 1 }} md={{ size: 9, offset: 0 }}>
            <InputGroup>
              <Input value={feeText} onChange={handleCustomFeeChange} /> {/*// e => setFeetext(e.targe.value) */}
              {/* )} */}
              <div className="input-group-append">
                <span className="input-group-text">sat/vbyte</span>
              </div>
            </InputGroup>
          </Col>
        </Row>
        {/* // lame shit right here */}
        <Row className="lame-duck">
          <small className="text-muted">
            This transaction will be sent with {feeText} sat/vbyte or <b>{calcFee()} sats</b> and has an ETA of confirming within{' '}
            {recommendedFees ? howLong() : "...can't load feerates"}
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
            <BitcoinAmountInput onAmountChange={setFeeLimit} max={maxSend} defaultAmount={feeLimit} prefix="fee" />
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
    let description;

    if (sendType.kind === 'lightning') {
      const pro = notError(hi.decodeBolt11(toText));
      for (const tag of pro.tags) {
        if (tag.tagName === 'description') {
          description = tag.data;
        }
      }
    } else if (sendType.kind === 'bitcoinbip21Invoice' && bip21Invoice) {
      if (bip21Invoice.options.message) {
        description = bip21Invoice.options.message;
      }
    }

    return (
      <FormGroup row className="bordered-form-group">
        <Label for="" sm={3}>
          Memo:
        </Label>
        <Col sm={{ size: 8, offset: 0 }}>{description}</Col>
        {sendType.kind === 'bitcoinbip21Invoice' && bip21Invoice && bip21Invoice.options.label ? (
          <React.Fragment>
            <Label for="" sm={3}>
              Label:
            </Label>
            <Col sm={{ size: 8, offset: 0 }}>{bip21Invoice.options.label}</Col>
          </React.Fragment>
        ) : undefined}
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

        <div className="fee-wrapper">{prioritySelection === 'CUSTOM' ? ShowCustom() : <ShowFeeText />}</div>
      </FormGroup>
    );
  }

  function showBitcoinInvoiceFeeSelection() {
    return (
      <FormGroup row className="bordered-form-group">
        <div className="fee-wrapper">
          {' '}
          <ShowCustom />{' '}
        </div>

        <div className="fee-wrapper">
          <ShowFeeText />{' '}
        </div>
      </FormGroup>
    );
  }

  function ShowBitcoinInvoiceAddresses() {
    if (bip21Invoice) {
      return (
        <FormGroup row className="bordered-form-group" key={bip21Invoice.address}>
          <Col xl={{ size: 1, offset: 0 }}>
            <p>Address & Amount:</p>
          </Col>
          <Col xl={{ size: 6, offset: 1 }}>
            <InputGroup>
              <Input value={bip21Invoice.address} disabled />
            </InputGroup>
          </Col>
          <Col xl={{ size: 3, offset: 0 }}>
            <InputGroup>
              <Input value={bip21Invoice.options.amount ? bip21Invoice.options.amount : 'any'} disabled />
            </InputGroup>
          </Col>
        </FormGroup>
      );
    }
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
              onChange={handleToPTMChange} // e => setToPTM(e.target.value)
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

  // const maxAmount = balance; // TODO: Reduce the tx fee

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
          {toPTM === '' ? (
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
          ) : undefined}
          {toPTM === '' ? (
            <FormGroup row className="bordered-form-group">
              <Label for="amountInput" sm={3}>
                Amount:
              </Label>
              <Col sm={{ size: 9, offset: 0 }}>
                <BitcoinAmountInput
                  onAmountChange={setAmountInput}
                  max={maxSend}
                  currentFee={isValid(toText) === true ? calcFee() : 0}
                  amount={
                    (sendType.kind === 'lightning' ? sendType.amount : undefined) ||
                    (sendType.kind == 'bitcoinbip21Invoice' && bip21Invoice && bip21Invoice.options.amount ? bip21Invoice.options.amount : undefined) ||
                    undefined
                  }
                />
                {amountInput != 0 && amountInput > maxSend ? (
                  <div>
                    Due to a limitation of moneypot, you can at most send <code>{maxSend} sat</code>{' '}
                  </div>
                ) : undefined}
              </Col>
            </FormGroup>
          ) : undefined}
          {ptm === true && toText === '' ? ShowPayToMany() : undefined}
          {toPTM != '' ? AmountOfPTM() : undefined}

          {sendType.kind === 'bitcoin' || toPTM != '' ? (
            <FormGroup row className="bordered-form-group">
              <Label for="localMemo" sm={3}>
                Attach local memo to payment:
              </Label>
              <Col sm={{ size: 9, offset: 0 }}>
                <InputGroup>
                  <Input
                    onChange={handleMemoChange} // e => setLocalMemo(e);
                    type="text"
                    className="to-text-input"
                  />
                </InputGroup>
              </Col>
            </FormGroup>
          ) : undefined}
          {/* {sendType.kind === 'lightning' || sendType.kind === "bitcoinInvoice" ? showLightningFeeSelection() : undefined} */}
          {sendType.kind === 'lightning' ? showLightningFeeSelection() : undefined}
          {sendType.kind === 'bitcoinbip21Invoice' ? (ShowBitcoinInvoiceAddresses(), showBitcoinInvoiceFeeSelection()) : undefined}
          {sendType.kind === 'lightning' || sendType.kind === 'bitcoinbip21Invoice' ? showLightningDescription() : undefined}
          {(toPTM === '' && sendType.kind === 'bitcoin') || sendType.kind === 'bitcoinbip21Invoice' ? showBitcoinFeeSelection() : undefined}
          {(sendType.kind === 'bitcoin' && (prioritySelection === 'CUSTOM' || prioritySelection === 'IMMEDIATE')) ||
          (sendType.kind === 'bitcoinbip21Invoice' && (prioritySelection === 'CUSTOM' || prioritySelection === 'IMMEDIATE')) ? (
            <FormGroup check>
              <Label check>
                <Input id="setting1" type="checkbox" onChange={updateRBF} checked={!isRBF} /> Disable Replace-By-Fee.
                <p>
                  <b>Note:</b> you will be unable to feebump it. A usecase for this would be if you wanted to use 0-conf at any exchange, shop, or casino.
                </p>
              </Label>
            </FormGroup>
          ) : undefined}

          {sendType.kind === 'error' ? <p>Error: {sendType.message}</p> : undefined}

          <FormGroup row>
            <Col className="submit-button-container">
              <Button
                id="AppSendButton"
                color="success"
                className="btn-moneypot"
                disabled={IsDisabled}
                onClick={() => {
                  send();
                  setIsDisabled(true);
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

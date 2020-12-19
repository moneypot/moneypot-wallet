import React, { useState, useEffect } from 'react';
import * as hi from 'moneypot-lib';
import { wallet, useBalance } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule, { FeeScheduleResult, getDynamicFeeRate } from '../../wallet/requests/get-fee-schedule';
import FetchTx, { AddressInfoTx } from '../../wallet/requests/bitcoin-txs';
import { RouteComponentProps } from 'react-router-dom';
import { RequestError } from '../../wallet/requests/make-request';

import fetchTxReceives from '../../wallet/requests/bitcoin-txs';

// why is this nested.. TODO
interface txid {
  txid: {
    CurrentTxid: string;
  };
}

export default function FeebumpSend(props: RouteComponentProps<{}, any, txid>): JSX.Element {
  const [toText, setToText] = useState<undefined | string>(undefined);
  const balance = useBalance();
  const [fee, setFee] = useState<number | undefined>(undefined);
  const [FailedFee, setFailedFee] = useState('');
  const [fairShare, setFairShare] = useState('Loading...');

  const [confTarget, setconfTarget] = useState('6') // 6 is default immediate.

  useEffect(() => {
    if (props.history.location.state != undefined) {
      setToText(props.history.location.state.txid.CurrentTxid);
    }
  }, []);
  useEffect(() => {
    async function getResponse() {
      if (toText && confTarget) {
        const fee = await calculateFee(await fetchTxReceives(toText));
        if (typeof fee === 'number') {
          setFee(fee);
        } else {
          setFailedFee(fee);
          setFee(undefined); // clean up
        }
      }
    }
    getResponse();
  }, [confTarget, toText]);

  // we should check bytes rather than inputs/outputs, but this'll do somewhat.

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'txid' } => {
    if (toText === undefined) {
      return { kind: 'empty' };
    }

    let decodedtxid = toText;
    if (decodedtxid.length === 64) {
      return { kind: 'txid' };
    } else return { kind: 'error', message: 'not a valid txid.' };
  })();

  async function calculateFee(Response: RequestError | AddressInfoTx): Promise<number | string> {
    if (Response instanceof RequestError) {
      return `unable to fetch transaction ${Response.message}`;
    }
    if (!Number.isFinite(Number(confTarget)) || Number(confTarget) <= 0) {
      toast.error('invalid blockTarget');
      return "Not a valid confTarget";
    }

    const { vin, vout, status, fee, weight } = Response;
    const fees = await getDynamicFeeRate(wallet.config, Number(confTarget));
    if (fees instanceof RequestError) { 
      return fees.message
    }

    if (status.confirmed === true) {
      return 'Invalid TX | TXID already confirmed';
    }
    // how much is disproportionate?
    if (weight > 561 + 500) {
      setFairShare('Please note: You will most likely pay a disproportionate amount of money for this feebump.');
    } else {
      setFairShare("It seems like this tx has a limited amount of inputs/outputs. You'll likely pay a fair share!");
    }

    for (let index = 0; index < vin.length; index++) {
      const sequence = vin[index];

      // needs to be lower than 0xfffffffe
      if (!(sequence.sequence < parseInt('0xfffffffe', 16))) {
        return 'Not flagging for RBF';
      }
    }

    const amount = Math.round(fees * weight) - fee;
    // It seems like feebump increase is by default 5 sat/b ? todo: check this
    const minFee = (Response.weight / 4) * 5;
    if (amount < minFee) {
      return Math.round(minFee);
    }
    return Math.round(amount);
  }

  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToText(event.target.value);
    // reset fee, makes everything a bit cleaner
    setFee(0);
  }

  async function send(): Promise<void> {
    const amount = fee;
    if (!amount) {
      toast.error('invalid amount');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('invalid amount');
      return;
    }
    if (balance < amount) {
      throw new Error('trying to send a larger amount than we actually have coins for, will not work');
    }

    const txid = hi.Buffutils.fromHex(toText, 32);
    if (txid instanceof Error) {
      throw txid;
    }
    let transferHash;
    {
      transferHash = await wallet.sendFeeBump(txid, 0, amount, Number(confTarget));
    }


    if (typeof transferHash === 'string') {
      toast.error('Oops! ' + transferHash);
      return;
    }

    props.history.push(`/claimables/${transferHash.toPOD()}`);
  }

  function handleConfTargetChange(event: React.ChangeEvent<HTMLInputElement>) {
    setconfTarget(event.target.value);
  }
  // const maxAmount = balance; // TODO: Reduce the tx fee

  return (
    <div>
      <ToastContainer />
      <h5 className="main-header">Feebump!</h5>
      <div className="inner-container">
        <Form>
          <FormGroup row className="bordered-form-group">
            <Label for="toText" sm={3}>
              Transaction ID:
            </Label>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
                <Input value={toText == undefined ? '' : toText} onChange={handleToTextChange} type="text" className="to-text-input" required disabled />
              </InputGroup>
            </Col>
          </FormGroup>

          {sendType.kind === 'error' ? <p>Error: {sendType.message}</p> : undefined}
          <p>
            <b>Expected Fee:</b> {fee != undefined ? fee + ' sat' : FailedFee}
          </p>
          <FormGroup row className="bordered-form-group">
              <Label for="toText" sm={3}>
                Confirm within:
              </Label>
          <Col sm={{ size: 12, offset: 1 }} md={{ size: 9, offset: 0 }}>
            <InputGroup>
              <Input value={confTarget} onChange={handleConfTargetChange} /> {/*// e => setFeetext(e.targe.value) */}
              {/* )} */}
              <div className="input-group-append">
                <span className="input-group-text">confTarget</span>
              </div>
            </InputGroup>
          </Col>
          </FormGroup>
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
         {fee  !== undefined ?  <Label>{fairShare}</Label> : undefined}
        </Form>
      </div>
    </div>
  );
}
// this should prevent accidental double clicks. Not sure if this is most ideal. (Will be gone on refresh.)
function disableAfterClick() {
  return ((document.getElementById('AppSendButton') as HTMLInputElement).disabled = true);
}

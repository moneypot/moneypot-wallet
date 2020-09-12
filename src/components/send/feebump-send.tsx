import React, { useState, useEffect } from 'react';
import * as hi from 'moneypot-lib';
import { wallet, useBalance } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule, { FeeScheduleResult } from '../../wallet/requests/get-fee-schedule';
import FetchTx, { AddressInfoTx } from '../../wallet/requests/bitcoin-txs';
import { RouteComponentProps } from 'react-router-dom';
import { RequestError } from '../../wallet/requests/make-request';
type Props = { history: { push: (path: string) => void } };

// Should probably actually ask the custodian...?
function getTxData(decodedTxid: string): Promise<AddressInfoTx | RequestError> {
  return FetchTx(decodedTxid).then(response => {
    return response;
  });
}

export default function FeebumpSend(props: RouteComponentProps, { history }: Props): JSX.Element {
  const [toText, setToText] = useState<undefined | string>(undefined);
  const balance = useBalance();
  const [fee, setFee] = useState(Number);
  const [inputs, setInputs] = useState(Number);
  const [outputs, setOutputs] = useState(Number);
  // const [Response, setResponse] = useState<undefined | any>(undefined)
  useEffect(() => {
    if (props.history.location.state != undefined) {
      setToText(props.history.location.state.txid.CurrentTxid);
    }
  }, []);

  useEffect(() => {
    async function getResponse() {
      if (toText) {
        setFee(await calculateFee(await getTxData(toText)));
      }
    }
    getResponse();
  }, [toText]);

  // we should check bytes rather than inputs/outputs, but this'll do somewhat.
  function checkInputs() {
    if (inputs != 0) {
      if (inputs > 2 || outputs > 2) {
        return <Label>Please note: You will most likely pay a disproportionate amount of money for this feebump.</Label>;
      } else return <Label>It seems like this tx has a limited amount of inputs/outputs. You'll likely pay a fair share!</Label>;
    }
  }

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'txid' } => {
    if (toText === undefined) {
      return { kind: 'empty' };
    }

    let decodedtxid = toText;
    if (decodedtxid.length === 64) {
      return { kind: 'txid' };
    } else return { kind: 'error', message: 'not a valid txid.' };
  })();

  async function calculateFee(Response: any): Promise<number> {
    const feeSchedule = await getFeeSchedule(wallet.config);
    if (Response.status.confirmed === true) {
      throw 'Invalid TX | TXID already confirmed';
    }
    if (!Response.status === undefined || !Response.vin) {
      throw Response;
    }
    setOutputs(Response.vout.length);
    setInputs(Response.vin.length);

    for (let index = 0; index < Response.vin.length; index++) {
      const sequence = Response.vin[index];
      if (sequence.sequence === undefined) {
        throw 'invalid txid';
      }

      // needs to be lower than 0xfffffffe
      if (!(sequence.sequence < parseInt('0xfffffffe', 16))) {
        throw 'Not flagging for RBF';
      }
    }
    // get the current fee
    if (!Response.fee || !Response.weight) {
      throw Response;
    }

    if (!feeSchedule) {
      throw new Error('Fetching feeschedules is hard!');
    }
    const amount = feeSchedule.immediateFeeRate * Response.weight - Response.fee;
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
      transferHash = await wallet.sendFeeBump(txid, 0, amount);
    }

    if (typeof transferHash === 'string') {
      toast.error('Oops! ' + transferHash);
      return;
    }

    props.history.push(`/claimables/${transferHash.toPOD()}`);
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
            <b>Expected Fee:</b> {fee != 0 ? fee + ' sat' : "Couldn't calculate fee"}
          </p>
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
          {checkInputs()}
        </Form>
      </div>
    </div>
  );
}
// this should prevent accidental double clicks. Not sure if this is most ideal. (Will be gone on refresh.)
function disableAfterClick() {
  return ((document.getElementById('AppSendButton') as HTMLInputElement).disabled = true);
}

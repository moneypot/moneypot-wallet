import React, { useState,  } from 'react';
import * as hi from 'moneypot-lib';
import { wallet, useBalance } from '../../state/wallet';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import getFeeSchedule from '../../wallet/requests/get-fee-schedule';
type Props = { history: { push: (path: string) => void } };

interface Options {
  fee?: number;
  weight?: number;
  size?: number;
  status?: Object;
}

interface Status {
  block_hash?: any;
  confirmed?: boolean;
}

// Should probably actually ask the custodian...?
function getTxData<T>(decodedTxid: string) {
  return fetch('https://blockstream.info/testnet/api/tx/' + decodedTxid).then(response => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json().then(data => data as T);
  });
}

export default function FeebumpSend({ history }: Props) {
  const [toText, setToText] = useState('');
  const balance = useBalance();

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'txid' } => {
    if (toText === '') {
      return { kind: 'empty' };
    }

    let decodedtxid = toText;
    const ishex = hi.Buffutils.fromHex(decodedtxid);
    if (ishex instanceof Error) {
      return { kind: 'error', message: 'not a valid txid.' };
    }
    if (decodedtxid.length === 64 && ishex.length === 32) {
      return { kind: 'txid' };
    } else return { kind: 'error', message: 'not a valid txid.' };
  })();

  async function calculateFee() {
    // object is unk
    const feeRate = (await getFeeSchedule(wallet.config)).immediateFeeRate;
    var myVal: Options = await getTxData(toText);
    // add interface?
    if (myVal.status === undefined) {
      throw myVal;
    }
    var status: Object = myVal.status;
    var obj: Status = status;
    if (obj.confirmed === true) {
      throw 'Invalid TX | TXID already confirmed';
    }
    // get the current fee
    if (myVal.fee === undefined || myVal.weight === undefined) {
      throw myVal;
    }
    const oldFee = myVal.fee;
    const newFee = feeRate * myVal.weight;
    let amount: number = newFee - oldFee;
    // It seems like feebump increase is by default 5 sat/b ? todo: check this
    const minFee = (myVal.weight / 4) * 5;
    if (amount < minFee) {
      return Math.round(minFee);
    }
    return Math.round(amount);
  }

  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToText(event.target.value);
  }

  async function send() {
    const amount = await calculateFee();
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('invalid amount');
      return;
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

    history.push(`/claimables/${transferHash.toPOD()}`);
  }

  const maxAmount = balance; // TODO: Reduce the tx fee

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
                <Input value={toText} onChange={handleToTextChange} type="text" className="to-text-input" required />
              </InputGroup>
            </Col>
          </FormGroup>

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
          <Label>Please note: You will most likely pay a disproportionate amount of money for this feebump.</Label>
        </Form>
      </div>
    </div>
  );
}
// this should prevent accidental double clicks. Not sure if this is most ideal. (Will be gone on refresh.)
function disableAfterClick() {
  return ((document.getElementById('AppSendButton') as HTMLInputElement).disabled = true);
}

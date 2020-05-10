import React, { useState, useEffect } from 'react';
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
  vin?: Array<Object>;
}
interface sequence {
  sequence?: number;
}
interface Status {
  block_hash?: any;
  confirmed?: boolean;
}

// Should probably actually ask the custodian...?
function getTxData<T>(decodedTxid: string): Promise<T> {
  return fetch('https://blockstream.info/testnet/api/tx/' + decodedTxid).then(response => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json().then(data => data as T);
  });
}

export default function FeebumpSend(props: any, { history }: Props): JSX.Element {
  const [toText, setToText] = useState('');
  const balance = useBalance();
  const [fee, setFee] = useState(Number);
  useEffect(() => {
    if (props.history.location.state != undefined) {
      setToText(props.history.location.state.txid.CurrentTxid);
    }
  }, []);

  let sendType = ((): { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'txid' } => {
    if (toText === '') {
      return { kind: 'empty' };
    }

    let decodedtxid = toText;
    if (decodedtxid.length === 64) {
      return { kind: 'txid' };
    } else return { kind: 'error', message: 'not a valid txid.' };
  })();

  async function calculateFee(): Promise<number> {
    const myVal: Options = await getTxData(toText);
    if (myVal.status === undefined || myVal.vin == undefined) {
      throw myVal;
    }
    for (let index = 0; index < myVal.vin.length; index++) {
      const sequence: sequence = myVal.vin[index];
      if (sequence.sequence === undefined) {
        throw 'invalid txid';
      }
      // needs to be lower than 0xfffffffe
      if (!(sequence.sequence < parseInt('0xfffffffe', 16))) {
        throw 'Not flagging for RBF';
      }
    }
    const feeRate = (await getFeeSchedule(wallet.config)).immediateFeeRate;
    const obj: Status = myVal.status;
    if (obj.confirmed === true || obj.confirmed === undefined) {
      throw 'Invalid TX | TXID already confirmed';
    }
    // get the current fee
    if (myVal.fee === undefined || myVal.weight === undefined) {
      throw myVal;
    }

    const amount = feeRate * myVal.weight - myVal.fee;
    // It seems like feebump increase is by default 5 sat/b ? todo: check this
    const minFee = (myVal.weight / 4) * 5;
    if (amount < minFee) {
      return Math.round(minFee);
    }
    return Math.round(amount);
  }

  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToText(event.target.value);
    // reset fee, makes everything a bit cleaner
    setFee(0) 
  }
  async function expectedFee(): Promise<void> {
    setFee(await calculateFee());
  }
  //makeshifty-y-y-
  if (toText.length == 64) {
    expectedFee();
  }


  async function send(): Promise<void> {
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
                <Input value={toText} onChange={handleToTextChange} type="text" className="to-text-input" required />
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

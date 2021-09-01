import React, { useEffect } from 'react';
import { Button, Form, FormGroup, Label, Input, FormText, Row, Col, InputGroup } from 'reactstrap';
import { useState } from 'react';
import { wallet, getAllStatuses } from '../state/wallet';
import { toast, ToastContainer } from 'react-toastify';
import * as hi from 'moneypot-lib';
import Claimed from 'moneypot-lib/dist/status/claimed';

interface Backup {
  [key: string]: string;
}

export default function Backup() {
  const [hidden, setHidden] = useState(true);

  // todo: maybe additonal error handling
  const keypairs = { ...localStorage };
  const recoverJSON = (data: Blob) => {
    const fileReader = new FileReader();
    fileReader.readAsText(data, 'UTF-8');
    fileReader.onload = (data) => {
      if (data.target) {
        if (data.target.result) {
          if (typeof data.target.result === 'string') {
            const json = JSON.parse(data.target.result) as Array<Backup>;
            for (const k in json) {
              localStorage.setItem(k, json[k] as any);
            }
            toast.success('Memos recovered correctly!');
          }
        }
      }
    };
  };

  


  const coinRecovery = () => { 
  // everything is deterministic, so we just take all the claim statuses, take the nonces, take the claimable hash, derive the blinded version, derive the unblinded version, push POD.
  const [coins, setCoins] = useState<{coin: hi.POD.Coin, blindedMessage: string, blindedSig: string, blindNonce: string, keys: string, message: string, signature: hi.POD.Signature, claimableHash: string }[] | undefined>(undefined)
  const [address, setAddress] = useState<string>('');

  const [render, reRender] = useState<boolean>(false)
  
  const [sendType, setSendType] = useState<
    { kind: 'empty' } | { kind: 'error'; message: string } | { kind: 'lightning'; amount: number } | { kind: 'bitcoin' } | { kind: 'bitcoinbip21Invoice' }
  >({ kind: 'empty' });

  const statuses = getAllStatuses()
  
  // TODO: only do this when triggered, may take a while to load.
  function handleToTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAddress(event.target.value);
  }


  useEffect(() => {
    async function getSendType() {
      if (address === '') {
        setSendType({ kind: 'empty' });
      } else if (address != '') {
        let decodedBitcoinAddress = hi.decodeBitcoinAddress(address);
        if (!(decodedBitcoinAddress instanceof Error)) {
          setSendType({ kind: 'bitcoin' });
          return;
        } else { 
          setSendType({ kind: 'error', message: 'needs to be address' });
        }
      }
    }
    getSendType();
  }, [address]);
  //
  useEffect(() => {
    if (statuses != undefined && sendType.kind === 'bitcoin') {
      reRender(true)
    }
  }, [statuses, sendType])


  useEffect(() => {

    if (address != null) {
      if (sendType.kind === 'bitcoin') { 
        toast.success(`using ${address} to sign!`)
      } 
    }

    if (statuses) { 
      let coinArr = []
      for (let i = 0; i < statuses.length; i++) {
        const element =  statuses[i];
        if (element instanceof Claimed) {  
          for (let i = 0; i < element.blindedReceipts.length; i++) {
            const blindedMessage = element.claimRequest.coinRequests[i].blindedOwner
            const blindedSig = element.blindedReceipts[i]
            const blindNonce = element.claimRequest.coinRequests[i].blindingNonce
            
            const blindingsecret = wallet.config.deriveBlindingSecret(element.claimableHash, blindNonce)
            const newOwner = wallet.config.deriveOwner(element.claimableHash, element.claimRequest.coinRequests[i].blindingNonce)
            const magnitude = element.claimRequest.coinRequests[i].magnitude
            const signer = wallet.config.custodian.blindCoinKeys[magnitude.n]
            const [u, s] = hi.blindMessage(blindingsecret, blindNonce, signer, newOwner.toPublicKey().buffer )
            if (blindedMessage.toPOD() != s.toPOD()) throw 's'
            
            // quick check to verify blinded and unblinded as validly signed
            // we should probably not do this as it takes a good amount of resources when mapping for 1000+ claims
    
            if (!blindedSig.verify(blindNonce, blindedMessage.c, signer)) throw 'invalid blindsig somehow' // impossible
            const coinSig = hi.unblind(u, blindedSig)
            const coin = new hi.Coin(newOwner.toPublicKey(), magnitude, coinSig)
            if (!coin.receipt.verify(newOwner.toPublicKey().buffer,  wallet.config.custodian.blindCoinKeys[magnitude.n])) throw 'invalid unblinded coin somehow' // impossible
    
            const priv = hi.PrivateKey.fromBytes(blindingsecret)
            if (priv instanceof Error) throw priv

            // just take the address from string...
            const message = hi.Buffutils.fromString(address)
            const signature = hi.Signature.compute(message, newOwner)
            if (!signature.verify(message, newOwner.toPublicKey())) throw signature

            // the only thing really needed is the blindedmessage + blinded sig the custodian can find the claimable hash, nonces themselves etc.
            coinArr.push({coin: coin.toPOD(), blindedMessage: blindedMessage.toPOD(), blindedSig: blindedSig.toPOD(), blindNonce: blindNonce.toPOD(), keys: priv.toPOD(), message: address, signature: signature.toPOD(), claimableHash: element.claimableHash.toPOD()})
          }
        }
      }
      setCoins(coinArr)
    }

 
  }, [render])


return (
  <span>
    <hr/>
  <p>
    Download a backup which contains all the unblinded and blinded coins and their keys. Note: Only do this when the custodian has been breached! This will allow you to prove ownership of the coins.
  </p>
  <Row>
            <Col sm={{ size: 2, offset: 0 }}>
              <p className="address-title">Add your address!</p>
            </Col>
            <Col sm={{ size: 9, offset: 0 }}>
              <InputGroup>
              <Input value={address} onChange={handleToTextChange} type="text" className="to-text-input" required />
             
              </InputGroup>
              <br/>
              <p>This is the address where your recovered funds will be sent to. Please choose it carefully.</p>
              <br />
              <Button
    color="secondary"
    href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(coins))}`}
    download={`moneypot_coin_recover_${new Date()}.json`}
  >
    Download my coins.
  </Button>
            </Col>
          </Row>
  {<br />} {<br />}
  <p>
    <b>Note:</b> Unlike a seed, you will need to continuously back up new coins. Subsequently, anyone with these keys will be able to link your in and outputs together. Already-spent coins will be included.
  </p>
</span>
)}

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target != null && event.target.files != null) {
      toast.success('Upload successful!');
      recoverJSON(event.target.files[0]);
    }
  }

  return (
    <div>
      <ToastContainer />
      <h5 className="main-header">Backup</h5>
      <div className="inner-container">
        <p>A sufficient backup consists of your wallet mnemonic and the right custodian URL. (and optionally, if applicable, the original password.) </p>
        <span>
          {hidden ? '' : <pre style={{ height: '4vw' }}>{JSON.stringify(wallet.config.toDoc().mnemonic, null, 2)}</pre>}{' '}
          {hidden ? (
            <Button color="secondary" onClick={() => setHidden(false)}>
              Show me my mnemonic!
            </Button>
          ) : (
            <Button color="secondary" onClick={() => setHidden(true)}>
              Hide my mnemonic!
            </Button>
          )}
        </span>
        {<br />} {<br />}
        <p>Custodian URL:</p>
        <span>
          <pre>{JSON.stringify(wallet.config.toDoc().custodianUrl, null, 2)}</pre>
        </span>
        <span>
          <p>
            Download a backup which contains all the wallet-specific user-specified data, which you can use to recover your memos in the event of data loss or
            other failure.
          </p>
          <Button
            color="secondary"
            href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(keypairs))}`}
            download={`moneypot_memos_${new Date()}.json`}
          >
            Download my Memos.
          </Button>
          {<br />} {<br />}
          <p>
            <b>Note:</b> A single backup is sufficient for all the wallets used <b>only</b> on this particular browser. Unlike a seed, you will need to
            continuously back up new memos.
          </p>
        </span>
        {coinRecovery()}
        <span>
          <Form>
            <FormGroup>
              <Label for="uploadMemos">Recover my local storage</Label>
              <Input type="file" name="file" id="uploadMemos" onChange={handleFileUpload} />
              <FormText color="muted">Please upload the JSON backup of your Localstorage.</FormText>
            </FormGroup>
          </Form>
        </span>
        {<br />} {<br />}
        <a href="https://www.moneypot.com/faq/" target="_blank" rel="noreferrer">
          Frequently Asked Questions
        </a>
      </div>
    </div>
  );
}

import React from 'react';
import { Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';
import { useState } from 'react';
import { wallet } from '../state/wallet';
import { toast, ToastContainer } from 'react-toastify';

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
    fileReader.onload = data => {
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
            Download a backup which contains all the wallet-specific user-specified data, which you can use to recover your memos and settings in the event of
            data loss or other failure.
          </p>
          <Button
            color="secondary"
            href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(keypairs))}`}
            download={`moneypot_memosandsettings_${new Date()}.json`}
          >
            Download my Memos & Settings.
          </Button>
          {<br />} {<br />}
          <p>
            <b>Note:</b> A single backup is sufficient for all the wallets used <b>only</b> on this particular browser. Unlike a seed, you will need to
            continuously back up new memos and settings.
          </p>
        </span>
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

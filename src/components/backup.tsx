import React from 'react';
import { Button } from 'reactstrap';
import { useState } from 'react';
import { wallet } from '../state/wallet';

export default function Backup() {
  const [hidden, setHidden] = useState(true);

  return (
    <div>
      <h5>Backup</h5>
      <div className="inner-container">
        <p>
          A sufficient backup consists of your wallet mnemonic and the right custodian URL. (and optionally, if applicable, the
          original password.){' '}
        </p>
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
        {<br />} {<br />}
        <a href="https://www.moneypot.com/faq/" target="_blank" rel="noreferrer">
          Frequently Asked Questions
        </a>
      </div>
    </div>
  );
}

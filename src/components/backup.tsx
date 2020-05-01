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
        <p>A sufficient backup consists of your wallet seed & the custodian URL. </p>
        <span>
          {hidden ? '' : <pre style={{ height: '4vw' }}>{JSON.stringify(wallet.config.toDoc().mnemonic, null, 2)}</pre>}{' '}
          {hidden ? (
            <Button color="secondary" onClick={() => setHidden(false)}>
              Show me my Seed!
            </Button>
          ) : (
            <Button color="secondary" onClick={() => setHidden(true)}>
              Hide seed!
            </Button>
          )}
        </span>
        {<br />} {<br />}
        <p>Custodian URL:</p>
        <span>
          <pre>{JSON.stringify(wallet.config.toDoc().custodianUrl, null, 2)}</pre>
        </span>
        {<br />} {<br />}
        <a href="https://www.moneypot.com/faq/" target="_blank">
          Frequently Asked Questions
        </a>
      </div>
    </div>
  );
}
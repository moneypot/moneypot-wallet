import React, { useState } from 'react';
import { wallet } from '../state/wallet';
import { Button } from 'reactstrap';

export default function() {
  const [hidden, setHidden] = useState(true);
  if (!wallet.config) {
    return <span>Wallet is not loaded..</span>;
  }

  return (
    <div>
      <h1>Config</h1>
      <p>Please note that this will show sensitive data.</p>
      <span>
        {hidden ? '' : <pre style={{ width: '85vw' }}>{JSON.stringify(wallet.config.toDoc(), null, 2)}</pre>}{' '}
        {hidden ? (
          <Button color="secondary" onClick={() => setHidden(false)}>
            I'm aware, show me.
          </Button>
        ) : (
          <Button color="secondary" onClick={() => setHidden(true)}>
            Hide!
          </Button>
        )}
      </span>
    </div>
  );
}

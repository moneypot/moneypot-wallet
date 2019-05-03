import React from 'react';

import { wallet } from '../state/wallet';

export default function() {
  if (!wallet.config) {
    return <span>Wallet is not loaded..</span>;
  }

  return (
    <div>
      <h1>Config</h1>
      <code>
        <pre style={{ width: '85vw' }}>{JSON.stringify(wallet.config.toDoc(), null, 2)}</pre>
      </code>
    </div>
  );
}

import React from 'react';

import { wallet } from '../state/wallet';

export default function() {
  return (
    <div>
      <h1>Config</h1>
      <code>
        <pre style={{ width: '85vw' }}>{JSON.stringify(wallet.config, null, 2)}</pre>
      </code>
    </div>
  );
}

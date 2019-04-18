import React from 'react';

import { wallet, useHookouts } from '../state/wallet';

import * as Docs from '../wallet/docs';

export default function Hookins() {
  const hookouts = useHookouts();

  return (
    <div>
      <h1>Hookouts ( {hookouts.length} )</h1>
      {hookouts.map(hookout => (
        <Hookout key={hookout.hash} hookoutDoc={hookout} />
      ))}
    </div>
  );
}

function Hookout({ hookoutDoc }: { hookoutDoc: Docs.Hookout }) {
  return (
    <div style={{ border: '1px solid black' }}>
      <code>
        <pre>{JSON.stringify(hookoutDoc, null, 2)}</pre>
      </code>
    </div>
  );
}

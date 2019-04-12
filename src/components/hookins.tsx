import React from 'react';

import wallet, { useHookins, useClaimStatus } from '../state/wallet';

import * as Docs from '../wallet/docs';

export default function Hookins() {
  const hookins = useHookins();

  return (
    <div>
      <h1>Hookins ( {hookins.length} )</h1>
      {hookins.map(hookin => (
        <Hookin key={hookin.hash} hookinDoc={hookin} />
      ))}
    </div>
  );
}

function Hookin({ hookinDoc }: { hookinDoc: Docs.Hookin }) {
  const spentStatus = useClaimStatus(hookinDoc.hash);

  function renderSpentStatus() {
    if (spentStatus === 'LOADING') {
      return <span>loading...</span>;
    } else if (spentStatus === 'UNCOLLECTED') {
      return <button onClick={() => wallet.claimHookin(hookinDoc)}>Collect</button>;
    } else {
      return (
        <span>
          Spent by <code>{spentStatus.claimRequest.claim}</code>
        </span>
      );
    }
  }

  return (
    <div style={{ border: '1px solid black' }}>
      <code>
        <pre>{JSON.stringify(hookinDoc, null, 2)}</pre>
      </code>
      {renderSpentStatus()}
    </div>
  );
}

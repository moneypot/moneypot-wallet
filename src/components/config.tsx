import React from 'react';

import { useConfig } from '../state/wallet';

export default function() {
  const config = useConfig();

  if (!config) {
    return <span>Loading...</span>;
  }

  return (
    <div>
      <h1>Config</h1>
      <code>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </code>
    </div>
  );
}

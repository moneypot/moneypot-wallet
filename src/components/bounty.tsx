import React from 'react';

import { Link, RouteComponentProps } from 'react-router-dom';

import { useBounty } from '../state/wallet';

export default function Bounty(props: RouteComponentProps<{ hash: string }>) {
  const hash = props.match.params.hash;

  const bounty = useBounty(hash);

  return (
    <div>
      <h3>Bounty {hash}</h3>
      <code>
        <pre>{JSON.stringify(bounty, null, 2)}</pre>
      </code>
    </div>
  );
}

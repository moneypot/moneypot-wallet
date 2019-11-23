import React from 'react';
import { RouteComponentProps } from 'react-router';

import * as hi from 'moneypot-lib';

import * as Docs from '../wallet/docs';
import { useClaimableKinds } from '../state/wallet';
import HookinsTable from './hookins-table';

export default function(props: RouteComponentProps<{ hash: string }>) {
  const hookins = useClaimableKinds('Hookin');

  if (hookins === 'LOADING') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>All Hookins</h1>
      <HookinsTable hookins={hookins as (Docs.Claimable & hi.POD.Hookin)[]} />
    </div>
  );
}

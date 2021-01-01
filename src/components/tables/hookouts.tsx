import React from 'react';
import { RouteComponentProps } from 'react-router';

import * as hi from 'moneypot-lib';

import * as Docs from '../../wallet/docs';
import { useClaimableKinds } from '../../state/wallet';
import HookoutsTable from './hookouts-table';

export default function (props: RouteComponentProps<{ hash: string }>) {
  const hookouts = useClaimableKinds('Hookout');

  if (hookouts === 'LOADING') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Hookouts ({hookouts.length})</h1>
      <HookoutsTable hookouts={hookouts as (Docs.Claimable & hi.POD.Hookout)[]} />
    </div>
  );
}

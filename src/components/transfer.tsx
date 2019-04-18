import React from 'react';
import { RouteComponentProps } from 'react-router';
import * as hi from 'hookedin-lib';
import * as Docs from '../wallet/docs';

import { wallet, useTransfer, useBountyOrHookout, useBounty, useHookout } from '../state/wallet';

function RenderTransfer({ transfer }: { transfer: Docs.Transfer }) {

  const output = useBountyOrHookout(transfer.outputHash);
  const change = useBounty(transfer.changeHash);

  return (
    <div>
      <h1>Transfer {transfer.hash}</h1>
      <strong>Input amount: </strong> {getInputAmount(transfer)} satoshis
      <br />
      {transfer.status.kind === 'PENDING' && (
        <span>
          <button
            onClick={() => {
              wallet.discardTransfer(transfer);
            }}
          >
            Discard
          </button>{' '}
          |{' '}
          <button
            onClick={() => {
              wallet.finalizeTransfer(transfer);
            }}
          >
            Finalize
          </button>
        </span>
      )}
      <hr />
      <strong>Output: </strong>
      <pre>
        <code>{JSON.stringify(output, null, 2)}</code>
      </pre>
      <hr />
      <strong>Change: </strong>
      <pre>
        <code>{JSON.stringify(change, null, 2)}</code>
      </pre>
      <hr />
      <pre>
        <code>{JSON.stringify(transfer, null, 2)}</code>
      </pre>
    </div>
  );
}

export default function Transfer(props: RouteComponentProps<{ hash: string }>) {
  const transferHashStr = props.match.params.hash;
  const transferHash = hi.Hash.fromPOD(transferHashStr);

  if (transferHash instanceof Error) {
    return <h1>Error invalid transfer hash: {transferHash.message}</h1>;
  }

  const transfer = useTransfer(transferHashStr);

  if (transfer === 'LOADING') {
    return <div>Loading transfer: {transferHashStr}</div>;
  }

  if (transfer === 'NOT_FOUND') {
    return <div>Could not find transfer: {transferHashStr}</div>;
  }

  return <RenderTransfer transfer={transfer} />;
}

function getInputAmount(transfer: Docs.Transfer) {
  let amount = 0;
  for (const input of transfer.inputs) {
    amount += 2 ** input.magnitude;
  }
  return amount;
}

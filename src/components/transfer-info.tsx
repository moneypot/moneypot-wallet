import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import * as hi from 'hookedin-lib';
import * as Docs from '../wallet/docs';

import { wallet, useTransfer, useHookout, useClaimStatus } from '../state/wallet';
import { notError } from '../util';

import { HookoutTable } from './hookout-info';

function RenderTransfer({ transfer }: { transfer: Docs.Transfer }) {
  const output = useHookout(transfer.outputHash);
  const spentStatus = useClaimStatus(transfer.hash);

  let changeButton;
  if (spentStatus == 'UNCOLLECTED') {
    changeButton = (
      <button
        onClick={() => {
          const t = notError(hi.Transfer.fromPOD(transfer));
          wallet.claimChange(t);
        }}
      >
        Collect Change
      </button>
    );
  } else if (spentStatus == 'LOADING') {
    changeButton = 'checking...';
  } else {
    changeButton = (
      <span>
        Collected by <Link to={`/claim-responses/${spentStatus.hash}`}>{spentStatus.hash}</Link>
      </span>
    );
  }

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
      <h1>Hookout</h1>
      {output && output !== 'LOADING' && <HookoutTable hookout={output} />}
      <hr />
      <strong>Change: </strong>
      <pre>
        <code>{JSON.stringify(transfer.change, null, 2)}</code>
      </pre>
      {changeButton}
      <hr />
      <pre>
        <code>{JSON.stringify(transfer, null, 2)}</code>
      </pre>
    </div>
  );
}

export default function TransferInfo(props: RouteComponentProps<{ hash: string }>) {
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

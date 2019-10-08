import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import * as hi from 'hookedin-lib';

import { wallet, useClaimable, useClaimableStatuses } from '../state/wallet';
import { notError } from '../util';

export default function ClaimableInfo(props: RouteComponentProps<{ hash: string }>) {
  const hash = props.match.params.hash;

  const claimableDoc = useClaimable(hash);

  if (claimableDoc === 'LOADING') {
    return <div>{claimableDoc}</div>;
  }
  if (claimableDoc === undefined) {
    return <div>not found</div>;
  }

  let claimable: hi.Claimable | hi.Acknowledged.Claimable;
  if (claimableDoc.acknowledgement) {
    claimable = notError(hi.Acknowledged.claimableFromPOD(claimableDoc));
  } else {
    claimable = notError(hi.claimableFromPOD(claimableDoc));
  }


  let ackStatus = () => {
    if (claimable instanceof hi.Acknowledged.default) {
      return (
        <span>
          Acknowledged: <code>{ claimable.acknowledgement.toPOD() }</code>
        </span>
      );
    }

    let x: hi.Claimable = claimable;

    return (
      <button
        onClick={() => {
          wallet.acknowledgeClaimable(x);
        }}
      >
        Claim
      </button>
    );
  };

  return (
    <div>
      <h1>Kind: {claimableDoc.kind}</h1>
      <hr />
      {ackStatus()}
      <button onClick={ () => {
        wallet.discardClaimable(claimableDoc.hash);
        props.history.push('/claimables');
      }}>Discard!</button>
      <hr />
  { claimable instanceof hi.Acknowledged.default && <ShowStatuses claimable={claimable} claimableHash={claimableDoc.hash} /> }
      <hr />
      <h3>Raw Claimable</h3>
      <div>
        <pre>
          <code>{JSON.stringify(claimableDoc, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}

function ShowStatuses({ claimable, claimableHash }: { claimable: hi.Acknowledged.Claimable; claimableHash: string }) {
  const statuses = useClaimableStatuses(claimableHash);
  if (!statuses) {
    return <span>Loading statuses...</span>;
  }

  const claimableAmount = hi.computeClaimableRemaining(claimable.contents, statuses);

  return (
    <div>
      <h2>Statuses ({statuses.length})</h2>
      <ul>
        {statuses.map(s => {

          const obj = hi.statusToPOD(s);

          return <li key={s.hash().toPOD()}>
            <div>
              { obj.kind }:
              <code>
                <pre style={ { height: '100px', overflow: 'auto' } }>{JSON.stringify(obj, null, 2) }</pre>
              </code>
            </div>
          </li>

        })}
      </ul>
      <button onClick={() => wallet.requestStatuses(claimableHash)}>Check for status updates</button>
      <button onClick={() => wallet.claimClaimable(claimable)}>Claim {claimableAmount} sats</button>
    </div>
  );
}

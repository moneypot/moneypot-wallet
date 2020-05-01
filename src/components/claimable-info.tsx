import React from 'react';
import { RouteComponentProps } from 'react-router';
import LightningInvoice from './lightning-invoice';
import DevDataDisplay from './dev-data-display';

import * as hi from 'moneypot-lib';

import { wallet, useClaimable, useClaimableStatuses } from '../state/wallet';
import { notError } from '../util';
import { Link } from 'react-router-dom';
import StatusStuff from './StatusStuff';

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
          Acknowledged: <code>{claimable.acknowledgement.toPOD()}</code>
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

  let kindOfClaimable = () => {
    if (claimableDoc.kind === 'LightningInvoice') {
      return <LightningInvoice paymentRequest={claimableDoc.paymentRequest} created={claimableDoc.created} memo="deposit" claimableHash={claimableDoc.hash} />;
    }
    if (claimableDoc.kind === 'Hookout' || claimableDoc.kind === 'Hookin' || claimableDoc.kind === 'FeeBump') {
      return (
        <React.Fragment>
          <StatusStuff
            claimableHash={claimableDoc.hash}
            amount={claimableDoc.amount}
            created={claimableDoc.created}
            kind={claimableDoc.kind}
            claimable={claimable.toPOD()}
          ></StatusStuff>
          <button
            onClick={() => {
              wallet.discardClaimable(claimableDoc.hash);
              props.history.push('/claimables');
            }}
          >
            Discard!
          </button>
          {<br />}
          {<br />}
        </React.Fragment>
      );
    }
  };

  return (
    <div>
      {kindOfClaimable()}
      {claimable instanceof hi.Acknowledged.default && <ShowStatuses claimable={claimable} claimableHash={claimableDoc.hash} />}
      <DevDataDisplay title="Raw Claimable">{claimableDoc}</DevDataDisplay>
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
    <div id="status">
      <h6>Statuses ({statuses.length})</h6>
      <ul>
        {statuses.map(s => {
          const obj = hi.statusToPOD(s);

          return (
            <DevDataDisplay title={'Status - ' + obj.kind} key={s.hash().toPOD()}>
              {obj}
            </DevDataDisplay>
          );
        })}
      </ul>
      <button className="btn btn-light" onClick={() => wallet.claimClaimable(claimable)}>
        Claim {claimableAmount} sats
      </button>{' '}
      <button className="btn btn-light" onClick={() => wallet.requestStatuses(claimableHash)}>
        Check for status updates
      </button>{' '}
      <Link to="/feebump-send">
        <button className="btn btn-secondary">Feebump this transaction!</button>
      </Link>
    </div>
  );
}

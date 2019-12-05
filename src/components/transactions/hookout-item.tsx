import React from 'react';
import { Link } from 'react-router-dom';
import * as mp from 'moneypot-lib';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';

import * as Docs from '../../wallet/docs';
import Timeago from '../../util/timeago';

type Props = {
  statuses: mp.Status[] | undefined;
  claimable: Docs.Claimable;
};

export default function HookoutItem({ claimable, statuses }: Props) {
  if (claimable.kind !== 'Hookout') {
    throw new Error('expected hookout');
  }

  let status = 'not yet sent';
  if (statuses === undefined) {
    status = '';
  } else {
    for (const s of statuses) {
      if (s instanceof BitcoinTransactionSent) {
        status = 'sent!';
      }
    }
  }

  return (
    <Link to={`claimables/${claimable.hash}`} className="transaction-card Hookout">
      <div className="text-muted">
        <Timeago date={claimable.created} />
      </div>
      <div>
        <span className="fa-stack">
          <i className="fas fa-circle fa-stack-2x" />
          <i className={'fad fa-stack-1x fa-inverse fa-arrow-up'} />
        </span>
        <span>
          Bitcoin Send
          <br /> ( {claimable.bitcoinAddress} ){' '}
        </span>
      </div>
      <div>-{claimable.amount} satoshis</div>
      <div>{status}</div>
    </Link>
  );
}

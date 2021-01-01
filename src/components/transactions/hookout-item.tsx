import React from 'react';
import { Link } from 'react-router-dom';
import * as mp from 'moneypot-lib';
import BitcoinTransactionSent from 'moneypot-lib/dist/status/bitcoin-transaction-sent';

import * as Docs from '../../wallet/docs';
import Timeago from '../../util/timeago';
import Failed from 'moneypot-lib/dist/status/failed';

type Props = {
  statuses: mp.Status[] | undefined;
  claimable: Docs.Claimable;
  isMobile: boolean;
};

export default function HookoutItem({ claimable, statuses, isMobile }: Props) {
  if (claimable.kind !== 'Hookout') {
    throw new Error('expected hookout');
  }
  const fetchedMemo = localStorage.getItem(claimable.hash);

  let status = 'not yet sent';
  if (statuses === undefined) {
    status = '';
  } else {
    for (const s of statuses) {
      if (s instanceof BitcoinTransactionSent) {
        status = 'sent!';
      }
      if (s instanceof Failed) {
        status = 'Failed!';
      }
    }
  }

  return (
    <Link to={`claimables/${claimable.hash}`} className="transaction-card Hookout">
      {isMobile ? undefined : (
        <div className="text-muted">
          <Timeago date={claimable.created} />
        </div>
      )}
      <div>
        <span className="fa-stack">
          <i className="fas fa-circle fa-stack-2x" />
          <i className={'fad fa-stack-1x fa-inverse fa-arrow-up'} />
        </span>
        <span>
          Bitcoin Send
          <br /> ( {isMobile ? fetchedMemo : claimable.bitcoinAddress} ){' '}
        </span>
      </div>
      <div>-{claimable.amount} satoshis</div>
      <div>{status}</div>
    </Link>
  );
}

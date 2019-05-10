import React from 'react';
import { RouteComponentProps } from 'react-router';
import { wallet, useHookin } from '../state/wallet';

export default function HookinInfo(props: RouteComponentProps<{ hash: string }>) {
  const hash = props.match.params.hash;

  const hookinDoc = useHookin(hash);

  if (typeof hookinDoc === 'string') {
    return <div>{hookinDoc}</div>;
  }

  return (
    <div>
      <pre>
        <code>{JSON.stringify(hookinDoc, null, 2)}</code>
      </pre>
    </div>
  );
}

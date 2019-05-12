import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { wallet, useHookin } from '../state/wallet';

export default function HookinInfo(props: RouteComponentProps<{ hash: string }>) {
  const hash = props.match.params.hash;

  const hookinDoc = useHookin(hash);

  if (typeof hookinDoc === 'string') {
    return <div>{hookinDoc}</div>;
  }

  return (
    <div>
      <table className="table">
        <tbody>
          <tr>
            <th>hash</th>
            <td>
              <Link to={`/hookins/${hookinDoc.hash}`}>{hookinDoc.hash}</Link>
            </td>
          </tr>
          <tr>
            <th>bitcoin address</th>
            <td>
              <Link to={`/addresses/bitcoin/${hookinDoc.bitcoinAddress}`}>{hookinDoc.bitcoinAddress}</Link>
            </td>
          </tr>
          <tr>
            <th>amount</th>
            <td>{hookinDoc.amount} sat</td>
          </tr>
          <tr>
            <th>tx</th>
            <td>
              <a href={`https://blockstream.info/testnet/tx/${hookinDoc.txid}?output:${hookinDoc.vout}`} target="_blank" >{hookinDoc.txid}:{hookinDoc.vout}</a>
            </td>
          </tr>
        </tbody>
      </table>
      <hr/>
      <h3>Raw Hookin</h3>
      <div>
        <pre>
          <code>{JSON.stringify(hookinDoc, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
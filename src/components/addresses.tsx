import React from 'react';

import { wallet, useAllInboundAddresses } from '../state/wallet';

import { Link } from 'react-router-dom';

export default function Addresses() {
  const allAddresses = useAllInboundAddresses();

  return (
    <div>
      <table className="table">
        <tbody>
          {allAddresses.map(address => {
            return (
              <tr key={address.address}>
                <td>
                  <Link to={`/addresses/${address.kind}/${address.address}`}>{address.address}</Link>
                </td>
                <td>{address.created.toISOString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

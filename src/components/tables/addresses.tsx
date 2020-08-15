import React from 'react';
import { useBitcoinAddresses } from '../../state/wallet';
import { Link } from 'react-router-dom';

export default function Addresses(props: any) {
  const allAddresses = useBitcoinAddresses();

  return (
    <div>
      <div className="address-table">
        <div>
          <div>Address</div>
          <div>Memo</div>
          <div>Created</div>
        </div>
        {allAddresses.map(address => {
          return (
            <div key={address.address}>
              <div>
                <Link to={`/addresses/${address.address}`}>{address.address}</Link>
              </div>
              <div>{localStorage.getItem(address.address)}</div>
              <div>{address.created.toISOString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

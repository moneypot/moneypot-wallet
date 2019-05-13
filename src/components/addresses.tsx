import React from 'react';
import { useAllInboundAddresses } from '../state/wallet';
import { Link } from 'react-router-dom';
import './addresses.scss';
import { Badge } from 'reactstrap';

export default function Addresses(props: any) {
  const allAddresses = useAllInboundAddresses();

  if (props.selection) {
    return (
      <div>
        <div className="address-table">
          <div>
            <div>Address</div>
            <div>Created</div>
          </div>
          {allAddresses.map(address => {
            if (address.kind === props.selection) {
              return (
                <div key={address.address}>
                  <div>
                    <Link to={`/addresses/${address.kind}/${address.address}`}>{address.address}</Link>
                    {'  '}
                    <Badge color={address.kind === 'direct' ? 'primary' : 'secondary'}>{address.kind}</Badge>
                  </div>
                  <div>{address.created.toISOString()}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="address-table">
        <div>
          <div>Address</div>
          <div>Created</div>
        </div>
        {allAddresses.map(address => {
          return (
            <div key={address.address}>
              <div>
                <Link to={`/addresses/${address.kind}/${address.address}`}>{address.address}</Link>
                {'  '}
                <Badge color={address.kind === 'direct' ? 'primary' : 'secondary'}>{address.kind}</Badge>
              </div>
              <div>{address.created.toISOString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

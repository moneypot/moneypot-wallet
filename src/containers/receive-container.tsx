import React from 'react';
import './receive-container.scss';
import { Nav, NavItem } from 'reactstrap';

import { Link } from 'react-router-dom';

export default function ReceiveContainer(props: any) {
  const selection = props.page;

  return (
    <div className="receive-container">
      <Nav tabs fill>
        <NavItem>
          <Link className={selection === 'bitcoin' ? 'active nav-link' : 'nav-link'} to="/receive/bitcoin">
            Receive Bitcoin
          </Link>
        </NavItem>
        <NavItem>
          <Link className={selection === 'direct' ? 'active nav-link' : 'nav-link'} to="/receive/direct">
            Receive Direct
          </Link>
        </NavItem>
      </Nav>
      <div className="inner">{props.children}</div>
    </div>
  );
}

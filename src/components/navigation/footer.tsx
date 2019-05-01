import React from 'react';

import { Link } from 'react-router-dom';
import './top-bar.css';

export default function Footer(props: any) {
  return (
    <div>
      Advanced/Debug: <Link to="/transfers">Transfers</Link> | <Link to="/bounties">Bounties</Link> | <Link to="/coins">Coins</Link> |{' '}
      <Link to="/hookins">Hookins</Link> | <Link to="/config">Config</Link> | <Link to="/hookouts">Hookouts</Link>
    </div>
  );
}

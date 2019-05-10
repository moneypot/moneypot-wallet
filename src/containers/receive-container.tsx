import React, { useState } from 'react';
import './receive-container.scss';
import { Nav, NavItem, Row, Col } from 'reactstrap';
import ReceiveBitcoin from '../components/receive/bitcoin';
import ReceiveDirect from '../components/receive/direct';

import { BrowserRouter, HashRouter, Route, Switch, Link, Redirect } from 'react-router-dom';
const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

export default function ReceiveContainer(props: any) {
  const [selectedTab, setSelectedTab] = useState('bitcoin');

  function toggle(selection: any) {
    console.log('selection is: ', selection);
    setSelectedTab(selection);
  }

  return (
    <Router>
      <div className="receive-container">
        <Nav tabs fill>
          <NavItem>
            <Link
              className={selectedTab === 'bitcoin' ? 'active nav-link' : 'nav-link'}
              to="/receive/bitcoin"
              onClick={() => {
                toggle('bitcoin');
              }}
            >
              Receive Bitcoin
            </Link>
          </NavItem>
          <NavItem>
            <Link
              className={selectedTab === 'direct' ? 'active nav-link' : 'nav-link'}
              to="/receive/direct"
              onClick={() => {
                toggle('direct');
              }}
            >
              Receive Direct
            </Link>
          </NavItem>
        </Nav>
        <div className="inner">
          <Switch>
            <Route path="/receive" exact render={() => <Redirect to="/receive/bitcoin" />} />
            <Route path="/receive/bitcoin" component={ReceiveBitcoin} />
            <Route path="/receive/direct" component={ReceiveDirect} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

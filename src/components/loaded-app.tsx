import React from 'react';

import Splash from './splash/splash';
import BitcoinAddressInfo from './bitcoin-address-info';
import DirectAddressInfo from './direct-address-info';
import ReceiveBitcoin from './receive/bitcoin';
import ReceiveDirect from './receive/direct';

import { BrowserRouter, HashRouter, Route, Switch, RouteComponentProps, Redirect } from 'react-router-dom';

import Send from './send';
import Hookins from './hookins';
import Addresses from './addresses';
import Transfers from './transfers';
import Bounty from './bounty';
import Bounties from './bounties';
import Coins from './coins';
import Transfer from './transfer';
import Config from './config';
import Hookouts from './hookouts';

import './loaded-app.scss';
import TopBar from './navigation/top-bar';
import Navbar from './navigation/navbar';
import MainContainer from '../containers/main-container';
import Footer from './navigation/footer';
import Page from './page';
import useWindowSize from '../window-size';
import History from './history';
import HookinInfo from './hookin-info';
function NoMatch(params: RouteComponentProps<any>) {
  return (
    <div>
      <h3>
        No match for <code>{params.location.pathname}</code>
      </h3>
    </div>
  );
}

const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

export default function LoadedApp() {
  let windowSize = useWindowSize();
  console.log('window size is: ', windowSize);
  let mobileView = windowSize.innerWidth < 576;
  const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;
  return (
    <Router>
      <div className="App-wrapper">
        <TopBar isMobile={mobileView} />
        {!mobileView ? <Navbar isMobile={mobileView} /> : ''}
        <MainContainer>
          <Switch>
            <Route path="/create-wallet" exact render={() => <Redirect to="/" />} />
            <Route path="/" exact component={Splash} />
            <Route path="/receive/bitcoin" render={props => <ReceiveBitcoin {...props} />} />
            <Route path="/receive/direct" render={props => <ReceiveDirect {...props} />} />
            <Route path="/addresses/bitcoin/:address" component={BitcoinAddressInfo} />
            <Route path="/addresses/direct/:address" component={DirectAddressInfo} />

            <Route path="/addresses" component={Addresses} />
            <Route path="/send" component={Send} />
            <Route path="/hookins/:hash" component={HookinInfo} />
            <Route path="/hookins" component={Hookins} />
            <Route path="/hookouts" component={Hookouts} />
            <Route path="/transfers/:hash" component={Transfer} />
            <Route path="/transfers" component={Transfers} />
            <Route path="/bounties/:hash" component={Bounty} />
            <Route path="/bounties" component={Bounties} />
            <Route path="/coins" component={Coins} />
            <Route path="/config" component={Config} />
            <Route path="/contact" render={props => <Page page="Contact" />} />
            <Route path="/support" render={props => <Page {...props} page="Support" />} />
            <Route path="/history" component={History} />
            <Route component={NoMatch} />
          </Switch>
        </MainContainer>
        {mobileView ? (
          <Navbar isMobile={mobileView} />
        ) : (
          <div className="App-footer">
            <Footer />
          </div>
        )}
      </div>
    </Router>
  );
}

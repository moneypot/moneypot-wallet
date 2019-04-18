import React, { useContext } from 'react';

import Splash from './splash/splash';
import BitcoinAddressInfo from './bitcoin-address-info';
import ReceiveBitcoin from './receive/bitcoin';
import ReceiveDirect from './receive/direct';

import { BrowserRouter, HashRouter, Route, Switch, RouteComponentProps, Link, Redirect } from 'react-router-dom';
import Send from './send';

import Hookins from './hookins';
import BitcoinAddresses from './bitcoin-addresses';
import Transfers from './transfers';
import Bounties from './bounties';
import Coins from './coins';
import Transfer from './transfer';
import Config from './config';
import Hookouts from './hookouts';
import { useBalance } from '../state/wallet';

import './loaded-app.scss';
import TopBar from './navigation/top-bar'
import Navbar from './navigation/navbar'
import MainContainer from '../containers/main-container'
import Page from './page'
import useWindowSize from '../window-size'
import SelectWallet from "./select-wallet";

function NoMatch(params: RouteComponentProps<any>) {
  return (
    <div>
      <h3>
        No match for <code>{params.location.pathname}</code>
      </h3>
    </div>
  );
}
export default function LoadedApp() {
  let windowSize = useWindowSize();
  console.log('window size is: ',windowSize)

  const balance = useBalance();

  const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

  return (



    <Router>
      <div className="App-wrapper">
        <header className="App-header">
          <TopBar />
          <Navbar />
        </header>
        <MainContainer>
          <Switch>
            <Route path="/create-wallet" exact render={()=> <Redirect to="/"/>}/>
            <Route path="/create-read" component={BitcoinAddressInfo} />
            <Route path="/" exact component={Splash} />
            <Route path="/bitcoin-address-info/:id" component={BitcoinAddressInfo} />
            <Route path="/receive/bitcoin" component={ReceiveBitcoin} />
            <Route path="/receive/direct" component={ReceiveDirect} />
            <Route path="/addresses/bitcoin" component={BitcoinAddresses} />
            <Route path="/send" component={Send} />
            <Route path="/hookins" component={Hookins} />
            <Route path="/hookouts" component={Hookouts} />
            <Route path="/transfers/:hash" component={Transfer} />
            <Route path="/transfers" component={Transfers} />
            <Route path="/bounties" component={Bounties} />
            <Route path="/coins" component={Coins} />
            <Route path="/config" component={Config} />
            <Route path="/contact" render={props => <Page page="Contact" />} />
            <Route path="/about" render={props => <Page {...props} page="About" />} />
            <Route component={NoMatch} />
          </Switch>
        </MainContainer>
        <div className="App-footer">
          <div>
            Advanced/Debug: <Link to="/transfers">Transfers</Link> | <Link to="/bounties">Bounties</Link> | <Link to="/coins">Coins</Link> |{' '}
            <Link to="/hookins">Hookins</Link> | <Link to="/config">Config</Link> | <Link to="/hookouts">Hookouts</Link>
          </div>
        </div>
      </div>
    </Router>
  );
}

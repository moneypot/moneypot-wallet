import React from 'react';

import BitcoinAddressInfo from './tables/bitcoin-address-info';
import ReceiveBitcoin from './receive/receive';
import { BrowserRouter, HashRouter, Route, Switch, RouteComponentProps, Redirect } from 'react-router-dom';

import Send from './send/send';
import Hookins from './tables/hookins';
import Addresses from './tables/addresses';
import Coins from './tables/coins';
import Config from './config';
import Hookouts from './tables/hookouts';
import TopBar from './navigation/top-bar';
import Navbar from './navigation/navbar';
import Footer from './navigation/footer';
import Page from './page';
import useWindowSize from '../window-size';
import Transactions from './transactions/transactions';
import ClaimableInfo from './statuses/claimable-info';
import LightningInvoice from './statuses/lightning-invoice-statuses';
import Support from './support';
import ReceiveLightning from './receive/lightning';
import FeebumpSend from './send/feebump-send';
import Backup from './backup';
import Settings from './settings';
import Faq from './faq';
import Invoices from './tables/invoices';
import Payments from './tables/payments';
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
  // console.log('window size is: ', windowSize);
  let mobileView = windowSize.innerWidth < 576;
  const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <div className="App-wrapper">
        <TopBar isMobile={mobileView} />
        {!mobileView ? <Navbar isMobile={mobileView} /> : ''}
        <div className="main-container">
          <Switch>
            <Route path="/create-wallet" exact render={() => <Redirect to="/" />} />
            <Route path="/" exact component={Transactions} />
            <Route path="/receive" exact component={ReceiveBitcoin} />
            <Route path="/backup" exact component={Backup} />
            <Route path="/faq" exact component={Faq} />
            <Route path="/receive/lightning" exact component={ReceiveLightning} />
            <Route path="/addresses/:address" component={BitcoinAddressInfo} />
            <Route path="/addresses" component={Addresses} />
            <Route path="/send" exact component={Send} />
            <Route path="/feebump-send" exact component={FeebumpSend} />
            <Route path="/claimables/:hash" component={ClaimableInfo} />
            <Route path="/lightning-invoice/:hash" component={LightningInvoice} />
            <Route path="/hookins" component={Hookins} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/payments" component={Payments} />
            <Route path="/hookouts" component={Hookouts} />
            <Route path="/coins" component={Coins} />
            <Route path="/config" component={Config} />
            <Route path="/settings" exact component={Settings} />
            <Route path="/contact" render={props => <Page {...props} page="Contact" />} />
            <Route path="/support" render={props => <Support />} />
            <Route component={NoMatch} />
          </Switch>
          {!mobileView ? (
            <div className="App-footer">
              <Footer />
            </div>
          ) : (
            ''
          )}
        </div>
        {mobileView ? <Navbar isMobile={mobileView} /> : ''}
      </div>
    </Router>
  );
}

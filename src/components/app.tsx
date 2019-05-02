import React, { useState, useEffect } from 'react';
import LoadedApp from './loaded-app';
import Dexie from 'dexie';
import CreateWallet from './create-wallet';
import SelectWallet from './select-wallet';
import { BrowserRouter, HashRouter, Route, Switch, RouteComponentProps, Link } from 'react-router-dom';
const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;
import { library } from '@fortawesome/fontawesome-svg-core';

import * as icons from '@fortawesome/free-solid-svg-icons';
library.add(
  icons.faCheck,
  icons.faChevronRight,
  icons.faLink,
  icons.faExchangeAlt,
  icons.faTimes,
  icons.faPlus,
  icons.faPlusCircle,
  icons.faArrowRight,
  icons.faCircle
);

export default function App() {
  const [existingDbs, setExistingDbs] = useState<string[] | null>(null);
  useEffect(() => {
    Dexie.getDatabaseNames().then(dbs => {
      setExistingDbs(dbs);
    });
  }, []);

  const [isWalletSet, setIsWalletSet] = useState<boolean>(false);

  if (isWalletSet) {
    return <LoadedApp />;
  }
  if (!existingDbs) {
    return <p>Loading...</p>;
  }
  if (existingDbs.length < 1) {
    return <CreateWallet setIsWalletSet={setIsWalletSet} />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/create-wallet" exact render={props => <CreateWallet {...props} setIsWalletSet={setIsWalletSet} />} />
        <Route render={props => <SelectWallet {...props} setIsWalletSet={setIsWalletSet} />} />
      </Switch>
    </Router>
  );
}

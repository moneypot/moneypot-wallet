import React, { useState, useEffect } from 'react';
import LoadedApp from './loaded-app';
import CreateWallet from './create-wallet';
import SelectWallet from './select-wallet';
import { BrowserRouter, HashRouter, Route, Switch } from 'react-router-dom';
import * as dbInfo from '../wallet/database-info';
const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

export default function App() {
  const [existingDbs, setExistingDbs] = useState<string[] | null>(null);
  useEffect(() => {
    dbInfo.list().then(dbs => {
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

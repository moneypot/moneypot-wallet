import React, { useState, useEffect } from 'react';
import LoadedApp from './loaded-app';
import CreateWallet from './start-pages/create-wallet';
import SelectWallet from './start-pages/select-wallet';
import { BrowserRouter, HashRouter, Route, Switch } from 'react-router-dom';
import Restore from './start-pages/restore-wallet';
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
  if (existingDbs.length < 1 && window.location.pathname !== "/restore") {
    return <CreateWallet setIsWalletSet={setIsWalletSet} />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/create-wallet" exact render={props => <CreateWallet {...props} setIsWalletSet={setIsWalletSet} />} />
        <Route path="/restore" exact render={props => <Restore {...props} setIsWalletSet={setIsWalletSet} />} />
        <Route render={props => <SelectWallet {...props} setIsWalletSet={setIsWalletSet} />} />
      </Switch>
    </Router>
  );
}

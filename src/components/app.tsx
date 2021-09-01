import React, { useState, useEffect } from 'react';
import LoadedApp from './loaded-app';
import CreateWallet from './start-pages/create-wallet';
import SelectWallet from './start-pages/select-wallet';
import { BrowserRouter, HashRouter, Route, Switch } from 'react-router-dom';
import Restore from './start-pages/restore-wallet';
import * as dbInfo from '../wallet/database-info';
import useWindowSize from '../window-size';
const Router: any = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

export default function App() {
  let windowSize = useWindowSize(); // this can be received from loa
  let mobileView = windowSize.innerWidth < 576;

  const [existingDbs, setExistingDbs] = useState<string[] | null>(null);
  const [hasIDB, sethasIDB] = useState<boolean | undefined>(undefined);
  useEffect(() => {

    // we can also just catch the list instead of another function...? todo
    dbInfo.list().then((dbs) => {
      setExistingDbs(dbs);
    });
    dbInfo.tryIDB().then(b => sethasIDB(b))
  }, []);

  const [isWalletSet, setIsWalletSet] = useState<boolean>(false);

  if (isWalletSet) {
    return <LoadedApp />;
  }
  if (!existingDbs && hasIDB != undefined) { 
    if (!hasIDB) {
      return <p>Indexeddb is not working. Are you perhaps using the TOR browser or the incognito functionality of your browser? if so, please switch these off!</p>
    }
  }
  if (!existingDbs) {
    return <p>Loading...</p>;
  }
  if (existingDbs.length < 1 && window.location.pathname !== '/restore') {
    return <CreateWallet setIsWalletSet={setIsWalletSet} />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/create-wallet" exact render={(props) => <CreateWallet {...props} isMobile={mobileView} setIsWalletSet={setIsWalletSet} />} />
        <Route path="/restore" exact render={(props) => <Restore {...props} isMobile={mobileView} setIsWalletSet={setIsWalletSet} />} />
        <Route render={(props) => <SelectWallet {...props} isMobile={mobileView} setIsWalletSet={setIsWalletSet} />} />
      </Switch>
    </Router>
  );
}

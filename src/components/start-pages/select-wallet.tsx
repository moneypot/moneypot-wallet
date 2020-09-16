import React, { useState, useEffect } from 'react';
import WalletDatabase from '../../wallet/database';
import { setWallet } from '../../state/wallet';
import { Link } from 'react-router-dom';
import { Button, FormGroup, Input, Col } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import LeftPanel from './left-panel';

import * as dbInfo from '../../wallet/database-info';

export default function SelectWallet(props: any & { isMobile: boolean }) {
  const [existingDbs, setExistingDbs] = useState<string[]>([]);
  useEffect(() => {
    dbInfo.list().then(dbNames => {
      setExistingDbs(dbNames);

      if (dbNames.indexOf('autoload') !== -1) {
        loadWallet('autoload', '');
      }
    });
  }, []);

  async function loadWallet(walletName: string, password: string) {
    const db = await WalletDatabase.open(walletName, password);
    if (typeof db === 'string' || db instanceof Error) {
      toast.error('Oops! ' + db);
      console.error(db);
      return;
    }

    setWallet(db);
    props.setIsWalletSet(true);
  }

  return (
    <div className="full-page-container">
      <LeftPanel isMobile={props.isMobile} />
      <div className="full-page-right-side">
        <ToastContainer />
        <h2 className="main-heading">Select Wallet</h2>
        <div className="select-wallet-table">
          {existingDbs.map(dbName => (
            <LoadableWallet key={dbName} walletName={dbName} load={loadWallet} />
          ))}
        </div>
        <FormGroup row>
          <Col className="submit-button-container">
            <Link className="btn-moneypot btn btn-success" to="/create-wallet">
              <i className="fa fa-plus-circle" /> Create New
            </Link>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col className="submit-button-container">
            <Link className="btn-moneypot btn btn-success" to="/restore">
              <i className="fa fa-plus-circle" /> Restore wallet
            </Link>
          </Col>
        </FormGroup>
      </div>
    </div>
  );
}

function LoadableWallet({ walletName, load }: { walletName: string; load: (walletName: string, password: string) => void }) {
  const [password, setPassword] = useState('');

  return (
    <div>
      <div>{walletName}</div>
      <div>
        <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="text" name="walletName" required />
      </div>
      <div className="select-wallet-button">
        <Button onClick={() => load(walletName, password)} className="btn-moneypot-sm btn btn-primary">
          Load <i className="fa fa-arrow-right" />
        </Button>
      </div>
    </div>
  );
}

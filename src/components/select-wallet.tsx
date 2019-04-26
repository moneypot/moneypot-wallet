import React, { useState, useEffect } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from '../state/wallet';
import Dexie from 'dexie';
import { Link } from 'react-router-dom';
import FullPageContainer from '../containers/full-page-container'
import { Button, Form, FormGroup, Label, Input, Col } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './select-wallet.scss'
export default function SelectWallet(props: any) {
  const [existingDbs, setExistingDbs] = useState<string[]>([]);
  useEffect(() => {
    Dexie.getDatabaseNames().then(dbs => {
      setExistingDbs(dbs);

      if (dbs.indexOf('autoload') !== -1) {
        loadWallet('autoload', '');
      }
    });
  }, []);

  async function loadWallet(walletName: string, password: string) {
    const db = new WalletDatabase(walletName);
    const err = await db.unlock(password);
    if (err) {
      toast.error('Oops! ' + err.message);
      console.error(err.message);
      return;
    }

    setWallet(db);
    props.setIsWalletSet(true);
  }

  return (
    <FullPageContainer>
      <ToastContainer />
      <h2 className='main-heading'>Select Wallet</h2>
      <div className="select-wallet-table">
      {existingDbs.map(dbName => (
          <LoadableWallet key={dbName} walletName={dbName} load={loadWallet} />
        ))}
      </div>
        <FormGroup row>
          <Col className="submit-button-container">
            <Link className="btn-hookedin btn btn-success" to="/create-wallet">
              <FontAwesomeIcon icon="plus-circle"/> Create New
            </Link>
          </Col>
        </FormGroup>
    </FullPageContainer>
  );
}

function LoadableWallet({ walletName, load }: { walletName: string; load: (walletName: string, password: string) => void }) {
  const [password, setPassword] = useState('');

  return (
        <div>
          <div>{walletName}</div>
          <div>
            <Input value={password}
                   onChange={e => setPassword(e.target.value)}
                   placeholder="Password" type="text" name="walletName"
                   required />
          </div>
          <div>
            <Button
              onClick={() => load(walletName, password)}
              className="btn-hookedin-sm btn btn-primary"
            >
              Load{' '}
              <FontAwesomeIcon icon="arrow-right"/>
            </Button>
          </div>
        </div>
  );
}




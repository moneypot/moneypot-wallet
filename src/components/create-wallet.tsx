import React, { useState } from 'react';
import WalletDatabase from '../wallet/database';
import { setWallet } from '../state/wallet';
import FullPageContainer from '../containers/full-page-container';
import './create-wallet.scss';
import { Button, Form, FormGroup, Label, Input, Col } from 'reactstrap';

export default function CreateWallet(props: any) {
  const [walletName, setWalletName] = useState('main');
  const [network, setNetwork] = useState('tBTC');
  const [password, setPassword] = useState('');

  async function createWallet() {
    const db = await WalletDatabase.create(walletName, password);
    if (db instanceof Error) {
      alert(db.message);
      return;
    }
    setWallet(db);
    props.setIsWalletSet(true);
    console.log('wallet created: ', walletName);
  }
  return (
    <FullPageContainer>
      <h2 className="main-heading">Create New Wallet</h2>
      <div className="create-wallet-form-container">
        <Form>
          <FormGroup row>
            <Label for="walletName" sm={3}>
              Name
            </Label>
            <Col sm={{ size: 8, offset: 1 }}>
              <Input value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="Name" type="text" name="walletName" required />
            </Col>
          </FormGroup>
          <FormGroup row>
            <legend className="col-form-label col-sm-3">Network</legend>
            <Col sm={{ size: 8, offset: 1 }}>
              <FormGroup check>
                <Label check>
                  <Input value="tBTC" onChange={e => setNetwork(e.target.value)} type="radio" name="network" checked={network === 'tBTC'} /> tBTC
                </Label>
              </FormGroup>
              <FormGroup check>
                <Label check>
                  <Input value="BTC" onChange={e => setNetwork(e.target.value)} type="radio" name="network" checked={network === 'BTC'} /> BTC
                </Label>
              </FormGroup>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="password" sm={3}>
              Password
            </Label>
            <Col sm={{ size: 8, offset: 1 }}>
              <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" name="password" />
            </Col>
          </FormGroup>
          <FormGroup row>
            <Col className="submit-button-container">
              <Button color="success" className="btn-hookedin" onClick={createWallet}>
                Create Wallet
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </div>
    </FullPageContainer>
  );
}

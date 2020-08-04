import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Form, Label, Input, Col, InputGroup, InputGroupAddon } from 'reactstrap';
import { wallet } from '../state/wallet';

export default function Settings() {
  const [Setting1, setSetting1] = useState(false);
  const updateOne = () => setSetting1(!Setting1);

  const [Setting2, setSetting2] = useState(false);
  const [amountInput, setAmountInput] = useState(wallet.config.gapLimit);
  const updateTwo = () => setSetting2(!Setting2);

  const [Setting3, setSetting3] = useState(false);
  const updateThree = () => setSetting3(!Setting3);

  const [Setting4, setSetting4] = useState(false);
  const updateFour = () => setSetting4(!Setting4);

  const [Setting5, setSetting5] = useState(false);
  const updateFive = () => setSetting5(!Setting5);

  useEffect(() => {
    const hasSettings = async () => {
      if (localStorage.getItem(`${wallet.db.name}-setting1-hasNested`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting1-hasNested`) === 'true') {
          setSetting1(true);
        } else setSetting1(false);
      }
      if (localStorage.getItem(`${wallet.db.name}-setting2-hasCustomGapLimit`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting2-hasCustomGapLimit`) === 'true') {
          const amount = localStorage.getItem(`${wallet.db.name}-setting2-CustomGapLimit`);
          if (amount != null) {
            setAmountInput(Number(amount));
            setSetting2(true);
          }
        } else {
          setSetting2(false);
          if (wallet.config.gapLimit != 10) {
            // this session
            wallet.config.gapLimit = 10;
            // change config indexeddb
            const walletConfig = await wallet.db.get('config', 1);
            if (walletConfig === undefined) {
              return new Error('Invalid config?');
            }
            walletConfig.gapLimit = 10;
            wallet.db.put('config', walletConfig);
          }
        }
      }
      if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) === 'true') {
          setSetting3(true);
        } else setSetting3(false);
      }
      if (localStorage.getItem(`${wallet.db.name}-setting4-hasPTM`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting4-hasPTM`) === 'true') {
          setSetting4(true);
        } else setSetting4(false);
      }
      if (localStorage.getItem(`${wallet.db.name}-setting5-hasSyncWorkers`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting5-hasSyncWorkers`) === 'true') {
          setSetting5(true);
        } else setSetting5(false);
      }
    };
    hasSettings();
  }, []);

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const applysettings = async () => {
    if (Setting1 === true) {
      localStorage.setItem(`${wallet.db.name}-setting1-hasNested`, 'true');
      wallet.resetAddresses();
    } else if (Setting1 === false) {
      localStorage.setItem(`${wallet.db.name}-setting1-hasNested`, 'false');
      wallet.resetAddresses();
    }
    if (Setting2 == true) {
      // inputField doesn't allow for non-numbers, still, to prevent people from somehow bricking their wallets..
      if (!Number.isFinite(amountInput)) {
        throw `${amountInput} is not a valid number`;
      }

      localStorage.setItem(`${wallet.db.name}-setting2-hasCustomGapLimit`, 'true');
      localStorage.setItem(`${wallet.db.name}-setting2-CustomGapLimit`, amountInput.toString());

      // change config for current session
      wallet.config.gapLimit = Number(amountInput);
      // change config indexeddb
      const walletConfig = await wallet.db.get('config', 1);
      if (walletConfig === undefined) {
        return new Error('Invalid config?');
      }
      walletConfig.gapLimit = Number(amountInput);
      wallet.db.put('config', walletConfig);
    } else if (Setting2 === false) {
      localStorage.setItem(`${wallet.db.name}-setting2-hasCustomGapLimit`, 'false');
      if (wallet.config.gapLimit != 10) {
        // this session
        wallet.config.gapLimit = 10;
        // change config indexeddb
        const walletConfig = await wallet.db.get('config', 1);
        if (walletConfig === undefined) {
          return new Error('Invalid config?');
        }
        walletConfig.gapLimit = 10;
        wallet.db.put('config', walletConfig);
      }
    }
    if (Setting3 === true) {
      localStorage.setItem(`${wallet.db.name}-setting3-hasRBF`, 'true');
    } else if (Setting3 === false) {
      localStorage.setItem(`${wallet.db.name}-setting3-hasRBF`, 'false');
    }
    if (Setting4 === true) {
      localStorage.setItem(`${wallet.db.name}-setting4-hasPTM`, 'true');
    } else if (Setting4 === false) {
      localStorage.setItem(`${wallet.db.name}-setting4-hasPTM`, 'false');
    }
    if (Setting5 === true) {
      localStorage.setItem(`${wallet.db.name}-setting5-hasSyncWorkers`, 'true');
    } else if (Setting5 === false) {
      localStorage.setItem(`${wallet.db.name}-setting5-hasSyncWorkers`, 'false');
    }
  };

  return (
    <React.Fragment>
      <div>
        <h5>Settings</h5>
        <div className="inner-container">
          <p>
            Within Moneypot, there are a number of settings you can change. <br /> <br /> For example, if your current wallet does not support sending to native
            segwit (These start with bc1..), you can also use nested segwit (These start with 3...){' '}
          </p>
          <small>
            We do recommend you use to use native segwit as it greatly reduces fees for both parties!{' '}
            <span role="img" aria-label="wink">
              😉
            </span>
          </small>
          <br />
          <br />
          <hr />
          <Form>
            <FormGroup check>
              <Label check>
                <Input id="setting1" type="checkbox" onChange={updateOne} checked={Setting1} /> Switch to P2SH-P2WPKH addresses. (3...).
                <p>
                  <b>Note:</b> you should only do this if you have not yet received any Ƀ in this particular wallet!
                  {<br />} You can only sync 1 address type simultaneously.
                </p>
              </Label>
              <br />
              <hr />

              <Label check>
                <Input id="setting2" type="checkbox" onChange={updateTwo} checked={Setting2} /> Increase the gaplimit by "..." retroactively.
                <p>
                  <b>Note:</b> Unless you're scanning addresses for funds (merchant activity), it is not recommended to enable and or change this option, as it
                  will just put unnecessary strain on your local resources when syncing.
                  <br />
                </p>
                <InputGroup>
                  <InputGroupAddon addonType="prepend"></InputGroupAddon>
                  <Input placeholder={amountInput.toString()} min={0} max={-1} type="number" step="1" onChange={e => setAmountInput(Number(e.target.value))} />
                </InputGroup>
                <small>Default gaplimit = 10.</small>
              </Label>
              <br />
              <hr />
              <Label check>
                <Input id="setting3" type="checkbox" onChange={updateThree} checked={Setting3} /> Disable RBF when sending immediate transactions by default.
                <p>
                  <b>Note:</b> you will be unable to feebump it. A usecase for this would be if you wanted to use 0-conf at any exchange, shop, or casino.
                </p>
              </Label>
              <br />
              <hr />
              <Label check>
                <Input id="setting4" type="checkbox" onChange={updateFour} checked={Setting4} /> Enable pay-to-many transactions.
                <p>
                  <b>Note:</b> If you want to send multiple hookouts simultaneously.
                  <br />
                  <small>
                    e.g <code>2NGZrVvZG92qGYqzTLjCAewvPZ7JE8S8VxE, 10000;</code> (denominated in satoshis, priority = batched!)
                  </small>
                </p>
              </Label>
              <br />
              <hr />
              <Label check>
                <Input id="setting5" type="checkbox" onChange={updateFive} checked={Setting5} /> Enable multi-threading for specific parts regarding syncing the
                wallet. (Experimental!)
                <p>
                  <b>Note:</b> We recommend you only use this option in high-latency environments, and or in combination with large wallets (1000+ coins). It
                  can cause your browser to crash(!). for users with a decent connection the difference might not be notable.
                </p>
              </Label>
              <br />
            </FormGroup>
            <hr />
            <Button
              className="btn btn-secondary"
              onClick={() => {
                toggle();
              }}
            >
              Save Changes <i className="fad fa-save" />
            </Button>
          </Form>
        </div>
      </div>

      <Modal isOpen={modal} toggle={toggle} className="someModal">
        <ModalHeader toggle={toggle}>Applying Settings.... Brrrt.</ModalHeader>
        <ModalBody>
          Are you sure you want to apply these settings? for example, switching to P2SH-P2WPKH addresses will result in higher consolidation fees when hooking
          in!
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              toggle();
              applysettings();
            }}
          >
            I understand..
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
}

import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Form, Label, Input } from 'reactstrap';
import { wallet } from '../state/wallet';

export default function Settings(props: any) {
  const [Setting1, setSetting1] = useState(false);
  const updateOne = () => setSetting1(!Setting1);
  // we will add a setting 2 if necessary later on.
  const [Setting3, setSetting3] = useState(false);
  const updateThree = () => setSetting3(!Setting3);
  useEffect(() => {
    const hasSettings = () => {
      if (localStorage.getItem(`${wallet.db.name}-setting1-hasNested`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting1-hasNested`) === 'true') {
          setSetting1(true);
        } else setSetting1(false);
      }
      if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting3-hasRBF`) === 'true') {
          setSetting3(true);
        } else setSetting3(false);
      }
    };
    hasSettings();
  }, []);

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const applysettings = () => {
    if (Setting1 === true) {
      localStorage.setItem(`${wallet.db.name}-setting1-hasNested`, 'true');
      wallet.resetAddresses();
    } else if (Setting1 === false) {
      localStorage.setItem(`${wallet.db.name}-setting1-hasNested`, 'false');
      wallet.resetAddresses();
    }
    if (Setting3 === true) {
      localStorage.setItem(`${wallet.db.name}-setting3-hasRBF`, 'true');
    } else if (Setting3 === false) {
      localStorage.setItem(`${wallet.db.name}-setting3-hasRBF`, 'false');
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
            We do recommend you use bech32 (native segwit) addresses as it greatly reduces fees!{' '}
            <span role="img" aria-label="wink">
              😉
            </span>
          </small>
          <br />
          <br />
          <Form>
            <FormGroup check>
              <Label check>
                <Input id="setting1" type="checkbox" onChange={updateOne} checked={Setting1} /> Switch to P2SH-P2WPKH address format. (3...).
                <p>
                  <b>Note:</b> you should only do this if you have not yet received any Ƀ in this particular wallet! 
                 {<br/>} You can only sync 1 address type simultaneously.
                </p>
              </Label>
              <br />
              {/* setting 2- */}
              <Label check>
                <Input id="setting1" type="checkbox" onChange={updateThree} checked={Setting3} /> Disable RBF when sending immediate transactions by default.
                <p>
                  <b>Note:</b> you will be unable to feebump it. A usecase for this would be if you wanted to use 0-conf at any exchange, shop, or casino.
                </p>
              </Label>
            </FormGroup>
            <br />
            <br />
            <Button
              className="btn btn-secondary"
              onClick={() => {
                toggle();
              }}
            >
              Save Changes{" "}<i className="fad fa-save"/>
            </Button>
          </Form>
        </div>
      </div>

      <Modal isOpen={modal} toggle={toggle} className="someModal">
        <ModalHeader toggle={toggle}>Applying Settings.... Brrrt.</ModalHeader>
        <ModalBody>
          Are you sure you want to apply these settings? for example, switching to P2SH addresses will result in higher consolidation fees when hooking in!
        </ModalBody>
        <ModalFooter>
          <Button color="primary" 
              onClick={() => {
                toggle();
                applysettings();
              }}>
            I understand..
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
}

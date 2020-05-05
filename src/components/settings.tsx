import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Form, Label, Input } from 'reactstrap';
import { wallet } from '../state/wallet';

// humble beginnings.
export default function Settings(props: any) {

  const [Setting1, setSetting1] = useState(false);
  const updateOne = () => setSetting1(!Setting1);
  const [Setting2, setSetting2] = useState(false);
  const updateTwo = () => setSetting2(!Setting2);
  useEffect(() => {
    const hasSettings = () => {
      if (localStorage.getItem(`${wallet.db.name}-hasNested`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-hasNested`) === 'true') {
           setSetting1(true);
        } else setSetting1(false);
      }
      if (localStorage.getItem(`${wallet.db.name}-setting2`) != null) {
        if (localStorage.getItem(`${wallet.db.name}-setting2`) === 'true') {
          setSetting2(true);
        } else setSetting2(false);
      }
    };
    hasSettings()
  }, []);

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const applysettings = () => {
    if (Setting1 === true) {
      localStorage.setItem(`${wallet.db.name}-hasNested`, 'true');
      wallet.resetAddresses()
    } else if (Setting1 === false) {
      localStorage.setItem(`${wallet.db.name}-hasNested`, 'false');
      wallet.resetAddresses()
    }
    if(Setting2 === true) { 
      localStorage.setItem(`${wallet.db.name}-setting2`, 'true');
    } else if(Setting2 === false) {
      localStorage.setItem(`${wallet.db.name}-setting2`, 'false');
    }
  };

  //template, todo
  // switching addresstypes causes the wallet to only sync public keys to the chosen address type. 
  //(todo: sync both? maybe? I don't think we should mix up address types anyway..?)
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
               <p><b>Note:</b> you should only do this if you have not yet received any Ƀ in this particular wallet!</p> 
              </Label> 
              <br/>
              <Label check>
                <Input id="setting2" type="checkbox" onChange={updateTwo} checked={Setting2} /> ...
               <p><b>Note:</b> ...</p> 
              </Label>
            </FormGroup>
            <br />
            <br />
            <Button
              className="btn btn-secondary"
              onClick={() => {
                toggle();
                applysettings();
              }}
            >
              Save Changes
            </Button>
          </Form>
        </div>
      </div>

      <Modal isOpen={modal} toggle={toggle} className="someModal">
        <ModalHeader toggle={toggle}>Applying Settings.... Brrrt.</ModalHeader>
        <ModalBody>Are you sure you want to apply these settings? for example, switching to P2SH addresses will result in higher consolidation fees when hooking in!</ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={toggle}>
            I understand..
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
}

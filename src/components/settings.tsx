import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Form, Label, Input } from 'reactstrap';

// humble beginnings.
export default function Settings(props: any) {
  // get settings before loading component?

  const hasSettings = () => {
    if (localStorage.getItem('hasNested') != null) {
      if (localStorage.getItem('hasNested') === 'true') {
        return true;
      } else return false;
    }
    return false;
  };
  // a plethora of setting states which i guess we just write to localstorage? zzz. bit ugly, will be applied across all wallets in the browser? todo.
  //(note: Is using P2SH addresses even worth the hassle...?)
  const [Setting1, setSetting1] = useState(false);
  const updateOne = () => setSetting1(!Setting1);
  console.log(Setting1);
  const [Setting2, setSetting2] = useState(false);
  const updateTwo = () => setSetting2(!Setting2);
  useEffect(() => {
    setSetting1(hasSettings);
  }, []);

  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  const applysettings = () => {
    if (Setting1 === true) {
      localStorage.setItem('hasNested', 'true');
    } else if (Setting1 === false) {
      localStorage.setItem('hasNested', 'false');
    }
  };

  //template, todo
  return (
    <React.Fragment>
      <div>
        <h5>Settings</h5>
        <div className="inner-container">
          <p>
            Within Moneypot, there are a number of settings you can change. <br /> <br /> For example, if your current wallet does not support sending to native
            segwit (Addresses starting with bc1...), you can also use nested segwit (These start with 3...){' '}
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
                <Input id="setting1" type="checkbox" onChange={updateOne} checked={Setting1} /> Switch newly generated addresses to P2SH-P2WPKH.
              </Label>
            </FormGroup>
            <br />
            <br />
            <Button
              className="btn btn-secondary"
              onClick={() => {
                toggle();
                // remove soon
                applysettings();
              }}
            >
              Submit Changes
            </Button>
          </Form>
        </div>
      </div>

      <Modal isOpen={modal} toggle={toggle} className="someModal">
        <ModalHeader toggle={toggle}>Applying Settings.... Brrrt.</ModalHeader>
        <ModalBody>Are you sure you want to apply these settings?  (todo: modal based on different settings..?))Changing ("""") Might increase the consolidation fees you pay when hooking in!</ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={toggle}>
            I understand..
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
}

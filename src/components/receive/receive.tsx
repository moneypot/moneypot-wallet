import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup, CustomInput } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Addresses from '../addresses';

export default function Receive() {
  const [selection, setSelection] = useState('bitcoin');
  const [noteText, setNoteText] = useState<string | undefined>(undefined);
  function ShowNoteInput() {
    if (noteText === undefined) {
      return;
    }
    return (
      <FormGroup row>
        <Col sm={{ size: 12, offset: 0 }}>
          <Input type="text" value={noteText} placeholder="Optional text" onChange={event => setNoteText(event.target.value)} />
        </Col>
      </FormGroup>
    );
  }
  function handleNoteSelected() {
    setNoteText(noteText === undefined ? '' : undefined);
  }
  return (
    <div>
      <h3>Receive</h3>
      <div className="inner-container" style={{ padding: '5rem 20vw' }}>
        <Form>
          <FormGroup row>
            <Label for="speedSelection" sm={4}>
              Selection:
            </Label>
            <Col sm={{ size: 12, offset: 0 }}>
              <FormGroup
                row
                style={{
                  justifyContent: 'center',
                }}
              >
                <FormGroup check>
                  <Label check>
                    <Input type="radio" name="receiveSelection" value="bitcoin" defaultChecked onChange={event => setSelection(event.target.value)} /> Bitcoin
                  </Label>
                </FormGroup>
                <FormGroup check>
                  <Label check>
                    <Input type="radio" name="receiveSelection" value="direct" onChange={event => setSelection(event.target.value)} /> Direct
                  </Label>
                </FormGroup>
              </FormGroup>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Button color="light" onClick={handleNoteSelected}>
              <FontAwesomeIcon icon="edit" />
              Add Optional Note
            </Button>
          </FormGroup>
          {ShowNoteInput()}
          <FormGroup row>
            <Col className="submit-button-container">
              <Link className="btn btn-success btn-hookedin" to={selection === 'direct' ? '/receive/direct' : '/receive/bitcoin'}>
                Next <FontAwesomeIcon icon="arrow-right" />
              </Link>
            </Col>
          </FormGroup>
        </Form>
      </div>
      <h4>Previously used:</h4>
      <Addresses selection={selection} />
    </div>
  );
}

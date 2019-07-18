import React, { useState } from 'react';
import { Row, Button, FormGroup, Input, Col } from 'reactstrap';

export default function OptionalNote(props: any) {
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
    <Row>
      <Col style={{ marginLeft: '15px' }}>
        <FormGroup row>
          <Button color="light" onClick={handleNoteSelected}>
            <i className={noteText === undefined ? 'fa fa-edit' : 'fa fa-times'} /> {noteText === undefined ? 'Add Optional Note' : 'Remove Note'}
          </Button>
        </FormGroup>
      </Col>
      <Col sm={{ size: 8, offset: 0 }} md={{ size: 9, offset: 0 }}>
        {ShowNoteInput()}
      </Col>
    </Row>
  );
}

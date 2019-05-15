import React, { useState } from 'react';
import { Button, Row, Input, Col } from 'reactstrap';

export default function Note() {
  const [noteText, setNoteText] = useState<string | undefined>(undefined);
  function ShowNoteInput() {
    if (noteText === undefined) {
      return;
    }
    return <Input type="text" value={noteText} placeholder="Optional text" onChange={event => setNoteText(event.target.value)} />;
  }
  function handleNoteSelected() {
    setNoteText(noteText === undefined ? '' : undefined);
  }
  return (
    <Row>
      <Button color="light" onClick={handleNoteSelected}>
        <i className="fa fa-edit" />
        Add Optional Note
      </Button>
      {ShowNoteInput()}
    </Row>
  );
}

import React, { useState } from 'react';
import { Collapse, Button, Card, Row } from 'reactstrap';

const DevDataDisplay = (props: any) => {
  const [collapse, setCollapse] = useState(false);
  const [status, setStatus] = useState('fa-plus');

  const onEntering = () => setStatus('fa-ellipsis-h');

  const onEntered = () => setStatus('fa-minus');

  const onExiting = () => setStatus('fa-ellipsis-h');

  const onExited = () => setStatus('fa-plus');

  const toggle = () => setCollapse(!collapse);

  return (
    <div style={{ marginTop: '1rem'}}>
      <hr/>
      <Row style={{ alignItems: 'center'}}>

        <Button color="secondary" onClick={toggle} style={{ marginBottom: '1rem', marginRight: '1rem' }}><i className={"fal "+status} /></Button>
        <h6>{props.title}</h6>
      </Row>
      <Collapse
        isOpen={collapse}
        onEntering={onEntering}
        onEntered={onEntered}
        onExiting={onExiting}
        onExited={onExited}
      >

        <Card>

             <pre>
          <code>{JSON.stringify(props.children, null, 2)}</code>
        </pre>
        </Card>
      </Collapse>
    </div>
  );
}

export default DevDataDisplay;
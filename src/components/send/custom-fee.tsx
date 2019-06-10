import React, { useState } from 'react';
import { FormGroup, Input, Col, InputGroup, Row } from "reactstrap";
import BitcoinUnitSwitch from './bitcoin-unit-switch'
export default function ShowCustomFeeInput(props: any) {
  const [feeText, setFeeText] = useState('');


  return (
    <div>
    <FormGroup row>
      <Col sm={{ size: 1, offset: 1 }}><p>Fee:</p></Col>
      <Col sm={{ size: 9, offset: 0 }}>
        <InputGroup>
          <Input value={feeText}
                 onChange={event => setFeeText(event.target.value)} />
          <BitcoinUnitSwitch className="fee-units" name="units" valueOne="sat/vbyte" valueTwo="sat/weight"/>
        </InputGroup>
      </Col>
    </FormGroup>
      <Row style={{ justifyContent: 'center'}}>
        <small className="text-muted">This transaction will be sent with ??? sat/byte and a ETA of ? blocks (?0 mins).</small>
      </Row>
    </div>
  );
}

import React, { useState } from 'react';
import { FormGroup, Label, Input, Col, InputGroup } from 'reactstrap';
import BitcoinUnitSwitch from './bitcoin-unit-switch'
export default function ShowCustomFeeInput(props: any) {
  const [feeText, setFeeText] = useState('');


  return (
    <FormGroup row>
      <Label for="feeText" sm={2}>
        Fee:
      </Label>
      <Col sm={8}>
        <InputGroup>
          <Input value={feeText}
                 onChange={event => setFeeText(event.target.value)} />
          <BitcoinUnitSwitch name="units" valueOne="sat/vbyte" valueTwo="sat/weight"/>
        </InputGroup>
      </Col>
      <small className="text-muted">The ETA for this transactions is 3 blocks (30 mins).</small>
    </FormGroup>
  );
}

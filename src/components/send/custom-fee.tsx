import React, { useState } from 'react';
import { Row, Button, Form, FormGroup, Label, Input, Col, InputGroupAddon, InputGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

export default function ShowCustomFeeInput(props: any) {
  const [speedSelection, setSpeedSelection] = useState('fast');
  const [feeText, setFeeText] = useState('');
  const [dropdownOpen, setDropdwonOpen] = useState(false);

  function toggle() {
    setDropdwonOpen(!dropdownOpen);
  }
  return (
    <FormGroup row>
      <Label for="feeText" sm={2}>
        Fee:
      </Label>
      <Col sm={{ size: 4, offset: 0 }}>
        <InputGroup>
          <Input value={feeText} onChange={event => setFeeText(event.target.value)} />
          <InputGroupAddon addonType="append">satoshi</InputGroupAddon>
        </InputGroup>
      </Col>
      <Col sm={{ size: 4, offset: 0 }}>
        <Col sm={{ size: 4, offset: 0 }}>
          <Dropdown isOpen={dropdownOpen} toggle={toggle}>
            <DropdownToggle caret>Confirmation time target</DropdownToggle>
            <DropdownMenu>
              <DropdownItem>20 minutes (2 blocks)</DropdownItem>
              <DropdownItem>40 minutes (4 blocks)</DropdownItem>
              <DropdownItem>60 minutes (6 blocks)</DropdownItem>
              <DropdownItem>2 hours (12 blocks)</DropdownItem>
              <DropdownItem>4 hours (24 blocks)</DropdownItem>
              <DropdownItem>8 hours (48 blocks)</DropdownItem>
              <DropdownItem divider />
              <DropdownItem>24 hours (144 blocks)</DropdownItem>
              <DropdownItem>3 days (504 blocks)</DropdownItem>
              <DropdownItem>7 days (1008 blocks)</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </Col>
      </Col>
    </FormGroup>
  );
}

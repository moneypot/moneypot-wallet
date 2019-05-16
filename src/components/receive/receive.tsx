import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col } from 'reactstrap';
import Addresses from '../addresses';
import './receive.scss';

export default function Receive() {
  const [selection, setSelection] = useState('bitcoin');
  return (
    <div>
      <h3>Receive</h3>
      <div className="inner-container">
        <p>Please select what type of address do you need:</p>
        <div className="receive-radio-buttons-container">
          <input type="radio" id="radioBitcoin" name="receiveSelection" value="bitcoin" defaultChecked onChange={event => setSelection(event.target.value)} />
          <label htmlFor="radioBitcoin">
            <i className="fa fa-check-circle fa-2x checked-icon" />
            <h5>Bitcoin </h5>
            <i className="fab fa-btc fa-2x" />
            <ul>
              <li>regular bitcoin address</li>
              <li>requires to wait for confirmation</li>
            </ul>
          </label>
          <input type="radio" id="radioDirect" name="receiveSelection" value="direct" onChange={event => setSelection(event.target.value)} />
          <label htmlFor="radioDirect">
            <i className="fa fa-check-circle fa-2x checked-icon" />
            <h5>Direct </h5>
            <i className="fal fa-exchange fa-2x" />
            <ul>
              <li>instant (no confirmations required)</li>
              <li>irreversible</li>
              <li>secure</li>
              <li>highly private</li>
              <li>super cheap</li>
              <li>only works with other hookedin wallets</li>
            </ul>
          </label>
        </div>

        <Row>
          <Col className="submit-button-container">
            <Link className="btn btn-success btn-hookedin" to={selection === 'direct' ? '/receive/direct' : '/receive/bitcoin'}>
              Next <i className="fa fa-arrow-right" />
            </Link>
          </Col>
        </Row>
      </div>
      <h4>Previously used:</h4>
      <Addresses selection={selection} />
    </div>
  );
}

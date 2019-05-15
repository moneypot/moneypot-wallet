import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col } from 'reactstrap';
import Addresses from '../addresses';

export default function Receive() {
  const [selection, setSelection] = useState('bitcoin');
  return (
    <div>
      <h3>Receive</h3>
      <div className="inner-container" style={{ padding: '5rem 10vw' }}>
        <p>Selection:</p>
        <div className="custom-radio-buttons-container">
          <input type="radio" id="radioBitcoin" name="receiveSelection" value="bitcoin" defaultChecked onChange={event => setSelection(event.target.value)} />
          <label htmlFor="radioBitcoin">
            <span>Bitcoin </span>
            <i className="fab fa-bitcoin fa-2x" />
            <p>Use the bitcoin network</p>
          </label>
          <input type="radio" id="radioDirect" name="receiveSelection" value="direct" onChange={event => setSelection(event.target.value)} />
          <label htmlFor="radioDirect">
            <span>Direct </span>
            <i className="fa fa-check-circle fa-2x" />
            <p>
              A <b>direct address</b> allows a transaction to be:
            </p>
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

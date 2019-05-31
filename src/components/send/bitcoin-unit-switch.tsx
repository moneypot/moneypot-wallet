import React from 'react';

export default function BitcoinUnitSwitch() {
  return (
    <div className="switch">
      <input type="radio" className="switch-input" name="unit" value="bitcoin" id="bitcoin" defaultChecked />
        <label htmlFor="bitcoin" className="switch-label switch-label-off">btc</label>
        <input type="radio" className="switch-input" name="unit" value="satoshi" id="satoshi" />
          <label htmlFor="satoshi" className="switch-label switch-label-on">sat</label>
          <span className="switch-selection"></span>
    </div>
  );
}

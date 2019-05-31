import React from 'react';

export default function BitcoinUnitSwitch(props: any) {
  return (
    <div className="switch">
      <input type="radio" className="switch-input" name={props.name} value={props.valueOne} id={props.valueOne} defaultChecked />
        <label htmlFor={props.valueOne} className="switch-label switch-label-off">{props.valueOne}</label>
        <input type="radio" className="switch-input" name={props.name} value={props.valueTwo} id={props.valueTwo} />
          <label htmlFor={props.valueTwo} className="switch-label switch-label-on">{props.valueTwo}</label>
          <span className="switch-selection"></span>
    </div>
  );
}

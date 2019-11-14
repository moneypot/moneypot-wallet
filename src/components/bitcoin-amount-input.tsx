import React , { useState } from 'react';

import { Col, FormGroup, Input, InputGroup, Label } from "reactstrap";

type Props = {
                onAmountChange: (x: number) => void;
}

export default function BitcoinAmountInput(props: Props) {
  const [unit, setUnit] = useState<'sat' | 'btc'> ('sat');
  const [text, setText] = useState('');
  const [error, setError] = useState(''); 

  function syncAmount(text: string , unit: 'sat' | 'btc') {
    const val = Number.parseFloat(text);
    if (!Number.isFinite(val) || val < 0) {
      setError( 'Type an amount');
      props.onAmountChange(0);
      return;
    }
    if (unit === 'sat') {
      props.onAmountChange(val);
    }

    else {
      props.onAmountChange(Math.round(val * 1e8));

    }
  }



  function onDisplayAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const amount = e.target.value;
      const re = /^[0-9\b]+$/;
      if (amount === '') {
        setError('Type an amount');
        setText(amount);
        syncAmount(amount, unit);
      }
      if (unit === 'sat' && !re.test(amount)) {
         setError('This is not a valid amount');
         setText(amount);
         syncAmount(amount, unit);
   } else
   {
    setError('');
    setText(amount);
    syncAmount(amount, unit);
   }
   
  }

  function onUnitChange(unit: 'sat' | 'btc') {
    setUnit(unit);

    const oldValue = Number.parseFloat(text);
    if (Number.isNaN(oldValue)) {
      setText('');
      return;
    }

    let newValue;
    if (unit === 'sat') {
      newValue = (oldValue * 1e8).toFixed(0);
    } else {
      newValue = (oldValue / 1e8).toFixed(8);
    }
    setText(newValue);
  }

  

  return (
      <InputGroup>
        <Input type="number" 
        className={error !=='' ? 'is-invalid': ''}
        value={ text } 
        onChange={onDisplayAmountChange} 
        />
        <div className='switch'>
          <input type="radio"
                 className="switch-input"
                 name="unit"
                 value="sat"
                 id="sat"
                 onChange={() => {onUnitChange('sat')}}
                 defaultChecked
          />
          <label htmlFor="sat" className="switch-label switch-label-off">
            sat
          </label>
          <input type="radio"
                 className="switch-input"
                 name="unit"
                 value="btc"
                 id="btc"
                 onChange={() =>{ onUnitChange('btc') }}
          />
          <label htmlFor="btc" className="switch-label switch-label-on">
            btc
          </label>
          <span className="switch-selection"/>
        </div>
        <div className="is-errored-text">
      {error}
        </div>
      </InputGroup>
  );
}



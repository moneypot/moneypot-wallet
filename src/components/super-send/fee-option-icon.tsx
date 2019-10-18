import React from 'react';

type Props = {
  selection: 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE',
  onSelectionChanged: (v: 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE') => void
};



export default function FeeOptionIcon({ selection, onSelectionChanged }: Props) {


  function capitalizeFLetter() {
    return selection[0].toUpperCase() + selection.slice(1).toLowerCase();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value as 'CUSTOM' | 'IMMEDIATE' | 'BATCH' | 'FREE';
    onSelectionChanged(v)
  }

    return (
      <div>
        <input type="radio"
               id={"radio" + capitalizeFLetter()}
               name="speedSelection"
               value={selection}
               defaultChecked={content[selection].defaultChecked}
               onChange={onChange}
               />
        <label htmlFor={"radio" + capitalizeFLetter()}>
          <i className="fa fa-check-circle fa-2x checked-icon"/>
          <h5>{selection}</h5>
          <i className={"fal fa-2x fa-"+content[selection].icon}/>
          <p>{content[selection].text}</p>
          <p>{content[selection].textSecond}</p>

        </label>
      </div>
    );
  }


const content = {
  'IMMEDIATE': {
    icon: 'dragon',
    text: 'time waits for no one',
    textSecond: '',
    defaultChecked: true
  },
  'BATCH': {
    icon: 'alicorn',
    text: 'choose your fee',
    textSecond: 'fast ~1 hr',
    defaultChecked: false
  },
  'FREE': {
    icon: 'unicorn',
    text: 'Minimum 0.01 btc',
    textSecond: 'slow ~ 1 week',
    defaultChecked: false
  },
  'CUSTOM': {
    icon: 'wand-magic',
    text: 'choose your fee',
    textSecond: '',
    defaultChecked: false
  },
}
import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import './splash.css';

import monkey from './monkey.svg';
import monkeyBlind from './monkey-blind.svg';
import monkeyDeaf from './monkey-deaf.svg';
import monkeyMute from './monkey-mute.svg';

export default function Splash() {
  const [logo, setLogo] = useState(monkey);

  const blindProps = { onMouseEnter: () => setLogo(monkeyBlind), onMouseLeave: () => setLogo(monkey) };
  const deafProps = { onMouseEnter: () => setLogo(monkeyDeaf), onMouseLeave: () => setLogo(monkey) };
  const muteProps = { onMouseEnter: () => setLogo(monkeyMute), onMouseLeave: () => setLogo(monkey) };

  return (
    <div className="Splash">
      <header className="Splash-header">
        <img src={logo} className="Splash-logo pulse" alt="logo" />
        <div>
          <Link to="/receive/bitcoin" {...deafProps}>
            Receive
          </Link>{' '}
          /{' '}
          <Link to="/send" {...muteProps}>
            Send
          </Link>{' '}
          /{' '}
          <Link to="/history" {...blindProps}>
            History
          </Link>{' '}
        </div>
      </header>
    </div>
  );
}

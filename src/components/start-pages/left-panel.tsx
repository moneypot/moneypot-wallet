import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Desktop = () => {
  return (
    <div className="full-page-left-side">
      <h1 className="moneypot">
        <i className="fad fa-cauldron logo" /> moneypot{' '}
      </h1>

      <h4>
        A <del>cutting edge</del> revolutionary{' '}
      </h4>
      <h3>bitcoin wallet</h3>
      <p className="secondary-text">supporting lightning payments</p>
    </div>
  );
};

const Mobile = () => {
  return (
    <div className="full-page-left-side">
      <h1 className="moneypot">
        <i className="fad fa-cauldron logo" />{' '}
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          moneypot{' '}
        </Link>
      </h1>
      <br />
    </div>
  );
};

export default function LeftPanel(props: { isMobile: boolean }) {
  return props.isMobile ? Mobile() : Desktop();
}

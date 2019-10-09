import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import './wallet/database';
import './scss/main.scss';
import 'react-toastify/dist/ReactToastify.min.css';

ReactDOM.render(<App />, document.getElementById('root'));
// Check ip
(async () => {
  const response = await fetch('https://ip-checker.moneypot.workers.dev/',
    {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
        "content-type": "application/json",
      }
    }
  );
  const ip = await response.json();
  console.log('You are using Tor: ',ip.countryCode === 'T1');
})();
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import './wallet/database';
import './scss/main.scss';
import 'react-toastify/dist/ReactToastify.min.css';
import { toast } from 'react-toastify';

ReactDOM.render(<App />, document.getElementById('root'));
// Check ip

// lets actually do this directly against the custodian, simplify?
// or third party, so that custodians don't have to set up seperate workers.
// (async () => {
//   const response = await fetch('https://ip-checker.moneypot.workers.dev/', {
//     method: 'GET',
//     headers: {
//       'cache-control': 'no-cache',
//       'content-type': 'application/json',
//     },
//   });

//   // TODO: if it's actually tor, there's a decent chance cloudflare blocks the request?!
//   const ip = await response.json();
//   if (ip.IsTor === true) {
//     toast.success("It looks like you're using tor!");
//   } else {
//     toast.error("Are you sure you're using TOR? You might miss out on additional privacy.");
//   }
//   console.log('You are using Tor: ', ip.countryCode === 'T1');
// })();

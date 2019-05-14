import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Support() {
  return (
    <div>
      <h3>Support</h3>
      <div className="inner-container" style={{ padding: '5rem 20vw' }}>
        <p>You might find the support you need in our website's <a href="https://www.hookedin.com/faq/" target="_blank">Frequently Asked Questions</a>.</p>
        <p>If you still need support, please e-mail us at <a href="mailto:contact@hookedin.com?Subject=Support%20Request">contact@hookedin.com</a> or join
          our <a href="https://t.me/hookedin" target="_blank">Telegram Channel <FontAwesomeIcon icon={['fab', 'telegram']} /></a>


        </p>
      </div>
    </div>
  );
}


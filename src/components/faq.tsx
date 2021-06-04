import React, { useState, useEffect } from 'react';
import { wallet } from '../state/wallet';
import * as Docs from '../wallet/docs';
import { Button } from 'reactstrap';
import Timer from '../util/timer';
import { ToastContainer } from 'react-toastify';

export default function Faq() {
  // copy pasted.

  const [lightninginfo, setlightningInfo] = useState<Docs.LND | null>(null);

  useEffect(() => {
    const getKeys = async () => {
      setlightningInfo(await wallet.requestLightningInfo());
    };
    getKeys();
  }, []);

  const url = (wallet.config.custodian.currency === 'tBTC' ? `https://1ml.com/testnet/node/`: `https://1ml.com/node/`) + (lightninginfo && lightninginfo.identity_pubkey ? lightninginfo.identity_pubkey : undefined);
  return (
    <div>
      <ToastContainer />
      <h5>FAQ and General information</h5>
      {lightninginfo != null ? (
        <div className="inner-container">
          <h4>General information regarding the LND capabilities of this Custodian.</h4>
          <p>
            The current inbound and outbound capacity: <b>{lightninginfo.capacity} sat</b>
          </p>
          <p>
            Of that capacity <b>{lightninginfo.local_balance} sat</b> is Outbound capacity.
          </p>
          <p>
            Of that capacity <b>{lightninginfo.remote_balance} sat</b> is Inbound capacity.
          </p>
          <p>
            Currently number of open channels: <b>{lightninginfo.num_channels}</b>
          </p>
          <p>
            For additional information, it might be possible to check external explorers{' '}
            <a href={url} target="_blank" rel="noreferrer">
              such as 1ML.
            </a>
          </p>
          <small>
            <b> Note:</b> This is just to give you a rough estimate of the amounts you'll be able to transact. Please be aware that actual results may differ
            significantly!
          </small>
        </div>
      ) : undefined}
      <div className="inner-container">
        <h4>Wipe Cycle</h4>
        <p>
          {' '}
          Most custodians will make use of regularly scheduled (3-6-12 months) wipes as part of their business model. While we can't speak for every custodian,
          this will generally be the case. {<br />} The wallet software is geared towards a somewhat generalized standard, so we will include a timer below
          which shows the date of the next wipe, as well as the days remaining. If your custodian does not wipe, you can ignore this section completely.{' '}
        </p>
        <div>
          {wallet.config.custodian.wipeDate ? (
            <div>
              Days until wipe: <Timer p={Date.parse(wallet.config.custodian.wipeDate)}></Timer>
            </div>
          ) : (
            <Button color="danger">
              {' '}
              <i className="fad fa-exclamation-triangle" /> This custodian has not specified a wipe date!
            </Button>
          )}

          {<br />}
          <small>
            <b>Warning!</b> Wipe Times / Timer depicted above may vary and or be inaccurate. Please rely on the signed data given by the custodian!
          </small>
          {<br />}
          {<br />}
          {wallet.config.custodian.wipeDate && (
            <div>
              This custodian will at the very earliest on:{' '}
              <Button color={Date.parse(wallet.config.custodian.wipeDate) - 1000 * 60 * 60 * 24 * 10 > Date.now() ? 'info' : 'danger'}>
                {' '}
                <i className="fad fa-info" /> {wallet.config.custodian.wipeDate}
              </Button>
            </div>
          )}
        </div>
        <p>
          For security, custodians that rollover on a scheduled basis publish a signature using the rollover date as the message. Cheating the date will become
          apparant and proveable.
        </p>
        <small>
          If you don't understand what the above is referring to; Please read our F.A.Q and the business model of an average moneypot custodian. <b>Note:</b>{' '}
          Some custodians may wipe infrequently or not at all. Contact the operators in question for a more detailed answer.
        </small>
      </div>

      {/* TODO (remove maybe?) */}
      <div className="inner-container">
        <h4>Acknowledged</h4>
        {<br />}
        <div>
          {
            // a sig is only pushed to config if it's valid, as per get-custodian-info
            wallet.config.sig ? (
              <Button color="primary">
                <i className="fad fa-check" /> You have correctly verified the custodian info!
              </Button>
            ) : (
              <Button color="danger">
                <i className="fad fa-exclamation-triangle" /> Warning! This wallet has not verified that the current custodian parameters are valid!
              </Button>
            )
          }
        </div>
      </div>
      <div className="inner-container">
        <h4>API</h4>
        {/* <p>
          {' '}
          Moneypot.com also offers certain functionality of the wallet programatically. Interested? Please visit our docs here ...Todo, and view our repository{' '}
          <a href="https://github.com/moneypot/moneypot-api">here</a>
        </p> */}
        <p> This feature is currently not available.</p>
      </div>
    </div>
  );
}

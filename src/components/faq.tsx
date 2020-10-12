import React, { useState, useEffect } from 'react';
import { wallet } from '../state/wallet';
import * as Docs from '../wallet/docs';
import { Button } from 'reactstrap';
import useUniqueId from '../util/use-unique-id';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Faq() {
  // copy pasted.
  const calculateTimeLeft = (year: Date) => {
    if (!year) {
      return;
    }
    const difference = +year - +new Date();
    let timeLeft = {} as TimeLeft;

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [lightninginfo, setlightningInfo] = useState<{ lnd: Docs.LND; lc: Docs.LightningCapacities } | null>(null);
  const [year] = useState<Date | undefined>(wallet.config.custodian.wipeDate === undefined ? undefined : new Date(wallet.config.custodian.wipeDate));
  const [timeLeft, setTimeLeft] = useState<undefined | any>(year === undefined ? undefined : calculateTimeLeft(year));

  useEffect(() => {
    if (wallet.config.custodian.wipeDate) {
      if (year) {
        setTimeout(() => {
          setTimeLeft(calculateTimeLeft(year));
        }, 1000);
      }
    }
  });

  useEffect(() => {
    const getKeys = async () => {
      setlightningInfo(await wallet.requestLightningInfo());
    };
    getKeys();
  }, []);

  let timerComponents: JSX.Element[] = [];
  if (wallet.config.custodian.wipeDate) {
    for (const [key, value] of Object.entries(timeLeft)) {
      timerComponents.push(
        <span key={useUniqueId()}>
          {value} {key}{' '}
        </span>
      );
    }
  }

  let Tcolor;
  if (timeLeft) {
    Tcolor = timeLeft.days > 7 ? 'info' : 'danger';
  }

  const url = 'https://1ml.com/testnet/node/' + (lightninginfo && lightninginfo.lnd.node.pub_key ? lightninginfo.lnd.node.pub_key : undefined);
  return (
    <div>
      <h5>FAQ and General information</h5>
      {lightninginfo != null ? (
        <div className="inner-container">
          <h4>General information regarding the LND capabilities of this Custodian.</h4>
          <p>
            The current inbound and outbound capacity: <b>{lightninginfo.lc.capacity} sat</b>
          </p>
          <p>
            Of that capacity <b>{lightninginfo.lc.localbalance} sat</b> is Outbound capacity.
          </p>
          <p>
            Of that capacity <b>{lightninginfo.lc.remotebalance} sat</b> is Inbound capacity.
          </p>
          <p>
            Currently number of open channels: <b>{lightninginfo.lnd.num_channels}</b>
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
      ) : (
        undefined
      )}
      <div className="inner-container">
        <h4>Wipe Cycle.</h4>
        <p>
          {' '}
          Most custodians will make use of regularly scheduled (6-12 months) wipes as part of their business model. While we can't speak for every custodian,
          this will generally be the case. {<br />} The wallet software is geared towards a somewhat generalized standard, so we will include a timer below
          which shows the date of the next wipe, as well as the days remaining. If your custodian does not wipe, you can ignore this section completely.{' '}
        </p>
        <div>
          {wallet.config.custodian.wipeDate ? (
            <p>
              Days until wipe:{' '}
              <Button color={Tcolor}>
                {' '}
                {(timeLeft.days > 30 && <i className="fad fa-hourglass-start" />) ||
                  (timeLeft.days > 7 && <i className="fad fa-hourglass-half" />) ||
                  (timeLeft.days <= 7 && <i className="fad fa-hourglass-end" />)}{' '}
                {timerComponents.length ? timerComponents : <span>Time's up!</span>}
              </Button>
            </p>
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
            <p>
              This custodian will wipe at the very earliest on:{' '}
              <Button color={Tcolor}>
                {' '}
                <i className="fad fa-info" /> {wallet.config.custodian.wipeDate}
              </Button>
            </p>
          )}
        </div>
        <p>
          For security, custodians that rollover on a scheduled basis publish a signature using the rollover date as the message. Cheating the date will become
          apparant and proveable.
        </p>
        <small>
          If you don't understand what the above is referring to; Please read our F.A.Q and the generalized business model of an average moneypot custodian.{' '}
          <b>Note:</b> Some custodians may wipe infrequently or not at all. Contact the operators in question for a more detailed answer.
        </small>
      </div>

      {/* TODO (remove maybe?) */}
      <div className="inner-container">
        <h4>API</h4>
        <p>
          {' '}
          Moneypot.com also offers certain functionality of the wallet programatically. Interested? Please visit our docs here ...Todo, and view our repository{' '}
          <a href="https://github.com/moneypot/moneypot-api">here</a>
        </p>
      </div>
    </div>
  );
}

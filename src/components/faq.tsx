import React, { useState, useEffect } from 'react';
import { wallet } from '../state/wallet';

//local
export type Node = {
  addresses: any[];
  last_update: number;
  pub_key: string;
  alias: string;
  color: string;
};

export interface lnd {
  channels: any[];
  node: Node;
  num_channels: number;
  total_capacity: number;
}

export interface capacities {
  localbalance: number;
  remotebalance: number;
  capacity: number;
}

export default function Faq() {
  const [publicKey, setpublicKey] = useState('');
  const [lightninginfo, setlightningInfo] = useState<lnd | null>(null);
  const [lndcapacities, setlndcapacities] = useState<capacities | null>(null);

  useEffect(() => {
    const getKeys = async () => {
      await getNodeInfo(await wallet.requestLightingInfo());
      setlndcapacities(await wallet.requestLightningCapacities());
    };
    const getNodeInfo = async (data: string) => {
      setlightningInfo(await wallet.requestLightingNodeInfo(data));
      setpublicKey(data);
    };
    getKeys();
  }, []);

  const url = 'https://1ml.com/testnet/node/' + publicKey;
  return (
    <div>
      <h5>FAQ and General information</h5>
      <div className="inner-container">
        <h4>General information regarding our lightning capacities:</h4>
        <p>
          Our current inbound and outbound capacity: <b>{lightninginfo === null ? '...' : lightninginfo.total_capacity} sat</b>
        </p>
        <p>
          Of that capacity <b>{lndcapacities === null ? 'Loading...' : lndcapacities.localbalance} sat</b> is Outbound capacity.
        </p>
        <p>
          Of that capacity <b>{lndcapacities === null ? 'Loading...' : lndcapacities.remotebalance} sat</b> is Inbound capacity.
        </p>
        <p>
          We currently have <b>{lightninginfo === null ? 'Loading...' : lightninginfo.num_channels}</b> channels open!
        </p>
        <p>
          You can view more information about our node on 1ML,{' '}
          <a href={url} target="_blank" rel="noreferrer">
            please follow this link
          </a>
        </p>
      </div>
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

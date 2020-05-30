import React, { useState, useEffect } from "react";
import { wallet } from "../state/wallet";

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
  const [publicKey, setpublicKey] = useState("");
  const [lightninginfo, setlightningInfo] = useState<lnd>(Object);
  const [lndcapacities, setlndcapacities] = useState<capacities>(Object);
 
  useEffect(() => {
    const getKeys = async () => {
      wallet.requestLightingInfo().then((data) => {
        getNodeInfo(data);
  
      });
      wallet.requestLightningCapacities().then((data) => { 
        setlndcapacities(data)
      })
    };
    const getNodeInfo = async (data: string) => {
      wallet.requestLightingNodeInfo(data).then((response) => {
        setlightningInfo(response);
        setpublicKey(data);
      });
    };
    getKeys();
  }, []);

  const url = "https://1ml.com/testnet/node/" + publicKey;
  return (
    <div>
      <h5>FAQ & General information</h5>
      <div className="inner-container">
        <h4>General information regarding our lightning capacities:</h4>
        <p>
          Our current inbound and outbound capacity:{" "}
          <b>
            {lightninginfo.total_capacity === undefined
              ? "..."
              : lightninginfo.total_capacity}{" "}
            sat
          </b>
        </p>
        <p>
          Of that capacity <b>{lndcapacities.localbalance === undefined ? "...": lndcapacities.localbalance}{" "} sat</b> is Outbound capacity.
        </p>
        <p>
          Of that capacity <b>{lndcapacities.remotebalance === undefined ? "...": lndcapacities.remotebalance }{" "} sat</b> is Inbound capacity.
        </p>
        <p>
          We currently have{" "}
          <b>
            {lightninginfo.num_channels === undefined
              ? "..."
              : lightninginfo.num_channels}
          </b>{" "}
          channels open!
        </p>
        <p>
          You can view more information about our node on 1ML,{" "}
          <a href={url} target="_blank">
            please follow this link
          </a>
        </p>
      </div>
      <div className="inner-container">
        <h4>More stuff</h4>
        <p> &more</p>
      </div>
    </div>
  );
}

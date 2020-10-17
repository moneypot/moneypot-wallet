import * as hi from 'moneypot-lib';

export interface Config {
  one: 1; // for indexing
  claimantGenerator: string;
  custodianUrl: string;
  custodian: hi.POD.CustodianInfo;
  mnemonic: string;
  gapLimit: number;
  sig?: string;
  pubkey?: string;
}

export interface Settings {
  one: 1;
  setting1_hasNested?: boolean;
  setting2_hasCustomGapLimit?: boolean;
  setting3_hasDisabledRBF?: boolean;
  setting4_hasPTM?: boolean;
  setting6_has0conf?: boolean;
  setting7_randomize_recovery?: boolean;
}

export interface Counter {
  index: number;
  purpose: string;
  value: string;
  created: Date;
}

export interface Coin extends hi.POD.Coin {
  hash: string;
  claimableHash: string; // ref's the claim that this coin was created from
  blindingNonce: string; // refs the blinding nonce that was used to create this coin
}

export interface BitcoinAddress {
  address: string; // the actual bitcoin address
  claimant: string; // bech encoded
  created: Date;
}

export type Claimable = hi.POD.Claimable &
  Partial<hi.POD.Acknowledged> & {
    created: Date;
  };

export type Status = hi.POD.Status &
  hi.POD.Acknowledged & {
    hash: string;
    created: Date;
  };

export interface Event {
  id?: number;
  name: string;
}

export interface LND {
  local_balance: number;
  remote_balance: number;
  capacity: number;
  highest_inbound: number;
  highest_outbound: number;
  identity_pubkey: string;
  num_channels: number;
}

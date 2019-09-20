import * as hi from 'hookedin-lib';

export interface Config {
  one: 1; // for indexing
  bitcoinAddressGenerator: string;
  custodianUrl: string;
  custodian: hi.POD.CustodianInfo;
  mnemonic: string;
  gapLimit: number;
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

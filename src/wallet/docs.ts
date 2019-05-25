import * as hi from 'hookedin-lib';

export interface Config {
  one: 1; // for indexing
  bitcoinAddressGenerator: string;
  custodianUrl: string;
  custodian: hi.POD.CustodianInfo;
  mnemonic: string;
  gapLimit: number;
}


export interface Claim extends hi.POD.ClaimResponse, hi.POD.Acknowledged {
  which: 'Hookin' | 'TransferChange'
}

export interface Coin extends hi.POD.Coin {
  hash: string;
  claimHash: string; // ref's the claim that this coin was created from
  blindingNonce: string; // refs the blinding nonce that was used to create this coin
}

export interface BitcoinAddress {
  address: string; // the actual bitcoin address
  claimant: string; // bech encoded
  index: number;
  created: Date;
}

export interface Hookin extends hi.POD.Hookin {
  hash: string;
  bitcoinAddress: string; // the bitcoin address, but also references a BitcoinAddressDoc
  created: Date;
}

export interface Hookout extends hi.POD.Hookout {
  hash: string;
  created: Date;
}

export function getInputHashes(transfer: hi.Transfer): string[] {
  return transfer.inputs.map(coin => coin.hash().toPOD());
}

export interface Transfer extends hi.POD.Transfer {
  hash: string;
  status: { kind: 'PENDING' } | { kind: 'CONFLICTED' } | { kind: 'ACKNOWLEDGED'; acknowledgement: string };
  inputHashes: string[]; // for the index of all inputs hashes
  created: Date;
}

import * as hi from 'hookedin-lib';

export interface Config {
  one: 1; // for indexing
  bitcoinAddressGenerator: string;
  directAddressGenerator: string;
  internalAddressGenerator: string;
  mnemonic: string;
  baseAPI: string;
  gapLimit: number;
}

export interface Bounty extends hi.POD.Bounty {
  hash: string;
}

export interface Claim extends hi.POD.ClaimResponse, hi.POD.Acknowledged {}

export interface Coin extends hi.POD.Coin {
  hash: string;
  claimHash: string; // ref's the claim that this coin was created from
  blindingNonce: string; // refs the blinding nonce that was used to create this coin
}

export interface Hookin extends hi.POD.Hookin {
  hash: string;
  bitcoinAddress: string; // the bitcoin address, but also references a BitcoinAddressDoc
  created: Date;
}

export interface HDChain {
  zpub: string;
  claimant: string; // bech encoded
  index: number;
}

export interface BitcoinAddress {
  address: string; // the actual bitcoin address
  claimant: string; // bech encoded
  index: number;
}

export interface DirectAddress {
  claimant: string; // bech encoded
  index: number;
  isInternal: boolean;
}

export interface Hookout extends hi.POD.Hookout {
  hash: string;
  created: Date;
}

export function getInputOutputHashes(transfer: hi.Transfer) {
  const hashes: string[] = [];

  for (const coin of transfer.inputs) {
    hashes.push(coin.hash().toPOD());
  }

  hashes.push(transfer.outputHash.toPOD());
  hashes.push(transfer.changeHash.toPOD());

  return hashes;
}

export interface Transfer extends hi.POD.Transfer {
  hash: string;
  status: { kind: 'PENDING' } | { kind: 'CONFLICTED' } | { kind: 'ACKNOWLEDGED'; acknowledgement: string };
  inputOutputHashes: string[]; // for the index of all inputs and outputs (including change)
  created: Date;
}

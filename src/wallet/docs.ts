import * as hi from 'hookedin-lib';

export interface Config {
  one: 1; // for indexing
  bitcoinAddressGenerator: string;
  custodianUrl: string;
  custodian: hi.POD.CustodianInfo;
  mnemonic: string;
  gapLimit: number;
}

export interface ClaimResponse extends hi.POD.ClaimResponse {
  hash: string;
  which: 'Hookin' | 'TransferChange' | 'LightningInvoice';
  acknowledgement: string;
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

export interface LightningInvoice extends hi.POD.LightningInvoice, hi.POD.Acknowledged {
  hash: string;
  created: Date;
}

export interface LightningInvoicePayment {
  lightningInvoiceHash: string; // both primary key, and references lightninginvoice
  rPreimage: string; // hex
  amount: number;
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

export interface Event {
  id?: number;
  name: string;
}

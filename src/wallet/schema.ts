// DO NOTE EDIT THIS FILE
// EDIT generate-schema.ts instead and then run "npm run schema"
import * as idb from 'idb';
import * as Docs from './docs';

export default interface Schema extends idb.DBSchema {
  bitcoinAddresses: {
    key: string;
    keyPath: 'address';
    value: Docs.BitcoinAddress;
    indexes: {
      'by-index': number;
      'by-created': Date;
    };
  };
  config: {
    key: number;
    keyPath: 'one';
    value: Docs.Config;
    indexes: {};
  };
  claims: {
    key: string;
    keyPath: 'claimRequest.claimHash';
    value: Docs.Claim;
    indexes: {};
  };
  coins: {
    key: string;
    keyPath: 'hash';
    value: Docs.Coin;
    indexes: {
      'by-claim-hash': string;
    };
  };
  hookins: {
    key: string;
    keyPath: 'hash';
    value: Docs.Hookin;
    indexes: {
      'by-bitcoin-address': string;
      'by-created': Date;
    };
  };
  hookouts: {
    key: string;
    keyPath: 'hash';
    value: Docs.Hookout;
    indexes: {
      'by-created': Date;
    };
  };
  transfers: {
    key: string;
    keyPath: 'hash';
    value: Docs.Transfer;
    indexes: {
      'by-input-hashes': Array<string>;
      'by-index': number;
      'by-created': Date;
    };
  };
}

export type StoreName = 'bitcoinAddresses' | 'config' | 'claims' | 'coins' | 'hookins' | 'hookouts' | 'transfers';

interface StoreInfo {
  store: StoreName;
  keyPath: string;
  indexes: { name: string; keyPath: string | Array<string>; params?: IDBIndexParameters }[];
}

export const schemaPOD: StoreInfo[] = [
  {
    store: 'bitcoinAddresses',
    keyPath: 'address',
    indexes: [
      {
        name: 'by-index',
        keyPath: 'index',
      },
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
  {
    store: 'config',
    keyPath: 'one',
    indexes: [],
  },
  {
    store: 'claims',
    keyPath: 'claimRequest.claimHash',
    indexes: [],
  },
  {
    store: 'coins',
    keyPath: 'hash',
    indexes: [
      {
        name: 'by-claim-hash',
        keyPath: 'claimHash',
      },
    ],
  },
  {
    store: 'hookins',
    keyPath: 'hash',
    indexes: [
      {
        name: 'by-bitcoin-address',
        keyPath: 'bitcoinAddress',
      },
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
  {
    store: 'hookouts',
    keyPath: 'hash',
    indexes: [
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
  {
    store: 'transfers',
    keyPath: 'hash',
    indexes: [
      {
        name: 'by-input-hashes',
        keyPath: 'inputHashes',
        params: {
          multiEntry: true,
        },
      },
      {
        name: 'by-index',
        keyPath: 'index',
      },
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
];

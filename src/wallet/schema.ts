// DO NOTE EDIT THIS FILE
// EDIT generate-schema.ts instead and then run "npm run schema"
import * as idb from 'idb';
import * as Docs from './docs';

export default interface Schema extends idb.DBSchema {
  events: {
    key: number;
    keyPath: 'id';
    value: Docs.Event;
    autoIncrement: true;
    indexes: {};
  };
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
  claimResponses: {
    key: string;
    keyPath: 'hash';
    value: Docs.ClaimResponse;
    indexes: {
      'by-claimable-hash': string;
    };
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

export type StoreName = 'events' | 'bitcoinAddresses' | 'config' | 'claimResponses' | 'coins' | 'hookins' | 'hookouts' | 'transfers';

interface StoreInfo {
  store: StoreName;
  keyPath: string;
  autoIncrement: boolean;
  indexes: { name: string; keyPath: string | Array<string>; params?: IDBIndexParameters }[];
}

export const schemaPOD: StoreInfo[] = [
  {
    store: 'events',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [],
  },
  {
    store: 'bitcoinAddresses',
    keyPath: 'address',
    autoIncrement: false,
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
    autoIncrement: false,
    indexes: [],
  },
  {
    store: 'claimResponses',
    keyPath: 'hash',
    autoIncrement: false,
    indexes: [
      {
        name: 'by-claimable-hash',
        keyPath: 'claimRequest.claimHash',
      },
    ],
  },
  {
    store: 'coins',
    keyPath: 'hash',
    autoIncrement: false,
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
    autoIncrement: false,
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
    autoIncrement: false,
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
    autoIncrement: false,
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

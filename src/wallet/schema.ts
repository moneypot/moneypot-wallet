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
  counters: {
    key: string;
    keyPath: 'value';
    value: Docs.Counter;
    indexes: {
      'by-purpose-index': [string, number];
      'by-value': string;
      'by-created': Date;
    };
  };
  bitcoinAddresses: {
    key: string;
    keyPath: 'address';
    value: Docs.BitcoinAddress;
    indexes: {
      'by-created': Date;
    };
  };
  config: {
    key: number;
    keyPath: 'one';
    value: Docs.Config;
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
  claimables: {
    key: string;
    keyPath: 'hash';
    value: Docs.Claimable;
    indexes: {
      'by-bitcoin-address': string;
      'by-created': Date;
    };
  };
  statuses: {
    key: string;
    keyPath: 'hash';
    value: Docs.Status;
    indexes: {
      'by-claimable-hash': string;
      'by-created': Date;
    };
  };
}

export type StoreName = 'events' | 'counters' | 'bitcoinAddresses' | 'config' | 'coins' | 'claimables' | 'statuses';

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
    store: 'counters',
    keyPath: 'value',
    autoIncrement: false,
    indexes: [
      {
        name: 'by-purpose-index',
        keyPath: ['purpose', 'index'],
      },
      {
        name: 'by-value',
        keyPath: 'value',
        params: {
          unique: true,
        },
      },
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
  {
    store: 'bitcoinAddresses',
    keyPath: 'address',
    autoIncrement: false,
    indexes: [
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
    store: 'claimables',
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
    store: 'statuses',
    keyPath: 'hash',
    autoIncrement: false,
    indexes: [
      {
        name: 'by-claimable-hash',
        keyPath: 'claimableHash',
      },
      {
        name: 'by-created',
        keyPath: 'created',
      },
    ],
  },
];

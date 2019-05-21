const schema = `{
  bitcoinAddresses: {
    key: string,
    keyPath: 'address',
    value: Docs.BitcoinAddress,
    indexes: [
      { name: 'by-index', keyPath: 'index', value: number },
      { name: 'by-created', keyPath: 'created', value: Date }
    ]
  },
  config: {
    key: number,
    keyPath: 'one',
    value: Docs.Config
  },
  bounties: {
    key: string,
    keyPath: 'hash',
    value: Docs.Bounty,
    indexes: [
      { name: 'by-claimant', keyPath: 'claimant', value: string }
    ]
  },
  claims: {
    key: string,
    keyPath: 'claimRequest.claim',
    value: Docs.Claim
  },
  coins: {
    key: string,
    keyPath: 'hash',
    value: Docs.Coin,
    indexes: [
      { name: 'by-claim-hash', keyPath: 'claimHash', value: string }
    ]
  },
  directAddresses: {
    key: string,
    keyPath: 'address',
    value: Docs.DirectAddress,
    indexes: [
      { name: 'by-is-change-and-index', keyPath: ['isChange', 'index'], value: [number, number] },
      { name: 'by-created', keyPath: 'created', value: Date }
    ]
  },
  hookins: {
    key: string,
    keyPath: 'hash',
    value: Docs.Hookin,
    indexes: [
      { name: 'by-bitcoin-address', keyPath: 'bitcoinAddress', value: string },
      { name: 'by-created', keyPath: 'created', value: Date }
    ] 
  },
  hookouts: {
    key: string,
    keyPath: 'hash',
    value: Docs.Hookout,
    indexes: [
      { name: 'by-created', keyPath: 'created', value: Date }
    ] 
  },
  transfers: {
    key: string,
    keyPath: 'hash',
    value: Docs.Transfer,
    indexes: [
      { name: 'by-input-output-hashes', keyPath: 'inputOutputHashes', value: Array<string>, params: { multiEntry: true } },
      { name: 'by-created', keyPath: 'created', value: Date }
    ]
  }
}`;

let schemaJs: any = schema.replace(/\b(Array<string>)|(number)|(string)|(Date)|(Docs\.\w+)\b/g, "Symbol('$&')");
try {
  eval('schemaJs = ' + schemaJs);
} catch (err) {
  console.error(schemaJs);
  throw new Error('couldnt eval! Make sure the above is valid js!');
}

const pod = Object.entries(schemaJs)
  .map(([store, descr]) => {
    const keyPath = (descr as any).keyPath;

    const indexes = [];
    for (const { name, keyPath, params } of (descr as any).indexes || []) {
      indexes.push({ name, keyPath, params });
    }

    const obj = { store, keyPath, indexes };
    return JSON.stringify(obj, null, 2);
  })
  .join(', ');

const storeNames = Object.keys(schemaJs)
  .map(x => `'${x}'`)
  .join(' | ');

// now we need to normalize schemaJS to make it a valid
for (const [store, descr] of Object.entries(schemaJs)) {
  const newIndexes: any = {};

  for (const { name, value } of (descr as any).indexes || []) {
    newIndexes[name] = value;
  }

  (descr as any).indexes = newIndexes;
}

console.log(`// DO NOTE EDIT THIS FILE
// EDIT generate-schema.ts instead and then run "npm run schema"
import * as idb from 'idb';
import * as Docs from './docs';

export default interface Schema extends idb.DBSchema ${stringify(schemaJs, true)}

export type StoreName = ${storeNames};

interface StoreInfo {
  store: StoreName;
  keyPath: string;
  indexes: { name: string, keyPath: string|Array<string>, params?: IDBIndexParameters }[];
}

export const schemaPOD: StoreInfo[] = [${pod}
];  
`);

function stringify(x: any, nakedSymbols: boolean, indent: number = 0): string {
  if (typeof x === 'symbol') {
    return nakedSymbols ? x.description : JSON.stringify(x.description);
  }

  // primitives
  if (typeof x === 'string' || typeof x === 'number') {
    return JSON.stringify(x);
  }

  if (Array.isArray(x)) {
    return '[' + x.map(e => stringify(e, nakedSymbols, indent + 1)).join(', ') + ']';
  }

  if (typeof x !== 'object') {
    throw new Error('unexpected type: ' + typeof x);
  }

  return (
    '{' +
    Object.entries(x)
      .map(([k, v]) => '\n' + '\t'.repeat(indent + 1) + JSON.stringify(k) + ': ' + stringify(v, nakedSymbols, indent + 1))
      .join(',') +
    '\n' +
    '\t'.repeat(indent) +
    '}'
  );

  // return JSON.stringify(v);
}

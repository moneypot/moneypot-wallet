// export const baseServerUrl = window.location.hostname === 'wallet.hookedin.com' ? 'https://www.hookedin.com/api/dev' : 'http://localhost:3030';

import * as hi from 'hookedin-lib';
import * as bip39 from '../bip39';
import * as util from '../util';
import * as Docs from './docs';

export default class Config {
  static async fromDoc(d: any, password: string): Promise<Config | 'INVALID_PASSWORD'> {
    if (typeof d !== 'object') {
      throw new Error('expected an object for config');
    }

    const mnemonic = expectString(d.mnemonic);
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('invalid mnemonic');
    }

    const gapLimit = d.gapLimit;
    if (typeof gapLimit !== 'number' || !Number.isSafeInteger(gapLimit) || gapLimit < 0) {
      throw new Error('invalid gap limit');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic, password);

    // we'll only validate the password if this exists
    if (d.bitcoinAddressGenerator) {
      const bitcoinAddressGenerator = Config.seedToBitcoinAddressGenerator(seed);

      const expectedBitcoinAddressGenerator = util.notError(hi.PublicKey.fromPOD(d.bitcoinAddressGenerator));

      if (bitcoinAddressGenerator.toPublicKey().toPOD() !== expectedBitcoinAddressGenerator.toPOD()) {
        return 'INVALID_PASSWORD';
      }
    }

    const custodianUrl = expectString(d.custodianUrl);

    const custodian = util.notError(hi.CustodianInfo.fromPOD(d.custodian));

    return new Config(mnemonic, gapLimit, seed, custodianUrl, custodian);
  }

  static async fromData(mnemonic: string, gapLimit: number, custodianUrl: string, custodian: hi.CustodianInfo, password: string): Promise<Error | Config> {
    if (!bip39.validateMnemonic(mnemonic)) {
      return new Error('invalid mnemonic');
    }

    if (!Number.isSafeInteger(gapLimit) || gapLimit < 0) {
      return new Error('gap limit is invalid');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic, password);

    return new Config(mnemonic, gapLimit, seed, custodianUrl, custodian);
  }

  mnemonic: string;
  gapLimit: number;
  seed: Uint8Array;
  custodianUrl: string;

  custodian: hi.CustodianInfo;

  constructor(mnemonic: string, gapLimit: number, seed: Uint8Array, custodianUrl: string, custodian: hi.CustodianInfo) {
    this.mnemonic = mnemonic;
    this.gapLimit = gapLimit;
    this.seed = seed;

    this.custodianUrl = custodianUrl;
    this.custodian = custodian;

    console.log('debug: custodian: ', custodian);
  }

  toDoc(): Docs.Config {
    return {
      one: 1,
      mnemonic: this.mnemonic,
      gapLimit: this.gapLimit,
      bitcoinAddressGenerator: this.bitcoinAddressGenerator()
        .toPublicKey()
        .toPOD(),
      custodianUrl: this.custodianUrl,
      custodian: this.custodian.toPOD(),
    };
  }

  bitcoinAddressGenerator() {
    return Config.seedToBitcoinAddressGenerator(this.seed);
  }

  static seedToBitcoinAddressGenerator(seed: Uint8Array): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('bitcoinAddressGenerator', seed);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  directAddressGenerator() {
    return Config.seedToDirectAddressGenerator(this.seed);
  }

  static seedToDirectAddressGenerator(seed: Uint8Array): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('directAddressGenerator', seed);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  changeAddressGenerator() {
    return Config.seedToChangeAddressGenerator(this.seed);
  }

  static seedToChangeAddressGenerator(seed: Uint8Array): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('changeAddressGenerator', seed);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  deriveOwner(claimHash: hi.Hash, blindingNonce: hi.PublicKey): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('deriveOwner', this.seed, claimHash.buffer, blindingNonce.buffer);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  deriveBlindingSecret(claimHash: hi.Hash, blindingNonce: hi.PublicKey): Uint8Array {
    const hash = hi.Hash.fromMessage('deriveBlindingSecret', this.seed, claimHash.buffer, blindingNonce.buffer);
    return hash.buffer;
  }
}

function expectString(s: any): string {
  if (typeof s !== 'string') {
    throw 'expected a string';
  }
  return s;
}

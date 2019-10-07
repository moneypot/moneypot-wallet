import * as hi from 'hookedin-lib';
import * as bip39 from '../bip39';
import * as util from '../util';
import * as Docs from './docs';

import { templateTransactionWeight } from '../config';

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
    if (d.claimantGenerator) {
      const claimantGenerator =  Config.seedToClaimantGenerator(seed);

      const expectedClaimantAddressGenerator = util.notError(hi.PublicKey.fromPOD(d.claimantGenerator));

      if (claimantGenerator.toPublicKey().toPOD() !== expectedClaimantAddressGenerator.toPOD()) {
        return 'INVALID_PASSWORD';
      }
    } else {
      console.error('no claimantGenerator to validate? why');
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
      claimantGenerator: this.claimantGenerator().toPublicKey().toPOD(),
      custodianUrl: this.custodianUrl,
      custodian: this.custodian.toPOD(),
    };
  }



  claimantGenerator() {
    return Config.seedToClaimantGenerator(this.seed);
  }

  invoiceGenerator() {
    return Config.seedToInvoiceGenerator(this.seed);
  }

  static seedToClaimantGenerator(seed: Uint8Array): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('claimantGenerator', seed);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  static seedToInvoiceGenerator(seed: Uint8Array): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('invoiceGenerator', seed);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  deriveOwner(claimHash: hi.Hash, blindingNonce: hi.PublicKey): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('deriveOwner', this.seed, claimHash.buffer, blindingNonce.buffer);
    return util.notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  deriveBlindingSecret(claimableHash: hi.Hash, blindingNonce: hi.PublicKey): Uint8Array {
    const hash = hi.Hash.fromMessage('deriveBlindingSecret', this.seed, claimableHash.buffer, blindingNonce.buffer);
    return hash.buffer;
  }

  deriveCoinsRequest(claimHash: hi.Hash, nonces: hi.PublicKey[], coinsMagnitudes: hi.Magnitude[]) {
    util.mustEqual(nonces.length, coinsMagnitudes.length);

    const coinRequests: hi.CoinRequest[] = [];

    for (let i = 0; i < nonces.length; i++) {
      const blindingNonce = nonces[i];
      const magnitude = coinsMagnitudes[i];

      const blindingSecret = this.deriveBlindingSecret(claimHash, blindingNonce);
      const newOwner = this.deriveOwner(claimHash, blindingNonce);
      const newOwnerPub = newOwner.toPublicKey();

      const [_unblinder, blindedOwner] = hi.blindMessage(blindingSecret, blindingNonce, this.custodian.blindCoinKeys[magnitude.n], newOwnerPub.buffer);

      coinRequests.push({ blindingNonce, blindedOwner, magnitude: magnitude });
    }

    return coinRequests;
  }
}

function expectString(s: any): string {
  if (typeof s !== 'string') {
    throw 'expected a string';
  }
  return s;
}

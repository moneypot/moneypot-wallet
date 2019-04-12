import * as hi from 'hookedin-lib';
import { notError } from '../util';

export default class HIChain {
  private secretSeed: Uint8Array;

  public constructor(secretSeed: hi.PrivateKey) {
    this.secretSeed = secretSeed.buffer;
  }

  public deriveBitcoinAddress(index: number) {
    return this.deriveBitcoinAddressRaw(hi.Buffutils.fromUint32(index));
  }

  public deriveBitcoinAddressRaw(b: Uint8Array) {
    const privSeed = hi.Hash.fromMessage('HIChain.deriveBitcoinAddress', this.secretSeed, b);
    const claimant = hi.PrivateKey.fromBytes(privSeed.buffer);
    if (claimant instanceof Error) {
      throw claimant;
    }

    const fourZeros = new Uint8Array(4);
    const message = hi.Buffutils.concat(hi.Params.fundingPublicKey.buffer, fourZeros);
    const hash = claimant.toPublicKey().hash();
    const I = hi.SHA512.mac(hash.buffer, message);
    const tweak = hi.PrivateKey.fromBytes(I.slice(0, 32));
    if (tweak instanceof Error) {
      throw tweak;
    }

    const tweakPubkey = tweak.toPublicKey();

    const pubkey = hi.Params.fundingPublicKey.tweak(tweakPubkey);

    return { claimant, bitcoinAddress: pubkey.toBitcoinAddress() };
  }

  public deriveHDChain(index: number) {
    return this.deriveHDChainRaw(hi.Buffutils.fromUint32(index));
  }

  public deriveHDChainRaw(b: Uint8Array) {
    const privSeed = hi.Hash.fromMessage('HIChain.deriveHDChain', this.secretSeed, b);
    const claimant = hi.PrivateKey.fromBytes(privSeed.buffer);
    if (claimant instanceof Error) {
      throw claimant;
    }

    const hash = claimant.toPublicKey().hash();

    return {
      claimant,
      hdchain: new hi.HDChain(null, hi.Params.fundingPublicKey.buffer, hash.buffer),
    };
  }

  public deriveClaimant(index: number): hi.PrivateKey {
    const privHash = hi.Hash.fromMessage('HIChain.deriveClaimant', this.secretSeed, hi.Buffutils.fromUint64(index));

    return notError(hi.PrivateKey.fromBytes(privHash.buffer));
  }

  public deriveOwner(claimHash: hi.Hash, blindingNonce: hi.PublicKey): hi.PrivateKey {
    const hash = hi.Hash.fromMessage('HIChain.deriveOwner', this.secretSeed, claimHash.buffer, blindingNonce.buffer);

    return notError(hi.PrivateKey.fromBytes(hash.buffer));
  }

  public deriveBlindingSecret(claimHash: hi.Hash, blindingNonce: hi.PublicKey): Uint8Array {
    const hash = hi.Hash.fromMessage('HIChain.deriveBlindingSecret', this.secretSeed, claimHash.buffer, blindingNonce.buffer);
    return hash.buffer;
  }
}

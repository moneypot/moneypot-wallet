import * as hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';
import HIChain from '../hichain';
import genNonces from './gen-nonces';

export default async function makeClaim(
  deriveBlindingSecret: (hash: hi.Hash, pubNonce: hi.PublicKey) => Uint8Array,
  deriveOwner: (hash: hi.Hash, pubNonce: hi.PublicKey) => hi.PrivateKey,
  claimaint: hi.PrivateKey,
  claim: hi.Bounty | hi.Hookin,
  coinsMagnitudes: hi.Magnitude[]
) {
  // We are using the hash of the private key as the blinding secret, in case we need to reveal it
  // we can do so without revealing out private key

  const seenNonces = new Set<string>();

  const maxRetries = 64;
  for (let retry = 1; retry <= maxRetries; retry++) {
    const nonces = await genNonces(coinsMagnitudes.length, seenNonces);

    const claimHash = claim.hash();

    const coinClaims: CoinClaim[] = [];

    for (let i = 0; i < nonces.length; i++) {
      const blindingNonce = nonces[i];
      const magnitude = coinsMagnitudes[i];

      const blindingSecret = deriveBlindingSecret(claimHash, blindingNonce);
      const newOwner = deriveOwner(claimHash, blindingNonce);
      const newOwnerPub = newOwner.toPublicKey();

      const [_unblinder, blindedOwner] = hi.blindMessage(blindingSecret, blindingNonce, hi.Params.blindingCoinPublicKeys[magnitude.n], newOwnerPub.buffer);

      coinClaims.push({ blindingNonce, blindedOwner, magnitude: magnitude });
    }

    let claimResp: any;
    if (claim instanceof hi.Bounty) {
      const claimReq = await hi.ClaimBountyRequest.newAuthorized(claimaint, claim, coinClaims);
      claimResp = await makeRequest<any>(config.baseServerUrl + '/claim-bounty', claimReq.toPOD());
    } else if (claim instanceof hi.Hookin) {
      const claimReq = await hi.ClaimHookinRequest.newAuthorized(claimaint, claim, coinClaims);
      claimResp = await makeRequest<any>(config.baseServerUrl + '/claim-hookin', claimReq.toPOD());
    } else {
      const _: never = claim;
      throw new Error('unreachable!');
    }

    if (claimResp instanceof RequestError) {
      if (claimResp.message === 'RETRY_NONCE') {
        console.warn('server asked us to retry with a different nonce (very normal). Retry: ', retry);
        continue;
      }
      throw claimResp;
    }

    console.log('Claim response is: ', claimResp);

    const acknowledgedClaimResponse: hi.AcknowledgedClaimResponse | Error = await hi.Acknowledged.fromPOD(hi.ClaimResponse.fromPOD, claimResp);

    if (acknowledgedClaimResponse instanceof Error) {
      throw acknowledgedClaimResponse;
    }

    return acknowledgedClaimResponse;
  }

  throw new Error('After ' + maxRetries + ' could not claim!');
}

type CoinClaim = {
  blindingNonce: hi.PublicKey;
  blindedOwner: hi.BlindedMessage;
  magnitude: hi.Magnitude;
};

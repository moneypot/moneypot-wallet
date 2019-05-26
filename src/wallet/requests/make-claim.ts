import * as hi from 'hookedin-lib';
import makeRequest, { RequestError } from './make-request';
import genNonces from './gen-nonces';
import Config from '../config';

export default async function makeClaim(config: Config, claimant: hi.PrivateKey, claim: hi.Transfer | hi.Hookin, coinsMagnitudes: hi.Magnitude[]) {
  // We are using the hash of the private key as the blinding secret, in case we need to reveal it
  // we can do so without revealing out private key

  const claimHash = claim.hash();

  const seenNonces = new Set<string>();

  const maxRetries = 64;

  for (let retry = 1; retry <= maxRetries; retry++) {
    const nonces = await genNonces(config, coinsMagnitudes.length, seenNonces);

    const coinsRequest = config.deriveCoinsRequest(claimHash, nonces, coinsMagnitudes);

    const claimReq = hi.ClaimRequest.newAuthorized(claim.hash(), coinsRequest, claimant);

    let claimResp;

    if (claim instanceof hi.Transfer) {
      claimResp = await makeRequest<any>(config.custodianUrl + '/claim-transfer-change', claimReq.toPOD());
    } else if (claim instanceof hi.Hookin) {
      claimResp = await makeRequest<any>(config.custodianUrl + '/claim-hookin', {
        claimRequest: claimReq.toPOD(),
        hookin: claim.toPOD(),
      });
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

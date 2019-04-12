import hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';

// Returns the transfer hash of a coin
export default async function(claimant: string): Promise<hi.POD.Bounty[]> {
  const res = await makeRequest<hi.POD.Bounty[]>(`${config.baseServerUrl}/bounties/claimants/${claimant}`);
  if (res instanceof RequestError) {
    throw res;
  }

  return res;
}

import * as config from '../config';
import makeRequest, { RequestError } from './make-request';

// Returns the transfer hash of a coin
export default async function lookupCoin(coinOwner: string): Promise<string | undefined> {
  const res = await makeRequest<string>(`${config.baseServerUrl}/coin/${coinOwner}`);

  if (res instanceof RequestError) {
    if (res.statusCode === 404) {
      return undefined;
    }

    throw res;
  }

  return res;
}

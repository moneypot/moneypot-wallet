import Config from '../config';
import makeRequest, { RequestError } from './make-request';

// Returns the transfer hash of a coin
export default async function lookupCoin(config: Config, coinOwner: string): Promise<string | undefined> {
  const res = await makeRequest<string>(`${config.custodianUrl}/coin/${coinOwner}`);

  if (res instanceof RequestError) {
    if (res.statusCode === 404) {
      return undefined;
    }

    throw res;
  }

  return res;
}

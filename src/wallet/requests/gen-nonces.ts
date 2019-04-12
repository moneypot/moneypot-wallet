import * as hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';

// seen nonces is a set of a nonces we've already seen. This is to protect
// us from the server maliciously feeding us the same nonce twice to
// try learn our blindingSecret

export default async function genNonces(count: number, seenNonces: Set<string>): Promise<hi.PublicKey[]> {
  const url = config.baseServerUrl + '/gen-nonces';

  const nonces = await makeRequest<string>(url, count);
  if (nonces instanceof RequestError) {
    throw nonces;
  }

  if (!Array.isArray(nonces)) {
    throw new Error('expected array of nonces from genNonces');
  }
  if (nonces.length !== count) {
    throw new Error('got incorrect sized nonce array back');
  }

  const ret: hi.PublicKey[] = [];
  for (const nonce of nonces) {
    if (seenNonces.has(name)) {
      throw new Error('seen nonce: ' + nonce + ' multiple times?!');
    }
    seenNonces.add(nonce);
    const pk = hi.PublicKey.fromBech(nonce);
    if (pk instanceof Error) {
      throw pk;
    }
    ret.push(pk);
  }

  return ret;
}

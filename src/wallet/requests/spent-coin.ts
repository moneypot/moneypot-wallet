import * as config from '../config';
import makeRequest, { RequestError } from './make-request';

import * as hi from 'hookedin-lib';

type CoinInfo = hi.POD.Coin & hi.POD.TransferHash & { spendAuthorization: string };

export default async function(owner: string) {
  const res = await makeRequest<CoinInfo>(config.baseServerUrl, '/transaction-input/' + owner);

  if (res instanceof RequestError) {
    throw res;
  }

  const transferHash = hi.Buffutils.fromHex(res.transferHash, 32);
  if (transferHash instanceof Error) {
    throw transferHash;
  }

  const claimedCoin = hi.Coin.fromPOD(res);

  const spendAuthorization = hi.Signature.fromPOD(res.spendAuthorization);

  // TODO: validate the spend authorization

  return {
    claimedCoin,
    spendAuthorization,
    transferHash,
  };
}

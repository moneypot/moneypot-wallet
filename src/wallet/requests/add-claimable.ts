import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function addClaimable(config: Config, claimable: hi.Claimable): Promise<hi.Acknowledged.Claimable | Error> {
  const resp = await makeRequest<string>(config.custodianUrl + '/add-claimable', hi.claimableToPOD(claimable));

  if (resp instanceof RequestError) {
    console.error('got request error: ', resp);
    return new Error('could not make request against server: ' + resp.message + ' : ' + resp.statusCode);
  }

  return hi.Acknowledged.claimableFromPOD(resp);
}

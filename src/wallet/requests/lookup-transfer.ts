import Config from '../config';
import makeRequest, { RequestError } from './make-request';

import * as hi from 'hookedin-lib';

// Returns the transfer hash of a coin
export default async function lookupTransfer(config: Config, transferHash: string): Promise<hi.AcknowledgedTransfer | undefined> {
  const res = await makeRequest<hi.POD.Transfer & hi.POD.Acknowledged>(`${config.custodianUrl}/transfers/${transferHash}`);

  if (res instanceof RequestError) {
    if (res.statusCode === 404) {
      return undefined;
    }
    throw res;
  }

  const transfer: hi.AcknowledgedTransfer | Error = hi.Acknowledged.fromPOD(hi.Transfer.fromPOD, res);
  if (transfer instanceof Error) {
    throw transfer;
  }

  return transfer;
}

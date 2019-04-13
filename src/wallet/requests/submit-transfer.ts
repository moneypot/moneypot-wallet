import * as hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function(transfer: hi.FullTransfer): Promise<hi.Signature | RequestError> {
  const resp = await makeRequest<string>(config.baseServerUrl + '/transfer', transfer.toPOD());

  if (resp instanceof RequestError) {
    return resp;
  }

  const sig = hi.Signature.fromPOD(resp);
  if (sig instanceof Error) {
    throw sig;
  }

  // TODO: something that validates the signature
  const at: hi.AcknowledgedTransfer = new hi.Acknowledged(transfer.prune(), sig);

  return at.acknowledgement;
}

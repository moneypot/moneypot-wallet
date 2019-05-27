import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function(config: Config, transfer: hi.Transfer, hookout: hi.Hookout): Promise<hi.Signature | RequestError> {
  const resp = await makeRequest<string>(config.custodianUrl + '/transfer', {
    transfer: transfer.toPOD(),
    hookout: hookout.toPOD(),
  });

  if (resp instanceof RequestError) {
    return resp;
  }

  const sig = hi.Signature.fromPOD(resp);
  if (sig instanceof Error) {
    throw sig;
  }

  // TODO: something that validates the signature
  const at: hi.AcknowledgedTransfer = new hi.Acknowledged(transfer, sig);

  return at.acknowledgement;
}

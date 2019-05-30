import * as hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

export default async function(custodianUrl: string): Promise<hi.CustodianInfo | Error> {
  const url = new URL(custodianUrl);

  const ackString = url.hash.substring(1);

  const res = await makeRequest<any>(custodianUrl);

  if (res instanceof RequestError) {
    if (res.statusCode === 404) {
      return new Error('404 not found');
    }

    throw res;
  }

  const ci = hi.CustodianInfo.fromPOD(res); // make sure it's all good..
  if (ci instanceof Error) {
    return ci;
  }

  // TODO: ack verification..
  if (ackString.length > 0) {
    //const ackKey = notError(hi.PublicKey.fromPOD(ackString));
    // if (!aci.verify(ackKey)) {
    //   return new Error('custodian info was not property acknowledged by expected key');
    // }
    if (ci.acknowledgementKey.toPOD() !== ackString) {
        return new Error('custodian info was not property acknowledged by expected key');
    }
  }

  return ci;
}

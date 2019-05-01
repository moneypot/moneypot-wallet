import * as hi from 'hookedin-lib';
import * as config from '../config';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

export default async function(custodianUrl: string): Promise<hi.CustodianInfo | Error> {
  const url = new URL(custodianUrl);

  const ackString = url.hash.substring(1);
  if (ackString.length === 0) {
    return new Error('custodian url expected an ack key as part of the hash string');
  }

  const ackKey = notError(hi.PublicKey.fromPOD(ackString));

  const res = await makeRequest<any>(custodianUrl);

  if (res instanceof RequestError) {
    if (res.statusCode === 404) {
      return new Error('404 not found');
    }

    throw res;
  }

  const aci: hi.AcknowledgedCustodianInfo | Error = hi.Acknowledged.fromPOD(hi.CustodianInfo.fromPOD, res); // make sure it's all good..
  if (aci instanceof Error) {
    return aci;
  }

  if (!aci.verify(ackKey)) {
    return new Error('custodian info was not property acknowledged by expected key');
  }

  return aci.contents;
}

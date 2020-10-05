import * as hi from 'moneypot-lib';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

export default async function(
  custodianUrl: string
): Promise<
  | Error
  | hi.CustodianInfo
  | {
      ci: hi.CustodianInfo;
      sigP: hi.Signature;
      ephemeral: hi.PublicKey;
    }
> {
  // onion support, not tested, TODO
  if (custodianUrl.includes('#')) {
    var ackString = custodianUrl.split('#').pop();
  }
  const res = await makeRequest<hi.POD.CustodianInfo>(custodianUrl);

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

  if (ackString) {
    if (ackString.length > 0) {
      const ackKeyPub = notError(hi.PublicKey.fromPOD(ackString));

      if (ci.acknowledgementKey.toPOD() !== ackString) {
        return new Error('custodian info was not properly acknowledged by expected key');
      }

      const custUrl = custodianUrl.substring(0, -1 + custodianUrl.indexOf('#'));

      // no replayability..
      const ephemeral = hi.PrivateKey.fromRand().toPublicKey();
      const ciHash = ci.hash();
      const newUrl = `${custUrl}/ack-custodian-info/${ciHash.toPOD()}/${ephemeral.toPOD()}`;
      const message = hi.Hash.fromMessage('verify', ciHash.buffer, ephemeral.buffer);

      const aci = await makeRequest<hi.POD.Signature>(newUrl);
      if (aci instanceof RequestError) {
        throw "Couldn't get a signature";
      }
      console.log('[verify:signature] verify this signature: ', aci);
      const sigP = notError(hi.Signature.fromPOD(aci));

      if (!sigP.verify(message.buffer, ackKeyPub)) {
        return new Error('custodian info (signature!) was not properly acknowledged by expected key. (Is the custodian trying to cheat us?!)');
      }
      return { ci, sigP, ephemeral };
    }
  }

  return ci;
}

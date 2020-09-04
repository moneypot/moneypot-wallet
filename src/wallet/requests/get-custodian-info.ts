import * as hi from 'moneypot-lib';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

export default async function(custodianUrl: string): Promise<hi.CustodianInfo | Error> {
  // onion support, not tested, TODO
  if (custodianUrl.includes('#')) {
    var ackString = custodianUrl.split('#').shift();
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

  // if WipeData, verify
  if (ci.wipeDate) {
    if (ci.wipeDateSig) {
      const sig = hi.Signature.fromPOD(ci.wipeDateSig);
      if (sig instanceof Error) {
        return sig;
      }
      const VerifyWipeDate = sig.verify(hi.Buffutils.fromString(ci.wipeDate), ci.acknowledgementKey);
      if (!VerifyWipeDate) {
        return new Error('Cannot verify Signature related to WipeDate');
      }
    } else return new Error('No Sig regarding in relation to WipeDate..');
  }

  if (ackString) {
    if (ackString.length > 0) {
      const ackKeyPub = notError(hi.PublicKey.fromPOD(ackString));
      if (ci.acknowledgementKey.toPOD() !== ackString) {
        return new Error('custodian info was not properly acknowledged by expected key');
      }
      const custUrl = custodianUrl.substring(0, -1 + custodianUrl.indexOf('#'));

      const message = hi.PrivateKey.fromRand().toPublicKey();
      const newUrl = `${custUrl}/ack-custodian-info/${message.toPOD()}`;

      const aci = await makeRequest<hi.POD.Signature>(newUrl);
      if (aci instanceof RequestError) {
        throw "Couldn't get a signature";
      }
      console.log('[verify:signature] verify this signature: ', aci);
      const sigP = notError(hi.Signature.fromPOD(aci));

      // if the custodian can't create a signature with the displayed ackKey. (a domain hijacker won't be able to.)
      if (!sigP.verify(message.buffer, ackKeyPub)) {
        return new Error('custodian info (signature!) was not properly acknowledged by expected key. (Is the custodian trying to cheat us?!)');
      }
    }
  }

  return ci;
}

import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function addInvoice(config: Config, claimant: hi.PublicKey, memo: string, amount: number) {
  const url = config.custodianUrl + '/add-invoice';

  const invoicePOD = await makeRequest<hi.POD.Acknowledged & hi.POD.LightningInvoice>(url, {
    amount,
    claimant: claimant.toPOD(),
    memo,
  });

  if (invoicePOD instanceof RequestError) {
    throw invoicePOD;
  }

  const invoice: hi.AcknowledgedLightningInvoice | Error = hi.Acknowledged.fromPOD(hi.LightningInvoice.fromPOD, invoicePOD);
  if (invoice instanceof Error) {
    throw invoice;
  }

  if (!invoice.verify(config.custodian.acknowledgementKey)) {
    throw new Error('invoices acknowledgement did not validate');
  }

  return invoice;
}

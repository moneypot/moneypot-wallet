import * as hi from 'moneypot-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function genInvoice(config: Config, claimant: hi.PublicKey, memo: string, amount: number): Promise<hi.Acknowledged.Claimable> {
  const url = config.custodianUrl + '/gen-invoice';

  const invoicePOD = await makeRequest<hi.POD.Claimable & hi.POD.Acknowledged>(url, {
    amount,
    claimant: claimant.toPOD(),
    memo,
  });

  if (invoicePOD instanceof RequestError) {
    throw invoicePOD;
  }

  if (invoicePOD.kind !== 'LightningInvoice') {
    throw new Error('expected lightninginvoice, got: ' + invoicePOD.kind);
  }

  const invoice = hi.Acknowledged.claimableFromPOD(invoicePOD);
  if (invoice instanceof Error) {
    throw invoice;
  }

  if (invoice.contents.claimant !== claimant) {
    throw new Error('custodian returned invoice with wrong claimant - we can never prove this is ours');
  }

  if (!invoice.verify(config.custodian.acknowledgementKey)) {
    throw new Error('invoices acknowledgement did not validate');
  }

  return invoice;
}

import * as hi from 'moneypot-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

// TODO?
export default async function getInvoicesByClaimant(config: Config, claimant: hi.PublicKey) {
  const claimantStr = claimant.toPOD();
  const url = `${config.custodianUrl}/lightning-invoices-by-claimant/${claimantStr}`;

  const invoice = await makeRequest<(hi.POD.LightningInvoice & hi.POD.Acknowledged) | null>(url);

  if (invoice instanceof RequestError) {
    throw invoice;
  }
  if (!invoice) {
    return undefined;
  }
  // if (!Array.isArray(invoices)) {
  //   throw new Error('lightning-invoices-by-claimant should have returned an array...');
  // }

  // for (const invoice of invoices) {
  if (invoice.claimant !== claimantStr) {
    throw new Error('lightning-invoices-by-claimant returned invoice with wrong claimant');
  }
  // }

  // for (const invoice of invoices) {
  const invoiceFromPOD = hi.Acknowledged.claimableFromPOD(invoice);
  if (invoiceFromPOD instanceof Error) {
    throw invoiceFromPOD;
  }
  if (!invoiceFromPOD.verify(config.custodian.acknowledgementKey)) {
    throw new Error('lighnting-invoices acknowledgement did not validate, server is trying to feed invalid invoices!');
  }
  // }

  // return invoices.map(s => {
  const claimable = notError(hi.Acknowledged.claimableFromPOD(invoice));
  if (!(claimable.contents instanceof hi.LightningInvoice)) {
    throw new Error('got something that was not a lightning invoice');
  }
  return claimable;
  // });
}

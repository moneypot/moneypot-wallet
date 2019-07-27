import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function getInvoiceByClaimant(config: Config, claimant: string) {
  const url = `${config.custodianUrl}/lightning-invoices/claimants/${claimant}`;

  const invoiceInfo = await makeRequest<
    (hi.POD.Acknowledged & hi.POD.LightningInvoice) | null
  >(url);

  if (invoiceInfo instanceof RequestError) {
    throw invoiceInfo;
  }

  if (!invoiceInfo) {
    return undefined;
  }

  const invoice: hi.AcknowledgedLightningInvoice | Error = hi.Acknowledged.fromPOD(hi.LightningInvoice.fromPOD, invoiceInfo);
  if (invoice instanceof Error) {
    throw invoice;
  }

  if (!invoice.verify(config.custodian.acknowledgementKey)) {
    throw new Error('invoices acknowledgement did not validate');
  }

  return invoice;
}

function getPaymentHash(paymentRequest: string) {
  const { tags } = hi.decodeBolt11(paymentRequest);
  for (const tag of tags) {
    if (tag.tagName === 'payment_hash') {
      return tag.data as string;
    }
  }

  return undefined;
}

import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export default async function getInvoicePayment(config: Config, invoiceHash: string) {

  const url = `${config.custodianUrl}/lightning-invoice-payments/${invoiceHash}`;

  const paymentInfo = await makeRequest<
    {
      rPreimage: string,
      amount: number,
    } | null
  >(url);

  if (paymentInfo instanceof RequestError) {
    throw paymentInfo;
  }

  if (!paymentInfo) {
    return undefined;
  }

  // TODO: validation of server response...

  return paymentInfo;
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

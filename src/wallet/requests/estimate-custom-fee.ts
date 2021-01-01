import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export interface BitcoinFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
}

export default async function getEstimatedCustomFee(config: Config): Promise<BitcoinFees> {
  const url = config.custodianUrl + '/estimate-custom-fee';

  const res = await makeRequest<BitcoinFees>(url);

  if (res instanceof RequestError) {
    throw res;
  }

  return res;
}

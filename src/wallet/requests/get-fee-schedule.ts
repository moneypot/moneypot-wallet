import Config from '../config';
import makeRequest, { RequestError } from './make-request';

export type FeeScheduleResult = {
  consolidationFeeRate: number;
  immediateFeeRate: number;
};

// Returns the transfer hash of a coin
export default async function getFeeSchedule(config: Config): Promise<FeeScheduleResult> {
  const res = await makeRequest<FeeScheduleResult>(`${config.custodianUrl}/fee-schedule`);

  if (res instanceof RequestError) {
    throw res;
  }

  return res;
}

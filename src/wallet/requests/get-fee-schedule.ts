import Config from '../config';
import makeRequest, { RequestError } from './make-request';
import { toast } from 'react-toastify';

export type FeeScheduleResult = {
  immediate: number;
  batch: number;
  consolidationFeeRate: number;
  immediateFeeRate: number;
};

// Returns the transfer hash of a coin
export default async function getFeeSchedule(config: Config): Promise<FeeScheduleResult> {
  const res = await makeRequest<FeeScheduleResult>(`${config.custodianUrl}/fee-schedule`);
  if (res instanceof RequestError) {
    toast.error("Error: Couldn't fetch feeschedule! Custodian is most likely experiencing issues!");
    throw res;
  }

  return res;
}
export async function getDynamicFeeRate(config: Config, confTarget: number): Promise<number | RequestError> {
  const res = await makeRequest<number>(`${config.custodianUrl}/fee-rate/${confTarget}`);
  if (res instanceof RequestError) {
    toast.error("Error: Couldn't fetch feeschedule! Custodian is most likely experiencing issues!");
    return res;
  }

  return res;
}
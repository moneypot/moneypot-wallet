import * as hi from 'hookedin-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';
import { notError } from '../../util';

export default async function getStatusesByClaimable(config: Config, claimableHash: string) {
  const url = `${config.custodianUrl}/statuses-by-claimable/${claimableHash}`;

  const statusPOD = await makeRequest<hi.POD.Status[]>(url);

  if (statusPOD instanceof RequestError) {
    throw statusPOD;
  }

  if (!Array.isArray(statusPOD)) {
    throw new Error('statuses-by-claimable should have returned an array...');
  }

  return statusPOD.map(s => notError(hi.Acknowledged.statusFromPOD(s)));
}

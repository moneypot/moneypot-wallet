import * as hi from 'moneypot-lib';
import Config from '../config';
import makeRequest, { RequestError } from './make-request';

import { notError } from '../../util';

import * as Docs from '../docs';

export async function getStatusesByClaimable(config: Config, claimableHash: string) {
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

export async function addClaimable(config: Config, claimable: hi.Claimable): Promise<hi.Acknowledged.Claimable | Error> {
  const resp = await makeRequest<string>(config.custodianUrl + '/add-claimable', hi.claimableToPOD(claimable));

  if (resp instanceof RequestError) {
    console.error('got request error: ', resp);
    return new Error('could not make request against server: ' + resp.message + ' : ' + resp.statusCode);
  }

  return hi.Acknowledged.claimableFromPOD(resp);
}

export async function getLightningCapacities(config: Config) {
  const url = `${config.custodianUrl}/inbound-outbound-capacity-lightning/`;
  const resp = await makeRequest<Docs.LightningCapacities>(url);

  if (resp instanceof RequestError) {
    console.error('got request error: ', resp);
    return new Error('could not make request against server: ' + resp.message + ' : ' + resp.statusCode);
  }
  return resp;
}

export async function getLightingNodeData(config: Config) {
  const url = `${config.custodianUrl}/lightning-node-information/`;
  const resp = await makeRequest<Docs.LND>(url);

  if (resp instanceof RequestError) {
    console.error('got request error: ', resp);
    return new Error('could not make request against server: ' + resp.message + ' : ' + resp.statusCode);
  }
  return resp;
}

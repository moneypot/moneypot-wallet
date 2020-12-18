import makeRequest, { RequestError } from './make-request';
import { wallet } from '../../state/wallet';

// We don't really need a seperate function for this, maybe merge with bitcoin-receives?
export interface AddressInfoTx {
  txid: string;
  vout: Array<{
    scriptpubkey_address: string;
    value: number;
  }>;
  vin: Array<{
    sequence: number;
  }>;
  fee: number;
  weight: number;
  status: { confirmed: boolean; block_height: number | null };
}

export default async function(txid: string): Promise<AddressInfoTx | RequestError> {
  const txs = await makeRequest<AddressInfoTx>(wallet.config.custodian.currency === 'BTC' ? `https://www.moneypot.com/api/tx/${txid}`:  `https://www.moneypot.com/api/testnet/tx/${txid}`);
  if (txs instanceof RequestError) {
    return txs;
  }
  return txs;
}

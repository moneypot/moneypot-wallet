import * as hi from 'moneypot-lib';
import makeRequest, { RequestError } from './make-request';

export interface BitcoinReceiveInfo {
  txid: Uint8Array;
  vout: number;
  amount: number; // satoshis
  confirmed: boolean;
}

interface AddressInfoTx {
  txid: string;
  vout: Array<{
    scriptpubkey_address: string;
    value: number;
  }>;
  fee: number;
  weight: number;
  status: { confirmed: boolean; block_height: number | null };
}

export default async function(address: string): Promise<BitcoinReceiveInfo[]> {
  const txs = await makeRequest<AddressInfoTx[]>(`https://www.moneypot.com/api/testnet/address/${address}/txs`);

  if (txs instanceof RequestError) {
    throw txs;
  }

  const res: BitcoinReceiveInfo[] = [];

  for (const tx of txs) {
    for (let v = 0; v < tx.vout.length; v++) {
      const vout = tx.vout[v];
      if (vout.scriptpubkey_address === address) {
        const amount = vout.value;

        const txid = hi.Buffutils.fromHex(tx.txid, 32);
        if (txid instanceof Error) {
          throw txid;
        }

        const txinfo = { txid, vout: v, amount, confirmed: tx.status.confirmed };

        res.push(txinfo);
      }
    }
  }

  return res;
}

import qs from 'qs';

export interface bip21 {
  address: string;
  options: bip21Options;
}

interface bip21Options {
  amount?: number;
  label?: string;
  message?: string;
  time?: number;
  exp?: number;
}

export function decodeBitcoinBip21(text: string) {
  if (!text.startsWith('bitcoin:')) {
    throw new Error('This is not a BIP21 invoice.');
  }
  if (text.startsWith('bitcoin:?')) {
    throw new Error('This is a BIP70+ invoice.');
  }
  let split = text.indexOf(':');
  let splitSub = text.indexOf('?');

  let address = text.slice(split != undefined ? split + 1 : undefined, splitSub != undefined ? splitSub : undefined);
  let otherVariables = splitSub != undefined ? text.slice(splitSub + 1) : '';

  const options = qs.parse(otherVariables) as bip21Options;

  if (options.amount) {
    options.amount = Number(options.amount) * 1e8; // we use satoshis
    if (!isFinite(options.amount)) throw new Error('Invalid amount');
    if (options.amount < 0) throw new Error('Invalid amount');
  }
  return { address, options } as bip21;
}

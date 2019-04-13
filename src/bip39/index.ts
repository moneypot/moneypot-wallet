import * as hi from 'hookedin-lib';
import DEFAULT_WORDLIST from './english';
import pbkdf2 from './pbkdf2-node'; // in browsers, this switches to pbkdf2-browser!


const INVALID_MNEMONIC = 'Invalid mnemonic';
const INVALID_ENTROPY = 'Invalid entropy';
const INVALID_CHECKSUM = 'Invalid mnemonic checksum';

function lpad(str: string, padString: string, length: number): string {
  while (str.length < length) str = padString + str;
  return str;
}

function binaryToByte(bin: string): number {
  return parseInt(bin, 2);
}

function bytesToBinary(bytes: number[]): string {
  return bytes.map(x => lpad(x.toString(2), '0', 8)).join('');
}

function deriveChecksumBits(entropyBuffer: Uint8Array): string {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;

  const hash = hi.SHA256.digest(entropyBuffer);

  return bytesToBinary([...hash]).slice(0, CS);
}

function salt(password?: string): string {
  return 'mnemonic' + (password || '');
}


export async function mnemonicToSeed(
  mnemonic: string,
  password?: string,
): Promise<Uint8Array> {

  const enc = new TextEncoder();
  const mnemonicBuffer = enc.encode(mnemonic || '');
  const saltBuffer = enc.encode(salt((password || '')));


  return await pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64);
}

export function mnemonicToEntropy(
  mnemonic: string,
): Uint8Array {

  const words = (mnemonic || '').normalize('NFKD').split(' ');
  if (words.length % 3 !== 0) throw new Error(INVALID_MNEMONIC);

  // convert word indices to 11 bit binary strings
  const bits = words
    .map(word => {
      const index = DEFAULT_WORDLIST.indexOf(word);
      if (index === -1) throw new Error(INVALID_MNEMONIC);

      return lpad(index.toString(2), '0', 11);
    })
    .join('');

  // split the binary string into ENT/CS
  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  // calculate the checksum and compare
  const entropyBytes = entropyBits.match(/(.{1,8})/g)!.map(binaryToByte);
  if (entropyBytes.length < 16) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length > 32) throw new Error(INVALID_ENTROPY);
  if (entropyBytes.length % 4 !== 0) throw new Error(INVALID_ENTROPY);

  const entropy = new Uint8Array(entropyBytes.length);
  for (let i = 0; i < entropyBytes.length; i++) {
    entropy[i] = entropyBytes[i];
  }
  const newChecksum = deriveChecksumBits(entropy);
  if (newChecksum !== checksumBits) throw new Error(INVALID_CHECKSUM);

  return entropy;
}

export function entropyToMnemonic(
  entropy: Uint8Array,
): string {

  // 128 <= ENT <= 256
  if (entropy.length < 16) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length > 32) throw new TypeError(INVALID_ENTROPY);
  if (entropy.length % 4 !== 0) throw new TypeError(INVALID_ENTROPY);

  const entropyBits = bytesToBinary([...entropy]);
  const checksumBits = deriveChecksumBits(entropy);

  const bits = entropyBits + checksumBits;
  const chunks = bits.match(/(.{1,11})/g)!;
  const words = chunks.map(binary => {
    const index = binaryToByte(binary);
    return DEFAULT_WORDLIST[index];
  });

  return words.join(' ');
}

export function generateMnemonic(
  strength?: number,
): string {
  strength = strength || 256;
  if (strength % 32 !== 0) throw new TypeError(INVALID_ENTROPY);


  return entropyToMnemonic(hi.random(strength / 8));
}

export function validateMnemonic(
  mnemonic: string,
): boolean {
  try {
    mnemonicToEntropy(mnemonic);
  } catch (e) {
    return false;
  }

  return true;
}


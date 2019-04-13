

// hard coded for sha-512
export default async function(password: Uint8Array, salt: Uint8Array, iterations: number, keylen: number): Promise<Uint8Array> {

  const algo = { name: 'PBKDF2' } as any; // force it to work with bad typing..

  const baseKey = await window.crypto.subtle.importKey('raw', password, algo, false, ['deriveBits']);
  const data = await window.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: salt,
    iterations,
    hash: 'SHA-512'
  }, baseKey, keylen * 8);


  return new Uint8Array(data);
}
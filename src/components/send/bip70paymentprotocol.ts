// This is mostly for BIP70 invoices (or) bitpay invoices. Moneypot will only securely decode them. We do not natively support refund addresses or the likes.
// (I do not own some of the code, (Thanks to BIP70-JS).)
import * as hi from 'moneypot-lib';
import keys from './keys.json';

import cacerts from './ca-certificates.json';
import jsrsasign, { RSAKey, KJUR, X509 } from 'jsrsasign';

import jsonDescriptor from './paymentrequests.json';
import protobuf from 'protobufjs';

import OPS from 'bitcoin-ops';
import { toBase58Check, toBech32 } from 'moneypot-lib';
import qs from 'qs';

const root = protobuf.Root.fromJSON(jsonDescriptor);

const PaymentRequest = root.lookupType('PaymentRequest');
const PaymentDetails = root.lookupType('PaymentDetails');
const X509Certificates = root.lookupType('X509Certificates');

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

export interface GeneralizedPaymentDetails {
  expires: string | number;
  outputs: Array<Outputs>;
  memo: string;
  paymentUrl: string;
  time: Date;
  requiredFeeRate: number;
}

interface PaymentRequestX509 {
  paymentDetailsVersion: number;
  pkiData: Uint8Array;
  pkiType: string;
  serializedPaymentDetails: Uint8Array;
  signature: Uint8Array;
}

interface PaymentDetailsX509 {
  expires: string;
  memo: string;
  merchantData: any; // encoded
  network: string;
  outputs: any; // Outputs, amount, address (uint8array)
  paymentUrl: string;
  time: Date; // time
  requiredFeerate: number;
}
interface MerchantDataX509 {
  invoiceID: string;
  merchantID: string;
}

interface certificateX509 {
  certificate: Uint8Array[];
}
interface PaymentRequest {
  chain: string;
  currency: string;
  expires: string;
  instructions: Array<instructions>;
  memo: string;
  network: string;
  paymentId: string;
  paymentUrl: string;
  time: Date;
}

interface instructions {
  type?: string;
  requiredFeeRate?: number;
  outputs: Array<Outputs>;
}

export interface Outputs {
  amount: number;
  address: string;
}

interface identities {
  x_identity: string; // address
  x_public: string; // hi.POD.publickey, but not really
}

let identities: identities[] = [];

for (let i = 0; i < keys.length; i++) {
  for (const k of keys[i].publicKeys) {
    const pk = hi.PublicKey.fromBytes(Buffer.from(k, 'hex'));
    if (pk instanceof Error) {
      throw new Error('Contact moneypot, we added invalid keys.');
    }
    identities.push({
      // owner: keys[i].owner
      x_identity: pk.toLegacyBitcoinAddress(),
      x_public: k,
    });
  }
}
export async function BInvoice(pRequest: string) {
  const c = await pRequest.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  if (c === null) {
    return new Error(); // => invalid url
  }
  const pRequestObject = new URL(pRequest); // onion support, maybe?
  if (pRequestObject.protocol != 'bitcoin:') {
    return new Error(); // => wrong url
  }
  const url = pRequestObject.search.slice(3); // slice ?r= ...ugly

  // this is only for Bitpay's protocol, so it shouldn't really be a sane default ???
  const PaymentRequestResponse = await fetch(url, {
    headers: { 'Content-Type': 'application/payment-request', 'x-paypro-version': '2' },
    method: 'POST',
    body: JSON.stringify({ chain: 'BTC', currency: 'BTC' }),
  });
  if (PaymentRequestResponse.status === 200) {
    const PaymentRequestBody: PaymentRequest = await PaymentRequestResponse.json();
    const headers = PaymentRequestResponse.headers;
    const signature = headers.get('signature');
    const signatureType = headers.get('x-signature-type');
    if (!signature) {
      throw new Error("No signature. we can't verify the legitimacy of the req.");
    }

    if (!signatureType) {
      throw new Error('no type');
    }
    if (signatureType != 'ecc') {
      throw new Error('unk type');
    }

    const identity = headers.get('x-identity');
    if (!identity) {
      throw new Error("no identity, we can't verify.");
    }

    let digest = headers.get('digest');
    if (!digest) {
      throw new Error('no hash given, not actually a problem though.');
    }
    if (digest) {
      digest = digest.split('=')[1];
    }
    const actDigest = hi.Buffutils.toHex(hi.SHA256.digest(hi.Buffutils.fromString(JSON.stringify(PaymentRequestBody))));

    if (!(digest === actDigest)) {
      throw new Error("they do not match (wouldn't necessarily be a problem, but this saves time.).");
    }
    // get the right pub
    const isPub = (): string | undefined => {
      for (const i of identities) {
        if (identity === i.x_identity) {
          return i.x_public;
        }
      }
    };

    const PublicId = isPub();
    if (!PublicId) {
      throw new Error('We did not recognize the provided identity');
    }
    const actSig = hi.Signature.fromBytes(Buffer.from(signature, 'hex'));
    if (actSig instanceof Error) {
      throw new Error('Invalid signature');
    }
    const pubkey = hi.PublicKey.fromBytes(Buffer.from(PublicId, 'hex'));
    if (pubkey instanceof Error) {
      throw new Error('Invalid pubkey');
    }

    const digestu = hi.Buffutils.fromHex(actDigest);
    if (digestu instanceof Error) {
      throw new Error('invalid digestu?');
    }
    // verify signature
    const sigV = actSig.verifyECDSA(digestu, pubkey);
    if (!sigV) {
      throw new Error('We calculated an invalid sig...');
    }

    // return PaymentRequestBody

    return {
      expires: PaymentRequestBody.expires,
      outputs: PaymentRequestBody.instructions[0].outputs, // not tested, but multiple outputs would be stored in outputs[], not in a new instruction? (?)
      memo: PaymentRequestBody.memo,
      paymentUrl: PaymentRequestBody.paymentUrl,
      time: PaymentRequestBody.time,
      requiredFeeRate: PaymentRequestBody.instructions[0].requiredFeeRate,
    } as GeneralizedPaymentDetails;
  }
  // else if !Binvoice, we try traditional BIP70 (but with additional feerate, if no fee rate, we send immediate transaction (6 blocks conf time.)).
  if (PaymentRequestResponse.status != 200) {
    // build a certificate chain.
    function parseCertFrom(string: any, encoding: any) {
      var cert = new jsrsasign.X509();
      cert.readCertHex(Buffer.from(string, encoding).toString('hex'));
      return cert;
    }

    function parseCertFromBase64(string: any) {
      return parseCertFrom(string, 'base64');
    }

    var store: jsrsasign.X509[] = [];
    for (const [key, value] of Object.entries(cacerts)) {
      store.push((parseCertFromBase64(value) as unknown) as jsrsasign.X509);
    }

    // fetch payment data.
    const InvoiceData = await fetch(url, {
      headers: { Accept: 'application/bitcoin-paymentrequest' },
      method: 'GET',
    });
    const z = await (await InvoiceData).arrayBuffer();
    const data = new Uint8Array(z);
    const InvoicePaymentRequests = (PaymentRequest.decode(data) as unknown) as PaymentRequestX509;
    const InvoicePaymentDetails = (PaymentDetails.decode(InvoicePaymentRequests.serializedPaymentDetails) as unknown) as PaymentDetailsX509;
    const InvoiceMerchantData = (hi.Buffutils.toString(InvoicePaymentDetails.merchantData) as unknown) as MerchantDataX509;

    let Outputs: Outputs[] = [];
    // TODO: add support for: // PubKey (pay-to-pubkey / P2PK) // ScriptHash (pay-to-scripthash / P2SH) // MultiSig (pay-to-multisig / P2MS) // Witness PubKeyHash (pay-to-witness-pubkeyhash / P2WPKH) // Witness ScriptHash (pay-to-witness-scripthash / P2WSH)

    for (const output of InvoicePaymentDetails.outputs) {
      if (output) {
        // this is P2PKH only
        if (output.script.length === 25) {
          if (hi.Buffutils.toHex(output.script.slice(0, 1)) === OPS.OP_DUP.toString(16)) {
            if (hi.Buffutils.toHex(output.script.slice(1, 2)) === OPS.OP_HASH160.toString(16)) {
             if (hi.Buffutils.toHex(output.script.slice(2,3)) === hi.Buffutils.toHex(new Uint8Array([0x14]))) { 
              if (hi.Buffutils.toHex(output.script.slice(23, 24)) === OPS.OP_EQUALVERIFY.toString(16)) {
                if (hi.Buffutils.toHex(output.script.slice(24, 25)) === OPS.OP_CHECKSIG.toString(16)) {
                  const address = toBase58Check(hi.Buffutils.concat(output.script.slice(3, 23)), 0);
                  const decode = hi.decodeBitcoinAddress(address);
                  if (!(decode instanceof Error)) {
                    Outputs.push({ amount: output.amount, address: address });
                  }
                }
              }
            }
          }
        }
      }
        // this is P2WPKH
        if (output.script.length === 22) {
          if (hi.Buffutils.toHex(output.script.slice(0, 1)) === '00') { //  OPS.OP_0.toString(16) 
            if (hi.Buffutils.toHex(output.script.slice(1, 2)) === hi.Buffutils.toHex(new Uint8Array([0x14]))) { 
              const address = output.script.slice(2)
              const words = toBech32(address, 0, 'bc')
              if (!(hi.decodeBitcoinAddress(words) instanceof Error)) { 
                Outputs.push({amount: output.amount, address: words})
              }
            }

          }
        }
        // this is P2SH
        if (output.script.length === 23) {  
          if (hi.Buffutils.toHex(output.script.slice(0, 1)) === OPS.OP_HASH160.toString(16)) { 
            if (hi.Buffutils.toHex(output.script.slice(1,2)) === hi.Buffutils.toHex(new Uint8Array([0x014]))) { 
              if (hi.Buffutils.toHex(output.script.slice(22,23)) === OPS.OP_EQUAL.toString(16)) { 
                const address = toBase58Check(output.script.slice(2,22), 5);
                if (!(hi.decodeBitcoinAddress(address) instanceof Error)) {
                   Outputs.push({amount: output.amount, address: address})
                }
              }
            }
          }
        }
      }
    }
    // verify signature.
    const Certificates = (X509Certificates.decode(InvoicePaymentRequests.pkiData) as unknown) as certificateX509;
    const certs = [];
    for (const c of Certificates.certificate) {
      certs.push(certFromDER(hi.Buffutils.toHex(c)));
    }
    function certFromDER(derBuf: string) {
      var cert = new jsrsasign.X509();
      cert.readCertHex(derBuf);
      return cert;
    }

    // complete the chain up to the last certificate, try the last certificate -1 against pubkey of stored cacerts.
    // encode paymentrequest, try against the first certificate.

    var publicKey = certs[0].getPublicKey();

    let keyType: string;
    if (publicKey instanceof KJUR.crypto.ECDSA) {
      keyType = 'ECDSA';
    } else if (publicKey instanceof RSAKey) {
      keyType = 'RSA';
    } else {
      throw new Error('Unknown public key type');
    }

    let hashAlg: string;
    if (InvoicePaymentRequests.pkiType === 'x509+sha1') {
      hashAlg = 'SHA1';
    } else if (InvoicePaymentRequests.pkiType === 'x509+sha256') {
      hashAlg = 'SHA256';
    } else {
      throw new Error('Unknown PKI type or no signature algorithm specified.');
    }

    function getDataToSign(request: PaymentRequestX509) {
      var tmp = request.signature;
      request.signature = new Uint8Array();
      var encoded = new Buffer(PaymentRequest.encode(request).finish());
      request.signature = tmp;
      return encoded;
    }

    function validateSig(request: PaymentRequestX509, cert: X509) {
      var sig = new KJUR.crypto.Signature({ alg: `${hashAlg}with${keyType}` });
      sig.init(cert.getPublicKey());
      sig.updateHex(getDataToSign(request).toString('hex'));
      return sig.verify(Buffer.from(request.signature).toString('hex'));
    }

    const isVerified = validateSig(InvoicePaymentRequests, certFromDER(hi.Buffutils.toHex(Certificates.certificate[0])));

    if (!isVerified) {
      throw new Error("Couldn't verify payment details against certificate");
    }

    // verify up to root CA .
    for (let index = 0; index < certs.length; index++) {
      const element = certs[index];
      const intermediates = certs[index + 1];
      if (!intermediates) {
        break;
      }
      const pubkey = intermediates.getPublicKey();

      const hasVerifiedIntermediates = element.verifySignature(pubkey);
      // (!hasVerifiedIntermediates)
      if (hasVerifiedIntermediates === false) {
        throw new Error("Couldn't verify intermediates up to root.");
      }
    }

    // verify our CAstore against their second level certificate to make sure we have a valid root.

    let hasVerifiedSecondRoot = false;
    for (const stores of store) {
      const intLast = certs[certs.length - 2]; // second last
      const anyTrue = intLast.verifySignature(stores.getPublicKey());

      if (anyTrue === true) {
        hasVerifiedSecondRoot = true;
        break;
      }
      if (anyTrue === false) {
        continue;
      }
    }
    if (hasVerifiedSecondRoot === false) {
      throw new Error("Could't verify x509 certs against CAstore. Please contact moneypot.");
    }
    // verify intermediates until we have the last, verify the last intermediate against our stored CA's.
    // if there's a match, validate, else throw.

    // verify time
    let currentTime = new Date(Date.now());

    for (const certificate of certs) {
      let isValid = false;
      isValid = jsrsasign.zulutodate(certificate.getNotAfter()) > currentTime;
      if (!isValid) {
        throw new Error('One or more certificates are no longer valid.');
      }
      isValid = jsrsasign.zulutodate(certificate.getNotBefore()) < currentTime;
      if (!isValid) {
        throw new Error('One or more certificates are no longer valid.');
      }
    }

    const r = /[^w{3}//\.]([a-zA-Z0-9]([a-zA-Z0-9\-]{0,65}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/gim;

    const newUrl = url.match(r);
    if (!newUrl) {
      throw new Error('?');
    }

    const IssuerMustBeEqual = certs[0].getSubjectHex().includes(hi.Buffutils.toHex(hi.Buffutils.fromString(newUrl[0])));
    if (!IssuerMustBeEqual) {
      return new Error('Invalid domain specified.');
    }

    return {
      expires: InvoicePaymentDetails.expires,
      outputs: Outputs,
      memo: InvoicePaymentDetails.memo,
      paymentUrl: InvoicePaymentDetails.paymentUrl,
      time: InvoicePaymentDetails.time,
      requiredFeeRate: InvoicePaymentDetails.requiredFeerate,
      merchantData: InvoicePaymentDetails.merchantData,
    } as GeneralizedPaymentDetails;
  } 
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

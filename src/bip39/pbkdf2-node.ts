// import { pbkdf2 } from 'crypto';

// // hardcoded for sha512
// export default function(password: Uint8Array, salt: Uint8Array, iterations: number, keylen: number): Promise<Uint8Array> {

//   return new Promise((resolve, reject) => {

//     pbkdf2(password, salt, iterations, keylen, 'sha512', (err, data) => {
//       if (err) {
//         reject(err);
//         return;
//       }

//       resolve(data);
//     });
//   });

// }
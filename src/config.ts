export const inputWeight = 149;

// 1 input, 2 outputs all segwit
export const p2wpkhTransactionWeight = 561;
// 1 input 2 outputs, 1 output wrapped
export const p2shp2wpkhTransactionWeight = 565;
// 1 input 2 outputs 1 output legacy
export const p2pkhTransactionWeight = 573;
// 1 input 2 outputs 1 output multisig native segwit
export const p2wshTransactionWeight = 609;

// individual outputs
export const p2pkh = 34 * 4;
export const p2shp2wpkh = 32 * 4;
export const p2wpkh = 31 * 4;
export const p2wsh = 43 * 4;




// this is equal to native segwit multisig v0, make a seperate const anyway to keep things clean(er)
export const p2tr = 43 * 4;
export const p2trTransactionWeight = 609;
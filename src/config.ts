export const inputWeight = 149;

// 1 input, 2 outputs all segwit
export const templateTransactionWeight = 561;
// 1 input 2 outputs, 1 output wrapped
export const wrappedTransactionWeight = 565;
// 1 input 2 outputs 1 output legacy
export const legacyTransactionWeight = 573;

//(TODO: all inputs are assumed native... :/ )

export const legacyOutput = 34 * 4;
//multisig / nested segwit
export const wrappedOutput = 32 * 4;
// native segwit
export const segwitOutput = 31 * 4;
// segwit multi
export const segmultiOutput = 43 * 4;
// 1 input 2 outputs, 1 output multisig segwit?
export const segmultiTransactionWeight = 609;
//todo recheck this

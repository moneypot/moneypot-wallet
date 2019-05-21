export function mustExist<T>(v: T | undefined): T {
  if (v === undefined || v === null) {
    console.trace('assertion: does not exist');
    throw new Error('assertion: must exist');
  }
  return v;
}

export function notError<T>(v: T | Error): T {
  if (v instanceof Error) {
    console.trace('assertion: there is an error:', v);
    throw v;
  }
  return v;
}

export function mustEqual<T>(a: T, b: T) {
  if (a !== b) {
    console.error('assertion failure: ', a, ' does not equal ', b);
    throw new Error('assertion failure');
  }
}

export function isTrue(a: any): a is true {
  if (a !== true) {
    console.error('assertion failure, got non-true');
    throw new Error('assertion failure');
  }

  return true;
}

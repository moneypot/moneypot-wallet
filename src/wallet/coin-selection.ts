import { isTrue } from '../util';

interface Coin {
  magnitude: number;
}

type FindResult<T> = { found: T[]; excess: number };

export function findAtLeast<T extends Coin>(coins: T[], target: number): FindResult<T> | number | undefined {
  isTrue(Number.isSafeInteger(target));
  isTrue(target > 0);

  const candidates = [...coins] // first we copy (avoid mutation)
    .sort((a, b) => b.magnitude - a.magnitude) // sort by biggest first...
    .slice(0, 255); // max coins a transfer can have

  shuffle(candidates);

  let amount = 0;

  for (const [i, coin] of candidates.entries()) {
    amount += 2 ** coin.magnitude;

    if (amount >= target) {
      return {
        found: candidates.slice(0, i + 1),
        excess: amount - target,
      };
    }
  }
  if (amount < target) {
    return target - amount;
  }
  return undefined;
}

function shuffle<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // swap elements
  }
}

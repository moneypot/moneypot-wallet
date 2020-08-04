import * as Docs from '../docs';
import getClaimableByInputOwner from '../requests/get-claimable-by-input-owner';
import Config from '../config';

// unoptimized
const ctx: Worker = self as any;

ctx.addEventListener('message', (message: MessageEvent) => syncWorkers(message.data[0], message.data[1]));

async function syncWorkers(coins: Docs.Coin[], config: Config) {
  for (const coin of coins) {
    const claimable = await getClaimableByInputOwner(config, coin.owner);
    if (!claimable) {
      continue;
    }
    ctx.postMessage([claimable.toPOD(), coin.owner]);
  }
  ctx.postMessage('d');
}

import Config from '../config';
import { getStatusesByClaimable } from '../requests/index';

// unoptimized
const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener('message', (message: MessageEvent) => syncWorkersClaimable(message.data[0], message.data[1]));

async function syncWorkersClaimable(claimables: any[], config: Config) {
  for (const claimable of claimables) {
    const statuses = await getStatusesByClaimable(config, claimable.hash);
    const z = statuses.map(s => s.toPOD());

    ctx.postMessage(z);
  }
  ctx.postMessage('d');
}

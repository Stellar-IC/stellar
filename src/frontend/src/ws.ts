import IcWebSocket, {
  createWsConfig,
  generateRandomIdentity,
} from 'ic-websocket-js';

import { canisterId, websockets } from '../../declarations/websockets';

// Production
// const gatewayUrl = 'wss://gateway.icws.io';
// const icUrl = 'https://icp0.io';

// Local test
const gatewayUrl = 'ws://127.0.0.1:8081';
const icUrl = 'http://127.0.0.1:4943';

// eslint-disable-next-line import/no-mutable-exports
export const createWebSocket = () => {
  const ws = new IcWebSocket(
    gatewayUrl,
    undefined,
    createWsConfig({
      canisterId,
      canisterActor: websockets,
      identity: generateRandomIdentity(),
      networkUrl: icUrl,
    })
  );

  return ws;
};

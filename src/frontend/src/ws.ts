import { ActorSubclass } from '@dfinity/agent';
import IcWebSocket, {
  createWsConfig,
  generateRandomIdentity,
} from 'ic-websocket-js';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';

// Production
// const gatewayUrl = 'wss://gateway.icws.io';
// const icUrl = 'https://icp0.io';

// Local test
const gatewayUrl = 'ws://127.0.0.1:8081';
const icUrl = 'http://127.0.0.1:4943';

// eslint-disable-next-line import/no-mutable-exports
export const createWebSocket = <T extends _WS_CANISTER_SERVICE>(opts: {
  canisterId: string;
  canisterActor: ActorSubclass<T>;
}) => {
  const { canisterActor, canisterId } = opts;
  const ws = new IcWebSocket(
    gatewayUrl,
    undefined,
    createWsConfig({
      canisterId,
      canisterActor,
      identity: generateRandomIdentity(),
      networkUrl: icUrl,
    })
  );

  return ws;
};

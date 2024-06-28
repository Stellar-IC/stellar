import { ActorSubclass } from '@dfinity/agent';
import IcWebSocket, {
  createWsConfig,
  generateRandomIdentity,
} from 'ic-websocket-js';
import { _WS_CANISTER_SERVICE } from 'ic-websocket-js/lib/cjs/idl';

import { network } from '@/config';

import {
  WebSocketMessage,
  _SERVICE,
} from '../../../../declarations/workspace/workspace.did';

import { DocumentSyncProvider, DocumentSyncProviderEvent } from './types';

function createWebSocket<T extends _WS_CANISTER_SERVICE>(opts: {
  canisterId: string;
  canisterActor: ActorSubclass<T>;
}) {
  const { canisterActor, canisterId } = opts;
  const { gatewayUrl, icUrl } =
    network === 'local'
      ? { gatewayUrl: 'ws://127.0.0.1:8081', icUrl: 'http://127.0.0.1:4943' }
      : { gatewayUrl: 'wss://gateway.icws.io', icUrl: 'https://icp0.io' };
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
}

type Listener = any;

export class WebSocketProvider implements DocumentSyncProvider {
  private _ws: IcWebSocket<_SERVICE>;
  private _listeners: Map<string, Listener[]>;

  constructor(opts: {
    canisterId: string;
    canisterActor: ActorSubclass<_SERVICE>;
  }) {
    const { canisterId, canisterActor } = opts;

    this._listeners = new Map();
    // Create a WebSocket connection
    this._ws = createWebSocket({
      canisterId,
      canisterActor,
    });
    this._ws.onclose = () => {
      console.log('WebSocket connection closed');
      this._listeners.get('close')?.forEach((listener) => listener());
    };
    this._ws.onopen = () => {
      console.log('WebSocket connection opened');
      this._listeners.get('open')?.forEach((listener) => listener());
    };
    this._ws.onerror = (err) => {
      console.log('WebSocket connection error', err);
      this._listeners.get('error')?.forEach((listener) => listener(err));
    };
    this._ws.onmessage = (msg) => {
      console.log('WebSocket message', msg);
      this._listeners.get('message')?.forEach((listener) => listener(msg));
    };
  }

  on(
    event: 'message',
    listener: (message: MessageEvent<WebSocketMessage>) => void
  ): void;
  on(event: 'open', listener: () => void): void;
  on(event: 'close', listener: () => void): void;
  on(event: 'error', listener: (error: any) => void): void;
  on(event: DocumentSyncProviderEvent, listener: (...args: any[]) => void) {
    const currentListeners = this._listeners.get(event) || [];
    this._listeners.set(event, [...currentListeners, listener]);
  }

  off(event: string, listener: Listener) {
    this._listeners.set(
      event,
      this._listeners.get(event)?.filter((l) => l !== listener) || []
    );
  }

  send(message: WebSocketMessage) {
    // Send a message to the WebSocket server
    this._ws.send(message);
  }
}

import { WebSocketMessage } from '../../../../declarations/workspace/workspace.did';

export type DocumentSyncProviderEvent = 'open' | 'close' | 'message' | 'error';
export type DocumentSyncProvider = {
  send: (message: WebSocketMessage) => void;
  on: {
    (
      event: 'message',
      listener: (message: MessageEvent<WebSocketMessage>) => void
    ): void;
    (event: 'open', listener: () => void): void;
    (event: 'close', listener: () => void): void;
    (event: 'error', listener: (error: any) => void): void;
  };
};

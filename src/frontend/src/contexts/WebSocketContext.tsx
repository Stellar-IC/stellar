import IcWebSocket from 'ic-websocket-js';
import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';

import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { createWebSocket } from '@/ws';

import {
  AppMessage,
  _SERVICE,
} from '../../../declarations/websockets/websockets.did';

type WebSocketContextProviderProps = {
  children: React.ReactNode;
  retryInterval?: number;
};

const _sendMessage = (
  ws: IcWebSocket<_SERVICE, AppMessage>,
  message: AppMessage
) => {
  if (!ws) {
    console.log('WebSocket not connected');
    return;
  }

  try {
    ws.send(message);
  } catch (error) {
    console.log('Error on sending message', error);
  }
};

// eslint-disable-next-line no-spaced-func
export const WebSocketContext = createContext<{
  state: 'connecting' | 'connected' | 'closed';
  sendMessage: (message: AppMessage) => void;
} | null>(null);

export const WebSocketContextProvider = ({
  children,
  retryInterval = 5000,
}: WebSocketContextProviderProps) => {
  const { identity, isAuthenticated } = useAuthContext();
  const [ws, setWs] = useState<IcWebSocket<_SERVICE, AppMessage> | null>(null);
  const [state, setState] = useState<'connecting' | 'connected' | 'closed'>(
    'connecting'
  );

  const sendMessage = useCallback(
    (message: AppMessage) => {
      if (!ws) throw new Error('WebSocket not connected');
      _sendMessage(ws, message);
    },
    [ws]
  );

  useEffect(() => {
    let socket: IcWebSocket<_SERVICE, AppMessage>;

    if (isAuthenticated) {
      socket = createWebSocket();

      socket.onopen = () => {
        setState('connected');
        console.log('Sending associateUser message');
        _sendMessage(socket, {
          associateUser: { userId: identity.getPrincipal() },
        });
      };
      socket.onclose = () => {
        setState('closed');
      };
      socket.onerror = (error) => {
        console.log('Error:', error);
      };
      socket.onmessage = (message) => {
        console.log('Received message:', message);
      };

      setWs(socket);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [identity, isAuthenticated]);

  const reestablishConnection = useCallback(() => {
    if (ws && ws.readyState !== ws.CLOSED) return null;
    if (state === 'connecting') return null;

    setState('connecting');

    const newWs = createWebSocket();
    newWs.onopen = () => {
      setState('connected');
      console.log('Sending associateUser message');
      _sendMessage(newWs, {
        associateUser: { userId: identity.getPrincipal() },
      });
    };
    newWs.onclose = () => {
      setState('closed');
    };
    newWs.onerror = (error) => {
      console.log('Error:', error);
    };
    newWs.onmessage = (message) => {
      console.log('Received message:', message);
    };

    setWs(newWs);

    return newWs;
  }, [identity, state, ws, setWs]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (state !== 'connected') {
      timeout = setTimeout(() => {
        reestablishConnection();
      }, retryInterval);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [retryInterval, state, reestablishConnection]);

  return (
    <WebSocketContext.Provider value={{ state, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketContextProvider'
    );
  }

  return context;
};

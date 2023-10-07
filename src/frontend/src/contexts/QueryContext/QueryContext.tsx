import { ActorMethod } from '@dfinity/agent';
import { createContext } from 'react';

import { CanisterId } from '@/types';

import { Cache } from './types';

export const QueryContext = createContext<{
  cache: Cache;
  getCacheKey: <ArgsT extends unknown[], DataT>(
    canisterId: CanisterId,
    query: ActorMethod<ArgsT, DataT>,
    options?: { arguments?: ArgsT }
  ) => string;
  send: <ArgsT extends unknown[], DataT>(
    canisterId: CanisterId,
    query: ActorMethod<ArgsT, DataT>,
    options?: { arguments?: ArgsT }
  ) => Promise<DataT>;
} | null>(null);

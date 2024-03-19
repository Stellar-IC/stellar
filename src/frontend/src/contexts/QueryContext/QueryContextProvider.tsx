import { ActorMethod } from '@dfinity/agent';
import { PropsWithChildren, useCallback, useMemo } from 'react';

import { CanisterId } from '@/types';

import { QueryContext } from './QueryContext';
import { Cache } from './types';

export function QueryContextProvider({ children }: PropsWithChildren) {
  const cache: Cache = useMemo(() => ({}), []);

  const getCacheKey = useCallback(
    <ArgsT extends unknown[], DataT>(
      canisterId: CanisterId,
      query: ActorMethod<ArgsT, DataT>,
      options?: { arguments?: ArgsT }
    ): string =>
      `${canisterId}__${query.name}__${JSON.stringify(
        options?.arguments?.map((arg) => {
          if (typeof arg === 'bigint') {
            return arg.toString();
          }
          return arg;
        }) || []
      )}`,
    []
  );

  const send = useCallback(
    <ArgsT extends unknown[], DataT>(
      canisterId: CanisterId,
      query: ActorMethod<ArgsT, DataT>,
      options?: { arguments?: ArgsT }
    ): Promise<DataT> => {
      const { arguments: args } = options || {};
      // const cacheKey = getCacheKey(canisterId, query, options);
      return query(...(args || ([] as unknown[] as ArgsT)));
      // cache[cacheKey] = result;
    },
    []
  );

  return (
    <QueryContext.Provider value={{ cache, getCacheKey, send }}>
      {children}
    </QueryContext.Provider>
  );
}

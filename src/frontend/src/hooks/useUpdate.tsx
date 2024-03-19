import { ActorMethod } from '@dfinity/agent';
import { useCallback, useState } from 'react';

import { useQueryContext } from '@/contexts/QueryContext/useQueryContext';
import { CanisterId } from '@/types';

export function useUpdate<ArgsT extends unknown[], DataT>(
  canisterId: CanisterId,
  query: ActorMethod<ArgsT, DataT>,
  options?: { arguments?: ArgsT }
): [
  (input: ArgsT) => Promise<DataT>,
  { data: DataT | null; isLoading: boolean }
] {
  const context = useQueryContext();

  if (!context) {
    throw new Error('useUpdate must be used within a QueryContextProvider');
  }

  const { send } = context;
  const [data, setData] = useState<DataT | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendUpdate = useCallback(
    (input: ArgsT): Promise<DataT> => {
      setIsLoading(true);
      return send(canisterId, query, {
        ...options,
        arguments: [...input] as unknown[] as ArgsT,
      })
        .then((data) => {
          setData(data);
          setIsLoading(false);
          return data;
        })
        .catch((error) => {
          setIsLoading(false);
          throw error;
        });
    },
    [canisterId, query, options, send]
  );

  return [sendUpdate, { isLoading, data }];
}

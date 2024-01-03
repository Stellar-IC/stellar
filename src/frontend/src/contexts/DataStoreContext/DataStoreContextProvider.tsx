import { PropsWithChildren, useCallback, useState } from 'react';

import { DataStoreContext } from './DataStoreContext';
import { DataStore } from './types';

function getKey(root: string, externalId: string) {
  return `${root}.${externalId}`;
}

export function DataStoreContextProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<DataStore>({});

  const put = useCallback(
    <DataT, LocalStorageDataT>(
      key: string,
      externalId: string,
      value: DataT,
      opts: {
        prepareForStorage: (data: DataT) => LocalStorageDataT;
      }
    ) => {
      const fullKey = getKey(key, externalId);
      const localStorageData = opts.prepareForStorage(value);
      setStore((data) => ({ ...data, [fullKey]: value }));
      localStorage.setItem(`data.${fullKey}`, JSON.stringify(localStorageData));
    },
    [setStore]
  );

  const get = useCallback(
    <DataT,>(key: string, externalId: string): DataT | null => {
      const fullKey = getKey(key, externalId);
      const item = store[fullKey];
      if (item) return item as DataT;
      return null;
    },
    [store]
  );

  return (
    <DataStoreContext.Provider value={{ store, get, put }}>
      {children}
    </DataStoreContext.Provider>
  );
}

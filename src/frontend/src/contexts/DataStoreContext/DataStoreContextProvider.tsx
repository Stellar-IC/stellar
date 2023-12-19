import { PropsWithChildren, useCallback, useState } from 'react';

import { DataStoreContext } from './DataStoreContext';

function getKey(root: string, externalId: string) {
  return `${root}.${externalId}`;
}

type DataStore = Record<string, unknown>;

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

  return (
    <DataStoreContext.Provider value={{ store, put }}>
      {children}
    </DataStoreContext.Provider>
  );
}

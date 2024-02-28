import { createContext } from 'react';

import { DataStore } from './types';

// eslint-disable-next-line no-spaced-func
export const DataStoreContext = createContext<{
  store: DataStore;
  get: <DataT>(key: string, externalId: string) => DataT | null;
  put: <DataT, LocalStorageDataT>(
    key: string,
    externalId: string,
    value: DataT,
    opts: {
      prepareForStorage: (data: DataT) => LocalStorageDataT;
    }
  ) => void;
} | null>(null);

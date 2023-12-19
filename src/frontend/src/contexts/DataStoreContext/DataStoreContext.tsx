import { createContext } from 'react';

// eslint-disable-next-line no-spaced-func
export const DataStoreContext = createContext<{
  store: {};
  put: <DataT, LocalStorageDataT>(
    key: string,
    externalId: string,
    value: DataT,
    opts: {
      prepareForStorage: (data: DataT) => LocalStorageDataT;
    }
  ) => void;
} | null>(null);

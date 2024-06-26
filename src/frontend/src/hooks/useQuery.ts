import { useCallback, useState } from 'react';
import { stringify } from 'uuid';

import { UUID } from '../../../declarations/workspace/workspace.did';

export function useQuery<
  ArgsT extends unknown[],
  ReturnT extends object,
  DataT,
  StorageDataT
>(
  queryName: string,
  queryFn: (...args: ArgsT) => Promise<ReturnT>,
  options: {
    initialData?: Record<string, DataT>;
    serialize: (data: ReturnT) => DataT | null;
    prepareForStorage: (
      data: Record<string, DataT>
    ) => Record<string, StorageDataT>;
    prepareFromStorage: (
      data: Record<string, StorageDataT>
    ) => Record<string, DataT>;
    onSuccess?: (result: ReturnT) => void;
    getExternalId: (result: ReturnT) => UUID | null;
  }
) {
  const {
    onSuccess,
    initialData,
    serialize,
    getExternalId,
    prepareForStorage,
    prepareFromStorage,
  } = options;

  const [data, setData] = useState<Record<string, DataT>>(initialData || {});
  const sendQuery = useCallback(
    (query: (...args: ArgsT) => Promise<ReturnT>, ...args: ArgsT) =>
      query(...args).then((result) => {
        if (onSuccess) onSuccess(result);
        return result;
      }),
    [onSuccess]
  );

  const loadFromIC = useCallback(
    (...args: ArgsT) => sendQuery(queryFn, ...args),
    [sendQuery, queryFn]
  );

  const loadFromLocalStorage = useCallback(
    (
      queryName: string,
      options: { onSuccess: (result: Record<string, DataT>) => void }
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { onSuccess } = options;
      const storageData = localStorage.getItem(`data.${queryName}`);
      const dataFromStorage = storageData
        ? (JSON.parse(storageData) as Record<string, StorageDataT>)
        : null;
      if (!dataFromStorage) return;
      const preparedDataFromStorage = prepareFromStorage(dataFromStorage);
      onSuccess(preparedDataFromStorage);
    },
    [prepareFromStorage]
  );

  const query = useCallback(
    (...args: ArgsT) => {
      const dataFromStorage = localStorage.getItem('data');

      function loadFromRemote() {
        return loadFromIC(...args).then((result) => {
          setData((prevData) => {
            if (!('ok' in result)) return prevData;

            const externalId = getExternalId(result);
            if (!externalId) return prevData;

            const resultBody = serialize(result);
            if (!resultBody) return prevData;

            const updatedData: Record<string, DataT> = {
              ...prevData,
              [stringify(externalId)]: resultBody,
            };
            const dataForStorage = prepareForStorage(updatedData);

            localStorage.setItem(
              `data.${queryName}`,
              JSON.stringify(dataForStorage)
            );

            return { ...prevData, ...updatedData };
          });

          return result;
        });
      }

      if (!dataFromStorage) return loadFromRemote();

      loadFromLocalStorage(queryName, {
        onSuccess: (deserializedData) => {
          setData((_data) => ({
            ..._data,
            ...deserializedData,
          }));
        },
      });

      return loadFromRemote();
    },
    [
      loadFromIC,
      loadFromLocalStorage,
      queryName,
      serialize,
      getExternalId,
      prepareForStorage,
    ]
  );

  const updateLocal = useCallback(
    (externalId: string, updatedData: DataT) => {
      loadFromLocalStorage(queryName, {
        onSuccess: (storageData) => {
          const dataForStorage = prepareForStorage({
            ...storageData,
            [externalId]: updatedData,
          });
          localStorage.setItem(
            `data.${queryName}`,
            JSON.stringify(dataForStorage)
          );
        },
      });

      setData((prev) => ({
        ...prev,
        [externalId]: {
          ...prev[externalId],
          ...updatedData,
        },
      }));
    },
    [loadFromLocalStorage, prepareForStorage, queryName, setData]
  );

  return { data, query, isLoading: false, updateLocal };
}

import { useCallback, useState } from 'react';

type UseDataStoreOptions<DataT, LocalStorageDataT> = {
  // The initial data to load into the data store
  initialData?: Record<string, DataT>;

  // A function to map data from state to local storage
  prepareForStorage: (
    data: Record<string, DataT>
  ) => Record<string, LocalStorageDataT>;

  // A function to map data from local storage to state
  prepareFromStorage: (
    data: Record<string, LocalStorageDataT>
  ) => Record<string, DataT>;
};

export function useDataStore<DataT, LocalStorageDataT>(
  dataKey: string,
  options: UseDataStoreOptions<DataT, LocalStorageDataT>
) {
  const { initialData, prepareForStorage, prepareFromStorage } = options;
  const [data, setData] = useState<Record<string, DataT>>(initialData || {});

  const loadFromLocalStorage = useCallback(
    (
      dataKey: string,
      options: { onSuccess: (result: Record<string, DataT>) => void }
    ) => {
      const { onSuccess } = options;
      const dataFromLocalStorage = localStorage.getItem(`data.${dataKey}`);
      const dataFromStorage = dataFromLocalStorage
        ? (JSON.parse(dataFromLocalStorage) as Record<
            string,
            LocalStorageDataT
          >)
        : null;
      if (!dataFromStorage) return;
      const preparedDataFromStorage = prepareFromStorage(dataFromStorage);
      onSuccess(preparedDataFromStorage);
    },
    [prepareFromStorage]
  );

  const updateLocal = useCallback(
    (externalId: string, updatedData: DataT) => {
      loadFromLocalStorage(dataKey, {
        onSuccess: (storageData) => {
          const dataForStorage = prepareForStorage({
            ...storageData,
            [externalId]: updatedData,
          });
          localStorage.setItem(
            `data.${dataKey}`,
            JSON.stringify(dataForStorage)
          );
        },
      });

      setData((prev) => ({
        ...prev,
        [externalId]: updatedData,
      }));
    },
    [loadFromLocalStorage, prepareForStorage, dataKey, setData]
  );

  return { data, isLoading: false, updateLocal };
}

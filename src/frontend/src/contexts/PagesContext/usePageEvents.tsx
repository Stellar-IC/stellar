import { useCallback, useState } from 'react';

import { serializeBlockEvent } from '@/modules/events/serializers';
import { SerializedBlockEvent } from '@/modules/events/types';

import { BlockEvent } from '../../../../declarations/workspace/workspace.did';

export const usePageEvents = () => {
  const [events, setEvents] = useState<Record<string, SerializedBlockEvent[]>>(
    {}
  );

  const serializeAndStoreEventLocally = useCallback(
    (pageExternalId: string, event: BlockEvent) => {
      setEvents((prev) => {
        const serializedEvent = serializeBlockEvent(event);
        const updatedData = { ...prev };

        if (pageExternalId in updatedData) {
          updatedData[pageExternalId].push(serializedEvent);
        } else {
          updatedData[pageExternalId] = [serializedEvent];
        }

        // Store event in local storage
        localStorage.setItem(
          `events.${pageExternalId}`,
          JSON.stringify({
            ...updatedData,
            index: updatedData.index,
          })
        );

        return updatedData;
      });
    },
    []
  );

  const clearEvents = useCallback(() => {
    setEvents({});
  }, []);

  // const loadFromLocalStorage = useCallback(
  //     (
  //         queryName: string,
  //         options: {
  //             onSuccess: (
  //                 result: Record<string, SaveEventTransactionUpdateInput>
  //             ) => void;
  //         }
  //     ) => {
  //         const { onSuccess } = options;
  //         const storageData = localStorage.getItem(`data.${queryName}`);
  //         const dataFromStorage = storageData
  //             ? (JSON.parse(storageData) as Record<string, StorageDataT>)
  //             : null;
  //         if (!dataFromStorage) return;
  //         const preparedDataFromStorage = prepareFromStorage(dataFromStorage);
  //         onSuccess(preparedDataFromStorage);
  //     },
  //     [prepareFromStorage]
  // );

  return {
    events,
    storeEventLocal: serializeAndStoreEventLocally,
    clearEvents,
  };
};

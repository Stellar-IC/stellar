import { useCallback, useState } from 'react';
import { serializeBlock } from '@/modules/domain/block/serializers';
import { Block } from '@/types';
import { SaveEventUpdateInput } from '../../../../../declarations/workspace/workspace.did';

type SerializedSaveEventUpdateInput = {
  blockCreated: {
    eventType: { blockCreated: null };
    payload: {
      block: Omit<Block, 'id'>;
      index: number;
    };
  };
};

export const usePageEvents = () => {
  const [events, setEvents] = useState<
    Record<string, SerializedSaveEventUpdateInput[]>
  >({});

  const addEvent = useCallback(
    (pageExternalId: string, event: SaveEventUpdateInput) => {
      setEvents((prev) => {
        if ('blockCreated' in event) {
          const serializedEvent: SerializedSaveEventUpdateInput = {
            ...event,
            blockCreated: {
              eventType: { blockCreated: null },
              payload: {
                ...event.blockCreated.payload,
                block: serializeBlock(event.blockCreated.payload.block),
                index: Number(event.blockCreated.payload.index),
              },
            },
          };
          const updatedData = { ...prev };

          if (pageExternalId in updatedData) {
            updatedData[pageExternalId].push(serializedEvent);
            return updatedData;
          }

          updatedData[pageExternalId] = [serializedEvent];

          localStorage.setItem(
            `events.${pageExternalId}`,
            JSON.stringify({
              ...updatedData,
              index: updatedData.index,
            })
          );

          return updatedData;
        }

        return prev;
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
  //                 result: Record<string, SaveEventUpdateInput>
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

  return { events, addEvent, clearEvents };
};

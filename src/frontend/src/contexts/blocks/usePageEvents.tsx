import { useCallback, useState } from 'react';
import { serializeBlock } from '@/modules/domain/block/serializers';
import { Block } from '@/types';
import { DEFAULT_BOUNDARY } from '@stellar-ic/lseq-ts/constants';
import { base } from '@stellar-ic/lseq-ts/utils';
import { BlockEvent } from '../../../../declarations/workspace/workspace.did';

type SerializedBlockEvent = {
  blockCreated: {
    payload: {
      block: Omit<Block, 'id'>;
      index: number;
    };
  };
};

export const usePageEvents = () => {
  const [events, setEvents] = useState<Record<string, SerializedBlockEvent[]>>(
    {}
  );

  const serializeAndStoreEventLocally = useCallback(
    (pageExternalId: string, event: BlockEvent) => {
      setEvents((prev) => {
        if ('blockCreated' in event) {
          const serializedEvent: SerializedBlockEvent = {
            ...event,
            blockCreated: {
              payload: {
                ...event.blockCreated.data,
                block: serializeBlock({
                  ...event.blockCreated.data.block,
                  content: {
                    allocationStrategies: [],
                    boundary: DEFAULT_BOUNDARY,
                    rootNode: {
                      base: base(0),
                      children: [],
                      deletedAt: [],
                      identifier: [],
                      value: '',
                    },
                  },
                  properties: {
                    title: [],
                    checked: [],
                  },
                }),
                index: Number(event.blockCreated.data.index),
              },
            },
          };
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

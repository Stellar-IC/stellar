import { useCallback, useState } from 'react';

import { serializeBlockEvent } from '@/modules/events/serializers';
import { SerializedBlockEvent } from '@/modules/events/types';

import { BlockEvent } from '../../../../declarations/workspace/workspace.did';

export const usePageEvents = ({
  storageAdapter,
}: {
  storageAdapter: {
    put: (item: SerializedBlockEvent, key: string) => Promise<void>;
  };
}) => {
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

        storageAdapter.put(serializedEvent, serializedEvent.uuid);

        return updatedData;
      });
    },
    [storageAdapter]
  );

  return {
    events,
    storeEventLocal: serializeAndStoreEventLocally,
  };
};

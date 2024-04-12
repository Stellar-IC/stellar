import { useCallback } from 'react';
import { useErrorBoundary } from 'react-error-boundary';

import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { db } from '@/db';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { store } from '@/modules/data-store';
import { Block } from '@/types';

import { useSaveEvents } from './canisters/workspace/updates/useSaveEvents';
import { PartialBlockEvent } from './documents/useTextBlockKeyboardEventHandlers/types';
import { buildEvent } from './documents/useTextBlockKeyboardEventHandlers/utils';

export const useEditorSave = () => {
  const { workspaceId } = useWorkspaceContext();
  const { userId, identity } = useAuthContext();

  const [saveEvents] = useSaveEvents({
    identity,
    workspaceId,
  });
  const { showBoundary } = useErrorBoundary();

  const onSave = useCallback(
    async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { events, updatedBlocks } = data;

      store.blocks.bulkPut(
        Object.values(updatedBlocks).map((block) => ({
          key: block.uuid,
          value: block,
        }))
      );

      await db.blocks.bulkPut(Object.values(updatedBlocks));

      saveEvents({
        transaction: events.map((x) => buildEvent(x, userId)),
      }).catch((e) => {
        showBoundary(e);
      });
    },
    [userId, saveEvents, showBoundary]
  );

  return onSave;
};

import { parse } from 'uuid';
import { Block } from '@/types';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import {
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
  TreeEvent,
} from '../../../../declarations/workspace/workspace.did';

interface UseSuccessHandlersProps {
  block: Block;
  updateLocalBlock: (externalId: string, updatedData: Block) => void;
}

export const useSuccessHandlers = ({
  block,
  updateLocalBlock,
}: UseSuccessHandlersProps) => {
  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();

  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const onRemoveSuccess = (event: TreeEvent) => {
    sendUpdate([
      {
        transaction: [
          {
            blockUpdated: {
              updatePropertyTitle: {
                user: identity.getPrincipal(),
                uuid: parse(block.uuid),
                data: {
                  transaction: [event],
                  blockExternalId: parse(block.uuid),
                },
              },
            },
          },
        ],
      },
    ]);
    updateLocalBlock(block.uuid, {
      ...block,
      properties: {
        ...block.properties,
        title: block.properties.title,
      },
    });
  };

  const onInsertSuccess = (events: TreeEvent[]) => {
    sendUpdate([
      {
        transaction: [
          {
            blockUpdated: {
              updatePropertyTitle: {
                user: identity.getPrincipal(),
                uuid: parse(block.uuid),
                data: {
                  blockExternalId: parse(block.uuid),
                  transaction: events,
                },
              },
            },
          },
        ],
      },
    ]);

    updateLocalBlock(block.uuid, {
      ...block,
      properties: {
        ...block.properties,
        title: block.properties.title,
      },
    });
  };

  return { onRemoveSuccess, onInsertSuccess };
};

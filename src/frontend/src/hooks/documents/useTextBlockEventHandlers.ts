import { Tree } from '@stellar-ic/lseq-ts';
import { TreeEvent } from '@stellar-ic/lseq-ts/types';
import { parse, v4 } from 'uuid';

import { DATA_TYPES } from '@/constants';
import { useDataStoreContext } from '@/contexts/DataStoreContext/useDataStoreContext';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useWorkspaceActor } from '@/hooks/ic/workspace/useWorkspaceActor';
import { useUpdate } from '@/hooks/useUpdate';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { Block, ExternalId } from '@/types';
import {
  SaveEventTransactionUpdateInput,
  SaveEventTransactionUpdateOutput,
} from '../../../../declarations/workspace/workspace.did';

interface UseTextBlockEventHandlersProps {
  blockExternalId: ExternalId;
}

export const useTextBlockEventHandlers = ({
  blockExternalId,
}: UseTextBlockEventHandlersProps) => {
  const {
    blocks: { updateLocal: updateLocalBlock },
  } = usePagesContext();

  const { get } = useDataStoreContext();

  const block = get<Block>(DATA_TYPES.block, blockExternalId);

  if (!block) throw new Error(`Block not found: ${blockExternalId}`);

  const { identity } = useAuthContext();
  const { workspaceId } = useWorkspaceContext();
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  const [sendUpdate] = useUpdate<
    [SaveEventTransactionUpdateInput],
    SaveEventTransactionUpdateOutput
  >(workspaceId, actor.saveEvents);

  const onSuccess = (title: Tree.Tree, events: TreeEvent[]) => {
    sendUpdate([
      {
        transaction: [
          {
            blockUpdated: {
              updatePropertyTitle: {
                user: identity.getPrincipal(),
                uuid: parse(v4()),
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
        title,
      },
    });
  };

  const onCharacterInserted = (cursorPosition: number, character: string) => {
    Tree.insertCharacter(
      block.properties.title,
      cursorPosition,
      character,
      (events) => {
        onSuccess(block.properties.title, events);
      }
    );
  };

  const onCharactersInserted = (
    cursorPosition: number,
    characters: string[]
  ) => {
    const allEvents: TreeEvent[] = [];

    characters.forEach((character, i) => {
      Tree.insertCharacter(
        block.properties.title,
        cursorPosition + i,
        character,
        (events) => {
          allEvents.push(...events);
        }
      );
    });

    onSuccess(block.properties.title, allEvents);
  };

  const onCharacterRemoved = (cursorPosition: number) => {
    Tree.removeCharacter(block.properties.title, cursorPosition, (event) => {
      onSuccess(block.properties.title, [event]);
    });
  };

  const onCharactersRemoved = (startPosition: number, endPosition?: number) => {
    if (endPosition === undefined) return onCharacterRemoved(startPosition);

    // Build index array in descending order so that we don't have to worry about
    // the index changing as we remove characters
    const characterIndexes = Array.from(
      { length: endPosition - startPosition },
      (_, i) => endPosition - i
    );
    const allEvents: TreeEvent[] = [];

    characterIndexes.forEach((index) => {
      Tree.removeCharacter(block.properties.title, index, (event) => {
        allEvents.push(event);
      });
    });

    onSuccess(block.properties.title, allEvents);
  };

  return {
    onCharacterInserted,
    onCharactersInserted,
    onCharacterRemoved,
    onCharactersRemoved,
  };
};

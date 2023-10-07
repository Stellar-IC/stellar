import { Identity } from '@dfinity/agent';
import { useCallback } from 'react';
import { parse, stringify, v4 } from 'uuid';

import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import { useUpdate } from '@/hooks/useUpdate';
import {
  fromLocalStorageBulk,
  fromShareable,
  serializeBlock,
  toLocalStorageBulk,
} from '@/modules/domain/block/serializers';
import {
  Page,
  LocalStoragePage,
  AddBlockEvent,
  BlockEvent,
  RemoveBlockEvent,
  Block,
} from '@/types';

import {
  Result as PageByUuidResult,
  SaveEventUpdateInput,
  SaveEventUpdateInputPayload,
  SaveEventUpdateOutput,
  ShareablePage,
  UUID,
} from '../../../../../declarations/documents/documents.did';
import { canisterId } from '../../../../../declarations/documents';
import { useQuery } from '../../useQuery';
import { usePageEvents } from './usePageEvents';

const getExternalId = (result: PageByUuidResult): UUID | null =>
  'ok' in result ? result.ok.uuid : null;

export const usePages = (props: {
  identity?: Identity;
  updateLocalBlock: (externalId: string, updatedData: Block) => void;
  onSuccess?: (result: ShareablePage) => void;
}) => {
  const { onSuccess: onSuccessFromProps, identity, updateLocalBlock } = props;
  const { actor } = useDocumentsActor({ identity });

  const onSuccess = useCallback(
    (result: PageByUuidResult) => {
      if (onSuccessFromProps && 'ok' in result) onSuccessFromProps(result.ok);
    },
    [onSuccessFromProps]
  );

  const serialize = useCallback((result: PageByUuidResult) => {
    if (!('ok' in result)) return null;
    return fromShareable(result.ok);
  }, []);

  const {
    data: pages,
    query,
    updateLocal,
  } = useQuery<[UUID], PageByUuidResult, Page, LocalStoragePage>('pageByUUid', actor.pageByUuid, {
    serialize,
    getExternalId,
    onSuccess,
    prepareForStorage: toLocalStorageBulk,
    prepareFromStorage: fromLocalStorageBulk,
  });

  console.log({ pages });

  const { addEvent } = usePageEvents();

  const [sendUpdate] = useUpdate<[SaveEventUpdateInput], SaveEventUpdateOutput>(
    canisterId,
    actor.saveEvent
  );

  const saveEvent = useCallback(
    async (pageExternalId: string, input: SaveEventUpdateInput) => {
      if ('blockCreated' in input) {
        const { index } = input.blockCreated.payload;
        // store event locally
        addEvent(pageExternalId, {
          ...input,
          blockCreated: {
            eventType: { blockCreated: null },
            payload: {
              ...input.blockCreated.payload,
              index,
            },
          },
        });

        const currentPage = pages[pageExternalId];

        // Save block to local block storage
        // pass

        console.log({ index });

        const newContent = [...currentPage.content];
        newContent.splice(Number(index), 0, stringify(input.blockCreated.payload.block.uuid));

        // update page locally
        updateLocal(pageExternalId, {
          ...currentPage,
          content: newContent,
        });

        // send event to IC
        const result = await sendUpdate([input]);
        return result;
      }

      if ('blockRemoved' in input) {
        // store event locally
        addEvent(pageExternalId, {
          ...input,
          blockRemoved: {
            eventType: { blockRemoved: null },
            payload: {
              ...input.blockRemoved.payload,
            },
          },
        });

        const currentPage = pages[pageExternalId];
        const updatedContent = currentPage.content.filter(
          (id) => id !== stringify(input.blockRemoved.payload.blockExternalId)
        );

        // Save block to local block storage
        // pass

        // update page locally
        updateLocal(pageExternalId, {
          ...currentPage,
          content: updatedContent,
        });

        // send event to IC
        const result = await sendUpdate([input]);
        return result;
      }

      throw new Error('Unsupported event type');
    },
    [addEvent, pages, sendUpdate, updateLocal]
  );

  const handleAddBlock = useCallback(
    (page: Page, event: AddBlockEvent) => {
      const { data: eventData } = event;
      const uuid = parse(v4());

      const newBlock: SaveEventUpdateInputPayload['block'] = {
        content: [],
        parent: [parse(page.uuid)],
        uuid,
        blockType: { paragraph: null },
        properties: {
          title: [],
          checked: [false],
        },
      };

      updateLocalBlock(stringify(uuid), {
        ...serializeBlock(newBlock),
        id: '',
      });

      saveEvent(page.uuid, {
        blockCreated: {
          eventType: { blockCreated: null },
          payload: {
            block: {
              content: [],
              parent: [parse(page.uuid)],
              uuid,
              blockType: { paragraph: null },
              properties: {
                title: [],
                checked: [false],
              },
            },
            index: BigInt(eventData.index),
          },
        },
      });
    },
    [saveEvent, updateLocalBlock]
  );

  const handleRemoveBlock = useCallback(
    (page: Page, event: RemoveBlockEvent) => {
      const { data: eventData } = event;

      // updateLocalPage(page.uuid, {});
      saveEvent(page.uuid, {
        blockRemoved: {
          eventType: { blockRemoved: null },
          payload: {
            parent: parse(page.uuid),
            blockExternalId: eventData.blockExternalId,
          },
        },
      });
    },
    [saveEvent]
  );

  const handleBlockEvent = useCallback(
    (pageExternalId: UUID, event: BlockEvent) => {
      const { type } = event;
      const page = pages[stringify(pageExternalId)];

      if (!page) throw new Error('Page not found');

      // For each event we need to update the page appropriately.
      switch (type) {
        // case "insertText":
        //     // TODO: update the block with the new text.
        //     break;
        // case "deleteText":
        //     break;
        case 'addBlock':
          handleAddBlock(page, event);
          break;
        case 'removeBlock':
          handleRemoveBlock(page, event);
          break;
        case 'updateBlock':
          break;
        default:
          throw new Error('Unsupported event type');
      }
    },
    [handleAddBlock, handleRemoveBlock, pages]
  );

  return { pages, query, updateLocal, handleBlockEvent };
};

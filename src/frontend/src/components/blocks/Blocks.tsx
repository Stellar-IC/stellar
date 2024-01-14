import {
  DragDropContext,
  Draggable,
  DraggableLocation,
  Droppable,
} from '@hello-pangea/dnd';
import { Divider, Stack } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { Tree } from '@stellar-ic/lseq-ts';
import cx from 'clsx';
import { useCallback, useEffect } from 'react';

import { Page } from '@/types';

import { useReorderHandler } from '@/hooks/documents/useReorderHandler';
import { useBlockByUuid } from '@/hooks/documents/queries/useBlockByUuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

import classes from './Blocks.module.css';

type OnDragEndProps = {
  destination: DraggableLocation | null;
  source: DraggableLocation;
  draggableId: string;
};

export const Blocks = ({ page }: { page: Page }) => {
  const handleReorder = useReorderHandler({
    parentBlockExternalId: page.uuid,
  });
  const blocksToRender = Tree.toArray(page.content);
  const [state, handlers] = useListState(blocksToRender);
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();
  const getBlockByUuid = useBlockByUuid({ identity, workspaceId });
  const { addBlock } = usePagesContext();

  useEffect(() => {
    getBlockByUuid(parse(page.uuid));
  }, [getBlockByUuid, page.uuid]);

  useEffect(() => {
    // create block if page is empty
    const timeout = setTimeout(() => {
      if (Tree.size(page.content) === 0) {
        addBlock(parse(page.uuid), { paragraph: null }, 0);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [addBlock, page.content, page.uuid]);

  // Update the state if the blocks change
  useEffect(() => {
    let i = 0;
    if (blocksToRender.length !== state.length) {
      handlers.setState(blocksToRender);
      return;
    }
    for (const block of blocksToRender) {
      if (block !== state[i]) {
        handlers.setState(blocksToRender);
        break;
      }
      i += 1;
    }
  }, [blocksToRender, handlers, state]);

  const onDragEnd = useCallback(
    ({ destination, source, draggableId }: OnDragEndProps) => {
      if (!destination) return;
      if (destination.index === source.index) return;

      handlers.reorder({
        from: source.index,
        to: destination?.index || 0,
      });

      handleReorder(draggableId, source.index, destination?.index || 0);
    },
    [handleReorder, handlers]
  );

  return (
    <Stack className="Blocks" w="100%" gap={0}>
      <div style={{ padding: '1rem 0' }}>
        <TextBlock
          blockExternalId={page.uuid}
          blockIndex={0}
          blockType={{ heading1: null }}
          placeholder="Untitled"
          value={page.properties.title}
        />
      </div>
      <Divider mb="xl" />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dnd-list" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {state.map((blockUuid, index) => (
                <Draggable
                  key={blockUuid}
                  index={index}
                  draggableId={blockUuid}
                >
                  {(provided, snapshot) => (
                    <div
                      className={cx(classes.item, {
                        [classes.itemDragging]: snapshot.isDragging,
                      })}
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                    >
                      <BlockRenderer
                        key={blockUuid}
                        index={index}
                        depth={0}
                        externalId={blockUuid}
                        parentBlockExternalId={page.uuid}
                        placeholder={
                          index === 0 ? 'Start typing here' : undefined
                        }
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Stack>
  );
};

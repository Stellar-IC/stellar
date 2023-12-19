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
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';
import { Page } from '@/types';

import { useReorderHandler } from '@/hooks/documents/useReorderHandler';
import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

import classes from './Blocks.module.css';

type OnDragEndProps = {
  destination: DraggableLocation | null;
  source: DraggableLocation;
  draggableId: string;
};

export const Blocks = ({ page }: { page: Page }) => {
  const titleBlockIndex = 0;
  const {
    blocks: { query },
  } = usePagesContext();
  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId: page.uuid }
  );
  const handleReorder = useReorderHandler({
    parentBlockExternalId: page.uuid,
  });
  const blocksToRender = Tree.toArray(page.content);
  const [state, handlers] = useListState(blocksToRender);

  // Ensure that the page is loaded
  useEffect(() => {
    query(parse(page.uuid));
  }, [query, page.uuid]);

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
          blockIndex={titleBlockIndex}
          blockType={{ heading1: null }}
          onInsert={onCharacterInserted}
          onRemove={onCharacterRemoved}
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

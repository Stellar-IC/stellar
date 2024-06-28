import { Divider, Stack } from '@mantine/core';
import {
  useCallback,
  useMemo,
  KeyboardEvent,
  useState,
  useEffect,
} from 'react';

import * as EditorAction from '@/modules/editor/EditorAction';
import {
  focusPreviousBlock,
  focusNextBlock,
} from '@/modules/editor/utils/focus';
import { CollaborativeDocument } from '@/modules/page-sync/document';
import { BlockId } from '@/modules/page-sync/types';

import { BlockRenderer } from './BlockRenderer';
import { EditorController } from './EditorController';
import { TextBlock } from './TextBlock';

const textBoxWrapperStyle = {
  padding: '1rem 0',
};

interface EditorProps {
  doc: CollaborativeDocument;
  userId: string;
}

/**
 * Editor component.
 */
export const Editor = ({ doc, userId }: EditorProps) => {
  const [page, setPage] = useState(doc.toJson());

  useEffect(() => {
    doc.on('change', () => {
      setPage(doc.toJson());
    });
  });

  const controller = useMemo(
    () =>
      new EditorController(doc, {
        onSave: (doc, data) => {
          console.log('Saving data:', data, doc);
          // TODO: Send data to the server
          return Promise.resolve();
        },
      }),
    [doc]
  );

  const onKeyDown = useCallback(
    (blockId: BlockId, e: KeyboardEvent) => {
      const { key } = e;

      // Get current selection
      const selection = window.getSelection();
      if (!selection) return false;

      let { anchorOffset, focusOffset } = selection;
      if (anchorOffset > focusOffset) {
        [anchorOffset, focusOffset] = [focusOffset, anchorOffset];
      }

      let editorAction: EditorAction.EditorAction | undefined;
      try {
        editorAction = EditorAction.fromKeyboardEvent(e);
      } catch (error) {
        return false;
      }

      const editorActionHandlers = {
        [EditorAction.EditorAction.Tab]: () => {
          e.preventDefault();
          controller.nest().save();
        },
        [EditorAction.EditorAction.ShiftTab]: () => {
          e.preventDefault();
          controller.unnest().save();
        },
        [EditorAction.EditorAction.ArrowDown]: () => focusPreviousBlock(),
        [EditorAction.EditorAction.ArrowUp]: () => focusNextBlock(),
        [EditorAction.EditorAction.Backspace]: () => {
          // handleBackspace(e, {
          //   hasParentBlock: Boolean(parentBlockExternalId),
          //   onRemoveBlock,
          // });
        },
        [EditorAction.EditorAction.Enter]: () => {
          e.preventDefault();
          // handleEnter();
        },
        [EditorAction.EditorAction.Character]: () => {
          if (anchorOffset === focusOffset) {
            // Insert at the current position
            controller.insertContent(page.id, anchorOffset, key).save();
          } else {
            // Replace characters in the selection with the new character
          }
        },
      };

      if (editorAction in editorActionHandlers) {
        editorActionHandlers[editorAction]();
      }

      return true;
      // Replace characters in the selection with the new character
    },
    [controller, page.id]
  );

  return (
    <Stack className="Blocks" w="100%" gap={0} maw="44rem">
      <div style={textBoxWrapperStyle}>
        <TextBlock
          placeholder="Untitled"
          value={page.content}
          onKeyDown={(e) => {
            onKeyDown(page.id, e);
          }}
          onFocus={() => {
            controller.setFocusedBlock(null);
          }}
        />
      </div>
      <Divider mb="xl" />
      {page.children.map((block) => (
        <div key={block.id}>
          <BlockRenderer
            block={block}
            depth={0}
            onKeyDown={onKeyDown}
            onFocus={(blockId) => {
              controller.setFocusedBlock(blockId);
            }}
          />
        </div>
      ))}
    </Stack>
  );
};

import { Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  createRef,
  memo,
  useCallback,
  useMemo,
  useState,
  KeyboardEvent,
  useEffect,
} from 'react';
import { useErrorBoundary } from 'react-error-boundary';

import { useEditorSave } from '@/hooks/editor/useEditorSave';
import { useEditorEventHandlers } from '@/modules/editor/hooks/useEditorEventHandlers';
import { TreeEvent } from '@/modules/lseq/types';

import { EditorController } from '../EditorController';

import { useTextStyles } from './hooks/useTextStyles';
import { TextBlockV2Props } from './types';

export const TextBlock = ({
  placeholder,
  value,
  onFocus,
  onKeyDown,
}: TextBlockV2Props) => {
  const onSave = useEditorSave();
  const [initialText, setInitialText] = useState(value);

  const [
    isShowingPlaceholder,
    { close: hidePlaceholder, open: showPlaceholder },
  ] = useDisclosure(!initialText);

  const textBoxRef = useMemo(() => createRef<HTMLSpanElement>(), []);
  // const textStyles = useTextStyles({ blockType });

  // useEffect(() => {
  //   if (initialBlockExternalId !== blockExternalId) {
  //     const newInitialText = Tree.toText(value);
  //     if (newInitialText.length === 0) {
  //       showPlaceholder();
  //     }

  //     setInitialText(newInitialText);
  //     setInitialBlockExternalId(blockExternalId);
  //   }
  // }, [blockExternalId, initialBlockExternalId, value, showPlaceholder]);

  // useEffect(() => {
  //   if (!textBoxRef.current) return;
  //   const newText = Tree.toText(value);
  //   textBoxRef.current.innerText = newText;
  //   if (newText.length > 0) {
  //     hidePlaceholder();
  //   }
  // }, [initialText, textBoxRef, value, hidePlaceholder]);

  const { showBoundary } = useErrorBoundary();

  // const { onKeyDown, onCut, onPaste } = useEditorEventHandlers({
  //   blockExternalId,
  //   blockIndex,
  //   blockType,
  //   parentBlockExternalId,
  //   hidePlaceholder,
  //   showPlaceholder,
  //   onSave,
  // });

  // // Batch updates to avoid re-rendering on every key press
  // const [lastChangeTime, setLastChangeTime] = useState(Date.now());
  // const [edits, setEdits] = useState<TreeEvent[]>([]);

  // const onKeyDown = useCallback(
  //   (e: KeyboardEvent) => {
  //     const timeSinceLastChange = Date.now() - lastChangeTime;

  //     setEdits((prevEdits) => {
  //       const newEdits = [...prevEdits];
  //       const event: TreeEvent = {
  //         insert: { value: e.key, position: newEdits.length },
  //       };
  //       newEdits.push(event);
  //       return newEdits;
  //     });

  //     if (onChange && timeSinceLastChange > 1000) {
  //       onChange(edits);
  //     } else {
  //       setLastChangeTime(Date.now());
  //     }
  //   },
  //   [edits, lastChangeTime, onChange]
  // );

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const timeSinceLastChange = Date.now() - lastChangeTime;
  //     if (onChange && timeSinceLastChange > 1000) {
  //       onChange(edits);
  //       setEdits([]);
  //     }
  //   });

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [edits, lastChangeTime, onChange, showBoundary]);

  return (
    <Box className="TextBlock" pos="relative" w="100%">
      {/* {placeholder && isShowingPlaceholder && (
        <Box
          pos="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          style={{ pointerEvents: 'none', color: '#999', zIndex: 1 }}
        >
          {placeholder}
        </Box>
      )} */}
      <span
        tabIndex={0}
        ref={textBoxRef}
        role="textbox"
        contentEditable
        style={{ outline: 'none', display: 'block', minHeight: '24px' }}
        suppressContentEditableWarning
        onKeyDown={(e) => {
          try {
            if (onKeyDown) {
              onKeyDown(e);
            }
          } catch (e) {
            showBoundary(e);
          }
        }}
        onFocus={(e) => {
          if (onFocus) onFocus(e);
        }}
        // onPaste={onPaste}
        // onCut={onCut}
      >
        {initialText}
      </span>
    </Box>
  );
};

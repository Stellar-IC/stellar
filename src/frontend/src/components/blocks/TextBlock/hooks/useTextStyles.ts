import { useMemo } from 'react';

import { BlockType } from '../../../../../../declarations/workspace/workspace.did';

interface UseTextStylesProps {
  blockType: BlockType;
}

export const useTextStyles = ({ blockType }: UseTextStylesProps) => {
  const textStyles = useMemo(() => {
    if (
      'paragraph' in blockType ||
      'todoList' in blockType ||
      'bulletedList' in blockType ||
      'numberedList' in blockType ||
      'toggleList' in blockType ||
      'code' in blockType ||
      'quote' in blockType ||
      'callout' in blockType
    ) {
      return {
        fontSize: '1rem',
      };
    }

    if ('heading3' in blockType) {
      return {
        fontWeight: 600,
        fontSize: '1.25em',
        lineHeight: 1.3,
      };
    }

    if ('heading2' in blockType) {
      return {
        fontWeight: 600,
        fontSize: '1.5em',
        lineHeight: 1.3,
      };
    }

    return {
      fontWeight: 600,
      fontSize: '1.875em',
      lineHeight: 1.3,
    };
  }, [blockType]);

  return textStyles;
};

import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { ExternalId } from '@/types';
import { parse } from 'uuid';
import { BlockType } from '../../../../../declarations/workspace/workspace.did';

type UseEnterHandlerProps = {
  blockIndex: number;
  blockType: BlockType;
  parentBlockExternalId?: ExternalId | null;
};

export function useEnterHandler({
  blockIndex,
  blockType,
  parentBlockExternalId,
}: UseEnterHandlerProps) {
  const { addBlock } = usePagesContext();

  const onEnterPressed = () => {
    if (!parentBlockExternalId) return;

    addBlock(parse(parentBlockExternalId), blockType, blockIndex + 1);

    // Focus on the new block
    setTimeout(() => {
      const blocksDiv = document.querySelector('.Blocks');
      if (!blocksDiv) return;

      const blockToFocus =
        blocksDiv.querySelectorAll<HTMLDivElement>('.TextBlock')[
          blockIndex + 2
        ];
      blockToFocus.querySelector('span')?.focus();
    }, 100);
  };

  return onEnterPressed;
}

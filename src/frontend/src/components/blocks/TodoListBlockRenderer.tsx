import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';

import { BlockWithActions } from './BlockWithActions';
import { TodoListBlock } from './TodoListBlock';

interface TodoListBlockRendererProps {
  blockExternalId: string;
  index: number;
}

export const TodoListBlockRenderer = ({
  blockExternalId,
  index,
}: TodoListBlockRendererProps) => {
  const { onEnterPressed, onCharacterInserted, onCharacterRemoved } =
    useTextBlockEventHandlers({
      blockExternalId,
      index,
    });
  const {
    blocks: { data },
  } = usePagesContext();
  const block = data[blockExternalId];

  if (!block) return null;

  return (
    <BlockWithActions key={blockExternalId} blockIndex={index} block={block}>
      <TodoListBlock
        externalId={blockExternalId}
        index={index}
        onCharacterInserted={onCharacterInserted}
        onCharacterRemoved={onCharacterRemoved}
        onEnterPressed={onEnterPressed}
      />
    </BlockWithActions>
  );
};

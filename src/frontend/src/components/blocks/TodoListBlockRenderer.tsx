import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';

import { TodoListBlock } from './TodoListBlock';

interface TodoListBlockRendererProps {
  blockExternalId: string;
  index: number;
}

export const TodoListBlockRenderer = ({
  blockExternalId,
  index,
}: TodoListBlockRendererProps) => {
  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId }
  );
  const {
    blocks: { data },
  } = usePagesContext();
  const block = data[blockExternalId];

  if (!block) return null;

  return (
    <TodoListBlock
      externalId={blockExternalId}
      index={index}
      onCharacterInserted={onCharacterInserted}
      onCharacterRemoved={onCharacterRemoved}
    />
  );
};

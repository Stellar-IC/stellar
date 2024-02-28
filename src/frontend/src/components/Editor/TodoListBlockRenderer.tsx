import { TodoListBlock } from './TodoListBlock';

interface TodoListBlockRendererProps {
  blockExternalId: string;
  index: number;
  parentBlockIndex?: number;
}

export const TodoListBlockRenderer = ({
  blockExternalId,
  index,
  parentBlockIndex,
}: TodoListBlockRendererProps) => (
  <TodoListBlock
    parentBlockIndex={parentBlockIndex}
    externalId={blockExternalId}
    index={index}
  />
);

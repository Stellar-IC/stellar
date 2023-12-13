import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';

import { NumberedListBlock } from './NumberedListBlock';

interface NumberedListBlockRendererProps {
  blockExternalId: string;
  index: number;
  numeral: number;
}

export const NumberedListBlockRenderer = ({
  blockExternalId,
  index,
  numeral,
}: NumberedListBlockRendererProps) => {
  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId }
  );
  const {
    blocks: { data },
  } = usePagesContext();
  const block = data[blockExternalId];

  if (!block) return null;

  return (
    <NumberedListBlock
      externalId={blockExternalId}
      index={index}
      numeral={numeral}
      onCharacterInserted={onCharacterInserted}
      onCharacterRemoved={onCharacterRemoved}
    />
  );
};

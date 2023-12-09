import { useMemo } from 'react';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';

import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';
import { BlockWithActions } from './BlockWithActions';
import { BulletedListBlock } from './BulletedListBlock';

interface BulletedListBlockRendererProps {
  blockExternalId: string;
  index: number;
}

export const BulletedListBlockRenderer = ({
  blockExternalId,
  index,
}: BulletedListBlockRendererProps) => {
  const { onEnterPressed, onCharacterInserted, onCharacterRemoved } =
    useTextBlockEventHandlers({
      blockExternalId,
      index,
    });
  const {
    blocks: { data },
  } = usePagesContext();
  const block = useMemo(() => data[blockExternalId], [data, blockExternalId]);

  return (
    <BlockWithActions key={blockExternalId} blockIndex={index} block={block}>
      <BulletedListBlock
        externalId={blockExternalId}
        index={index}
        onEnterPressed={onEnterPressed}
        onCharacterInserted={onCharacterInserted}
        onCharacterRemoved={onCharacterRemoved}
      />
    </BlockWithActions>
  );
};

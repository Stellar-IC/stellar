import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';
import { BulletedListBlock } from './BulletedListBlock';

interface BulletedListBlockRendererProps {
  blockExternalId: string;
  index: number;
}

export const BulletedListBlockRenderer = ({
  blockExternalId,
  index,
}: BulletedListBlockRendererProps) => {
  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId }
  );

  return (
    <BulletedListBlock
      externalId={blockExternalId}
      index={index}
      onCharacterInserted={onCharacterInserted}
      onCharacterRemoved={onCharacterRemoved}
    />
  );
};

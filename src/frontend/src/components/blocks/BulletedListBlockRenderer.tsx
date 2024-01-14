import { BulletedListBlock } from './BulletedListBlock';

interface BulletedListBlockRendererProps {
  blockExternalId: string;
  index: number;
}

export const BulletedListBlockRenderer = ({
  blockExternalId,
  index,
}: BulletedListBlockRendererProps) => (
  <BulletedListBlock externalId={blockExternalId} index={index} />
);

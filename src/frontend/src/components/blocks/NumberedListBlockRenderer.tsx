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
}: NumberedListBlockRendererProps) => (
  <NumberedListBlock
    externalId={blockExternalId}
    index={index}
    numeral={numeral}
  />
);

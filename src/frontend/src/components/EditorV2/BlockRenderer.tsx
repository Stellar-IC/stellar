import { Box } from '@mantine/core';
import { FocusEvent, KeyboardEvent } from 'react';

import { BlockId, DocumentBlock } from '@/modules/page-sync/types';

import { TextBlock } from './TextBlock';

type BlockRendererProps = {
  block: DocumentBlock;
  depth: number;
  onKeyDown: (blockId: BlockId, e: KeyboardEvent) => void;
  onFocus?: (blockId: BlockId, e: FocusEvent) => void;
};

export function BlockRenderer({
  block,
  depth,
  onFocus,
  onKeyDown,
}: BlockRendererProps) {
  return (
    <Box className="FocusableBlock" data-blockid={block.id}>
      <TextBlock
        value={block.content}
        onKeyDown={(e) => {
          onKeyDown(block.id, e);
        }}
        onFocus={(e) => {
          if (onFocus) onFocus(block.id, e);
        }}
      />
      {!('page' in block.blockType) && (
        <NestedBlocks
          block={block}
          depth={depth + 1}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
        />
      )}
    </Box>
  );
}

interface NestedBlocksProps {
  block: DocumentBlock;
  depth: number;
  onKeyDown: (blockId: BlockId, e: KeyboardEvent) => void;
  onFocus?: (blockId: BlockId, e: FocusEvent) => void;
}

export function NestedBlocks({
  block,
  depth,
  onFocus,
  onKeyDown,
}: NestedBlocksProps) {
  const { children } = block;

  if (children.length === 0) return null;

  return (
    <Box pos="relative" w="100%" pl={`${depth}rem`}>
      {children.map((childBlock) => (
        <Box key={childBlock.id}>
          <BlockRenderer
            block={childBlock}
            depth={depth}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
          />
        </Box>
      ))}
    </Box>
  );
}

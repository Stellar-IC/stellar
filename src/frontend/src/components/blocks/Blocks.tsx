import { Divider, Stack } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { useEffect } from 'react';
import { parse } from 'uuid';

import { usePagesContext } from '@/contexts/blocks/usePagesContext';
import { Page } from '@/types';

import { useTextBlockEventHandlers } from '@/hooks/documents/useTextBlockEventHandlers';
import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

export const Blocks = ({ page }: { page: Page }) => {
  const titleBlockIndex = 0;
  const {
    blocks: { query },
  } = usePagesContext();
  const { onCharacterInserted, onCharacterRemoved } = useTextBlockEventHandlers(
    { blockExternalId: page.uuid }
  );

  // Ensure that the page is loaded
  useEffect(() => {
    query(parse(page.uuid));
  }, [query, page.uuid]);

  return (
    <Stack className="Blocks" w="100%" gap={0}>
      <div style={{ padding: '1rem 0' }}>
        <TextBlock
          blockExternalId={page.uuid}
          blockIndex={titleBlockIndex}
          blockType={{ heading1: null }}
          onInsert={onCharacterInserted}
          onRemove={onCharacterRemoved}
          placeholder="Untitled"
          value={page.properties.title}
        />
      </div>
      <Divider mb="xl" />
      <div>
        {Tree.toArray(page.content).map((blockUuid, index) => (
          <BlockRenderer
            key={blockUuid}
            index={index}
            depth={0}
            externalId={blockUuid}
            placeholder={index === 0 ? 'Start typing here' : undefined}
          />
        ))}
      </div>
    </Stack>
  );
};

import { Divider, Stack } from '@mantine/core';
import { useCallback, useMemo } from 'react';

import { Tree } from '@/modules/lseq';
import { Block } from '@/types';

import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

const textBoxWrapperStyle = {
  padding: '1rem 0',
};

export const Editor = ({ page }: { page: Block }) => {
  const blocksToRender = Tree.toArray(page.content);

  const mapUuidToComponent = useCallback(
    (blockUuid: string, index: number) => (
      <div key={blockUuid}>
        <BlockRenderer
          index={index}
          depth={0}
          externalId={blockUuid}
          parentBlockExternalId={page.uuid}
          placeholder={index === 0 ? 'Start typing here' : undefined}
        />
      </div>
    ),
    [page.uuid]
  );

  const blocks = useMemo(
    () => blocksToRender.map(mapUuidToComponent),
    [mapUuidToComponent, blocksToRender]
  );

  return (
    <Stack className="Blocks" w="100%" gap={0} maw="44rem">
      <div style={textBoxWrapperStyle}>
        <TextBlock
          blockExternalId={page.uuid}
          blockIndex={0}
          blockType={{ heading1: null }}
          placeholder="Untitled"
          value={page.properties.title}
        />
      </div>
      <Divider mb="xl" />
      {blocks}
    </Stack>
  );
};

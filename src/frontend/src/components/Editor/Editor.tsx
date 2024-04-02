import { Divider, Stack } from '@mantine/core';
import { Tree } from '@stellar-ic/lseq-ts';
import { useCallback, useMemo } from 'react';

import { Block } from '@/types';

import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

const textBoxWrapperStyle = {
  padding: '1rem 0',
};

export const Editor = ({ page }: { page: Block }) => {
  const blocksToRender = Tree.toArray(page.content);
  // const [state, handlers] = useListState(blocksToRender);

  // // Update the state if the blocks change
  // useEffect(() => {
  //   let i = 0;

  //   if (blocksToRender.length !== state.length) {
  //     handlers.setState(blocksToRender);
  //     return;
  //   }

  //   for (const block of blocksToRender) {
  //     if (block !== state[i]) {
  //       handlers.setState(blocksToRender);
  //       break;
  //     }
  //     i += 1;
  //   }
  // }, [blocksToRender, handlers, state]);

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

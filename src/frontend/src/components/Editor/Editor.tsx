import { Divider, Stack } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { Tree } from '@stellar-ic/lseq-ts';
import { useEffect } from 'react';

import { Page } from '@/types';

import { useBlockByUuid } from '@/hooks/documents/queries/useBlockByUuid';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/PagesContext/usePagesContext';
import { BlockRenderer } from './BlockRenderer';
import { TextBlock } from './TextBlock';

export const Editor = ({ page }: { page: Page }) => {
  const blocksToRender = Tree.toArray(page.content);
  const [state, handlers] = useListState(blocksToRender);
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();
  const getBlockByUuid = useBlockByUuid({ identity, workspaceId });
  const { addBlock } = usePagesContext();

  useEffect(() => {
    getBlockByUuid(parse(page.uuid));
  }, [getBlockByUuid, page.uuid]);

  useEffect(() => {
    // create block if page is empty
    const timeout = setTimeout(() => {
      if (Tree.size(page.content) === 0) {
        addBlock(parse(page.uuid), { paragraph: null }, 0);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [addBlock, page.content, page.uuid]);

  // Update the state if the blocks change
  useEffect(() => {
    let i = 0;
    if (blocksToRender.length !== state.length) {
      handlers.setState(blocksToRender);
      return;
    }
    for (const block of blocksToRender) {
      if (block !== state[i]) {
        handlers.setState(blocksToRender);
        break;
      }
      i += 1;
    }
  }, [blocksToRender, handlers, state]);

  return (
    <Stack className="Blocks" w="100%" gap={0}>
      <div style={{ padding: '1rem 0' }}>
        <TextBlock
          blockExternalId={page.uuid}
          blockIndex={0}
          blockType={{ heading1: null }}
          placeholder="Untitled"
          value={page.properties.title}
        />
      </div>
      <Divider mb="xl" />
      {state.map((blockUuid, index) => (
        <div key={blockUuid}>
          <BlockRenderer
            index={index}
            depth={0}
            externalId={blockUuid}
            parentBlockExternalId={page.uuid}
            placeholder={index === 0 ? 'Start typing here' : undefined}
            // dragHandleProps={provided.dragHandleProps}
          />
        </div>
      ))}
    </Stack>
  );
};

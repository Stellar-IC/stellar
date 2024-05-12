import { Container, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { PageWrapper } from '@/PageWrapper';
import { Editor } from '@/components/Editor/Editor';
import { Page } from '@/components/layout/page/Page';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useBlockQuery } from '@/hooks/canisters/workspace/queries/useBlockQuery';
import { useMarkUserActive } from '@/hooks/canisters/workspace/updates/useMarkUserActive';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import * as BlockModule from '@/modules/blocks';
import { store, useStoreQuery } from '@/modules/data-store';

import { AppMessage } from '../../../../declarations/websockets/websockets.did';

import classes from './PageDetail.module.css';
import { blockEventHandler } from './realtime';

function PageDetailPageInner(props: { pageId: string }) {
  const { pageId } = props;
  const { workspaceId } = useWorkspaceContext();
  const { identity } = useAuthContext();
  const queryPage = useBlockQuery();
  const page = useStoreQuery(() => store.blocks.get(pageId), {
    clone: BlockModule.clone,
  });
  const [markUserActive] = useMarkUserActive({ workspaceId, identity });

  const { addListener, removeListener } = useWebSocketContext();

  useEffect(() => {
    queryPage(parse(pageId));
  }, [queryPage, pageId]);

  useEffect(() => {
    markUserActive([parse(pageId)]);

    const interval = setInterval(() => {
      markUserActive([parse(pageId)]);
    }, 10_000);

    return () => {
      clearInterval(interval);
    };
  }, [markUserActive, pageId]);

  useEffect(() => {
    const listener = (message: AppMessage) => {
      if (!('blockEvent' in message)) return;
      blockEventHandler(message);
    };

    addListener('blockEvent', listener);

    return () => {
      removeListener('blockEvent', listener);
    };
  }, [addListener, removeListener]);

  if (!page) return <Page>Page not found</Page>;

  return <Editor page={page} />;
}

export function PageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>();

  if (!pageId) throw new Error('Missing pageId');

  return (
    <PageWrapper shouldShowPageActions>
      <Page>
        <Container maw="container.xs">
          <Stack gap="xs" className={classes.editorWrapper}>
            <ErrorBoundary
              fallback={
                <>
                  <p>⚠️Something went wrong</p>
                  <button
                    type="button"
                    onClick={() => {
                      document.location.reload();
                    }}
                  >
                    Reload
                  </button>
                </>
              }
            >
              <PageDetailPageInner pageId={pageId} />
            </ErrorBoundary>
          </Stack>
        </Container>
      </Page>
    </PageWrapper>
  );
}

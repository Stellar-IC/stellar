import { Principal } from '@dfinity/principal';
import { Container, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useParams } from 'react-router-dom';
import { parse } from 'uuid';

import { PageWrapper } from '@/PageWrapper';
import { Editor } from '@/components/Editor/Editor';
import { Page } from '@/components/layout/page/Page';
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useBlockQuery } from '@/hooks/canisters/workspace/queries/useBlockQuery';
import * as BlockModule from '@/modules/blocks';
import { store, useStoreQuery } from '@/modules/data-store';

import classes from './PageDetail.module.css';

function PageDetailPageInner(props: { pageId: string }) {
  const { pageId } = props;
  const queryPage = useBlockQuery();
  const page = useStoreQuery(() => store.blocks.get(pageId), {
    clone: BlockModule.clone,
  });

  useEffect(() => {
    queryPage(parse(pageId));
  }, [queryPage, pageId]);

  if (!page) return <Page>Page not found</Page>;

  return <Editor page={page} />;
}

export function PageDetailPage({ pageId }: { pageId: string }) {
  const workspaceContext = useWorkspaceContext();

  if (!workspaceContext || !workspaceContext.actor) return null;

  return (
    <PageWrapper>
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

export function PageDetailPageConnector() {
  const { pageId, spaceId } = useParams<{ pageId: string; spaceId: string }>();

  if (!pageId) throw new Error('Missing pageId');
  if (!spaceId) throw new Error('Missing spaceId');

  return (
    <WorkspaceContextProvider workspaceId={Principal.fromText(spaceId)}>
      <PageDetailPage pageId={pageId} />
    </WorkspaceContextProvider>
  );
}

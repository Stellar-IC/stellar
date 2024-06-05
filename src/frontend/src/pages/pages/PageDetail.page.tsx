import { DelegationIdentity } from '@dfinity/identity';
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
import { useBlockQuery } from '@/hooks/canisters/workspace/queries/useBlockQuery';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import * as BlockModule from '@/modules/blocks';
import { store, useStoreQuery } from '@/modules/data-store';

import classes from './PageDetail.module.css';

function PageDetailPageInner(props: { pageId: string; spaceId: string }) {
  const { pageId, spaceId: workspaceId } = props;
  const { identity } = useAuthContext();
  const queryPage = useBlockQuery({ identity, workspaceId });
  const page = useStoreQuery(() => store.blocks.get(pageId), {
    clone: BlockModule.clone,
  });

  useEffect(() => {
    queryPage(parse(pageId));
  }, [queryPage, pageId]);

  if (!page) return <Page>Page not found</Page>;

  return <Editor page={page} />;
}

export function PageDetailPage() {
  const { identity } = useAuthContext();
  const { pageId, spaceId } = useParams<{ pageId: string; spaceId: string }>();

  if (!pageId) throw new Error('Missing pageId');
  if (!spaceId) throw new Error('Missing spaceId');
  if (!(identity instanceof DelegationIdentity)) {
    throw new Error('Anonymous identity is not allowed here');
  }

  return (
    <WorkspaceContextProvider
      identity={identity}
      workspaceId={Principal.fromText(spaceId)}
    >
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
                <PageDetailPageInner pageId={pageId} spaceId={spaceId} />
              </ErrorBoundary>
            </Stack>
          </Container>
        </Page>
      </PageWrapper>
    </WorkspaceContextProvider>
  );
}

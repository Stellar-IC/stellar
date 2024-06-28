import { Principal } from '@dfinity/principal';
import { ActionIcon, Box, Container, Flex, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';

import { PageWrapper } from '@/PageWrapper';
import { Editor } from '@/components/EditorV2/Editor';
import { Page } from '@/components/layout/page/Page';
import { WorkspaceContext } from '@/contexts/WorkspaceContext/WorkspaceContext';
import { WorkspaceContextProvider } from '@/contexts/WorkspaceContext/WorkspaceContextProvider';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import { WebSocketProvider } from '@/modules/page-sync/WebSocketProvider';
import { CollaborativeDocument } from '@/modules/page-sync/document';

import classes from './PageDetail.module.css';

export function PageDetailPageConnector() {
  const { pageId, spaceId } = useParams<{ pageId: string; spaceId: string }>();

  if (!pageId) throw new Error('Missing pageId');
  if (!spaceId) throw new Error('Missing spaceId');

  return (
    <WorkspaceContextProvider workspaceId={Principal.fromText(spaceId)}>
      <WorkspaceContext.Consumer>
        {(context) => {
          if (!context || !context.actor) return null;
          return <PageDetailPage pageId={pageId} workspaceId={spaceId} />;
        }}
      </WorkspaceContext.Consumer>
    </WorkspaceContextProvider>
  );
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
interface PageDetailPageProps {
  pageId: string;
  workspaceId: string;
}

function PageDetailPage({ pageId, workspaceId }: PageDetailPageProps) {
  const { userId } = useAuthContext();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const workspaceContext = useWorkspaceContext();
  const navigate = useNavigate();

  const provider = useMemo(() => {
    if (!workspaceContext || !workspaceContext.actor) {
      throw new Error('Workspace actor not found');
    }

    return new WebSocketProvider({
      canisterId: workspaceId,
      canisterActor: workspaceContext.actor,
    });
  }, [workspaceContext, workspaceId]);

  const doc = useMemo(
    () =>
      new CollaborativeDocument({
        userId: userId.toString(),
        provider,
        page: {
          id: pageId,
          parent: {
            id: workspaceId,
            type: { workspace: null },
          },
        },
      }),
    [provider, pageId, workspaceId, userId]
  );

  useEffect(() => {
    const onConnectionOpen = () => {
      setStatus('connected');
    };
    const onConnectionClosed = () => {
      setStatus('disconnected');
    };

    provider.on('open', onConnectionOpen);
    provider.on('close', onConnectionClosed);

    return () => {
      provider.off('open', onConnectionOpen);
      provider.off('close', onConnectionClosed);
    };
  }, [provider]);

  return (
    <PageWrapper pageId={pageId}>
      <Page>
        <Container>
          <Flex justify="flex-end">
            <Box
              className="statusIndicator"
              bg={
                {
                  connecting: 'yellow',
                  connected: 'green',
                  disconnected: 'red',
                }[status]
              }
              w="1rem"
              h="1rem"
            />
          </Flex>
        </Container>
        <Container maw="container.xs">
          <ActionIcon
            onClick={() => {
              navigate(-1);
            }}
            variant="transparent"
            color="white"
          >
            <IconArrowLeft />
          </ActionIcon>
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
              <Editor doc={doc} userId={userId.toString()} />
            </ErrorBoundary>
          </Stack>
        </Container>
      </Page>
    </PageWrapper>
  );
}

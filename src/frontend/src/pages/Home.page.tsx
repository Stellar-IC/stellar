import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { Button, Container, Flex, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useUserActor } from '@/hooks/canisters/user/useUserActor';
import { useCreateDefaultWorkspace } from '@/hooks/canisters/workspace_index/useCreateDefaultWorkspace';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

function WorkspaceLoader({
  children,
}: {
  children: (props: {
    isLoading: boolean;
    workspaceId: Principal | null;
  }) => React.ReactNode;
}) {
  const [workspaceId, setWorkspaceId] = useState<Principal | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(true);
  const {
    isLoading: isLoadingUser,
    identity,
    userId,
    isAuthenticated,
  } = useAuthContext();
  const { actor: userActor } = useUserActor({ identity, userId });
  const isLoading = isLoadingUser || isLoadingWorkspace;

  // Load the user's personal workspace
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (isAuthenticated) {
        const result = await userActor.personalWorkspace();

        setIsLoadingWorkspace(false);

        if (!('ok' in result)) {
          throw new Error(
            `There was an error loading the user's default workspace: ${result.err}`
          );
        }

        if (result.ok.length === 0) {
          return;
        }

        setWorkspaceId(result.ok[0]);
      }
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [userActor, identity, isAuthenticated]);

  return <>{children({ isLoading, workspaceId })}</>;
}

function CreateDefaultWorkspaceView() {
  const { createWorkspace } = useCreateDefaultWorkspace();
  const navigate = useNavigate();

  return (
    <Container>
      <Stack
        gap={0}
        align="center"
        style={{
          textAlign: 'center',
        }}
      >
        <h1>Welcome!</h1>
        <Text>
          In order to get started, you will need to create a Space where you can
          create pages and collaborate with others.
        </Text>
        <Flex justify="center" style={{ marginTop: '50px' }}>
          <Button
            onClick={() =>
              createWorkspace().then(([workspaceId]) => {
                navigate(`/spaces/${workspaceId.toString()}`);
              })
            }
          >
            Let&apos;s do it!
          </Button>
        </Flex>
      </Stack>
    </Container>
  );
}

export function HomePage() {
  const { identity } = useAuthContext();

  return (
    <WorkspaceLoader>
      {({ isLoading, workspaceId }) => {
        if (isLoading) {
          return (
            <Flex h="100%">
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexGrow: 1,
                  transition: 'padding 0.2s ease-in-out',
                }}
              >
                <Loader />
              </div>
            </Flex>
          );
        }

        if (!workspaceId) {
          return <CreateDefaultWorkspaceView />;
        }

        if (!(identity instanceof DelegationIdentity)) {
          throw new Error('Anonymous identity is not allowed here');
        }

        return <Navigate to={`/spaces/${workspaceId.toString()}`} />;
      }}
    </WorkspaceLoader>
  );
}

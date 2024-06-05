import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { Flex, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useUserActor } from '@/hooks/canisters/user/useUserActor';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

function WorkspaceLoader({
  children,
}: {
  children: (props: {
    isLoading: boolean;
    workspaceId: Principal;
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
            "There was an error loading the user's default workspace"
          );
        }
        if (result.ok.length === 0) {
          throw new Error('User has no default workspace');
        }
        setWorkspaceId(result.ok[0]);
      }
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [userActor, identity, isAuthenticated]);

  if (!workspaceId) return <></>;

  return <>{children({ isLoading, workspaceId })}</>;
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
          throw new Error('Workspace ID is not set');
        }

        if (!(identity instanceof DelegationIdentity)) {
          throw new Error('Anonymous identity is not allowed here');
        }

        return <Navigate to={`/spaces/${workspaceId.toString()}`} replace />;
      }}
    </WorkspaceLoader>
  );
}

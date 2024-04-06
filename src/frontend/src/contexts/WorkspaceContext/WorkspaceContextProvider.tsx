import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { PropsWithChildren } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';

import { WorkspaceContext } from './WorkspaceContext';

export function WorkspaceContextProvider({
  children,
  identity,
  workspaceId,
}: PropsWithChildren<{
  identity: DelegationIdentity;
  workspaceId: Principal;
}>) {
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  return (
    <WorkspaceContext.Provider value={{ actor, workspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

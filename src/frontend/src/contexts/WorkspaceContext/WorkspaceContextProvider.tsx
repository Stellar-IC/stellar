import { DelegationIdentity } from '@dfinity/identity';
import { PropsWithChildren } from 'react';

import { useWorkspaceActor } from '@/hooks/canisters/workspace/useWorkspaceActor';
import { CanisterId } from '@/types';

import { WorkspaceContext } from './WorkspaceContext';

export function WorkspaceContextProvider({
  children,
  identity,
  workspaceId,
}: PropsWithChildren<{
  identity: DelegationIdentity;
  workspaceId: CanisterId;
}>) {
  const { actor } = useWorkspaceActor({ identity, workspaceId });

  return (
    <WorkspaceContext.Provider value={{ actor, workspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

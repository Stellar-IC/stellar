import { PropsWithChildren } from 'react';

import { CanisterId } from '@/types';

import { useWorkspaceActor } from '@/hooks/ic/actors/useWorkspaceActor';
import { DelegationIdentity } from '@dfinity/identity';
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

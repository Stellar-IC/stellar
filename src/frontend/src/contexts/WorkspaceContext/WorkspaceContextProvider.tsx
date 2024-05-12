import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { PropsWithChildren } from 'react';

import { createActor } from '../../../../declarations/workspace';

import { WorkspaceContext } from './WorkspaceContext';

export function WorkspaceContextProvider({
  children,
  identity,
  workspaceId,
}: PropsWithChildren<{
  identity: DelegationIdentity;
  workspaceId: Principal;
}>) {
  const actor = createActor(workspaceId, {
    agentOptions: {
      identity,
    },
  });

  return (
    <WorkspaceContext.Provider value={{ actor, workspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

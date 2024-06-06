import { Principal } from '@dfinity/principal';
import { PropsWithChildren, useEffect, useState } from 'react';

import * as actorStore from '@/ic/actors/store';

import { _SERVICE } from '../../../../declarations/workspace/workspace.did';

import { WorkspaceContext } from './WorkspaceContext';

export function WorkspaceContextProvider({
  children,
  workspaceId,
}: PropsWithChildren<{
  workspaceId: Principal;
}>) {
  const [actor, setActor] = useState<_SERVICE | null>(null);

  useEffect(() => {
    const { manager } = actorStore.setWorkspace(workspaceId);
    const actor = manager.getActor();
    setActor(actor);
  }, [workspaceId]);

  return (
    <WorkspaceContext.Provider value={{ actor, workspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

import { createActorManager } from '@ic-reactor/core';

import { agentManager } from '@/ic/agentManager';

import * as userIndex from '../../../../declarations/user_index';
import * as userIndexDid from '../../../../declarations/user_index/user_index.did';
import * as workspaceIndex from '../../../../declarations/workspace_index';
import * as workspaceIndexDid from '../../../../declarations/workspace_index/workspace_index.did';

export const userIndexActorManager = createActorManager<userIndexDid._SERVICE>({
  agentManager,
  canisterId: userIndex.canisterId,
  idlFactory: userIndex.idlFactory,
});

export const workspaceIndexActorManager =
  createActorManager<workspaceIndexDid._SERVICE>({
    agentManager,
    canisterId: workspaceIndex.canisterId,
    idlFactory: workspaceIndex.idlFactory,
  });

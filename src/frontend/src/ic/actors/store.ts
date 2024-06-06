import { Principal } from '@dfinity/principal';
import { createActorManager } from '@ic-reactor/core';
import { ActorManager } from '@ic-reactor/core/dist/types';

import * as user from '../../../../declarations/user';
import * as userDid from '../../../../declarations/user/user.did';
import * as userIndex from '../../../../declarations/user_index';
import * as userIndexDid from '../../../../declarations/user_index/user_index.did';
import * as workspace from '../../../../declarations/workspace';
import * as workspaceDid from '../../../../declarations/workspace/workspace.did';
import * as workspaceIndex from '../../../../declarations/workspace_index';
import * as workspaceIndexDid from '../../../../declarations/workspace_index/workspace_index.did';
import { agentManager } from '../agentManager';

type ActorStore = {
  user: ActorManager<userDid._SERVICE> | null;
  user_index: ActorManager<userIndexDid._SERVICE>;
  workspace: ActorManager<workspaceDid._SERVICE> | null;
  workspace_index: ActorManager<workspaceIndexDid._SERVICE>;
};

const defaultActorManagers = {
  userIndex: createActorManager<userIndexDid._SERVICE>({
    agentManager,
    canisterId: userIndex.canisterId,
    idlFactory: userIndex.idlFactory,
  }),
  workspaceIndex: createActorManager<workspaceIndexDid._SERVICE>({
    agentManager,
    canisterId: workspaceIndex.canisterId,
    idlFactory: workspaceIndex.idlFactory,
  }),
};

export const actorStore: ActorStore = {
  user: null,
  user_index: defaultActorManagers.userIndex,
  workspace: null,
  workspace_index: defaultActorManagers.workspaceIndex,
};

// Subscribe to auth state changes to update the actors with a static canister id
agentManager.subscribeAuthState((authState, prevState) => {
  if (prevState.authenticated !== authState.authenticated) {
    actorStore.user_index = createActorManager<userIndexDid._SERVICE>({
      agentManager,
      canisterId: userIndex.canisterId,
      idlFactory: userIndex.idlFactory,
    });
    actorStore.workspace_index = createActorManager<workspaceIndexDid._SERVICE>(
      {
        agentManager,
        canisterId: workspaceIndex.canisterId,
        idlFactory: workspaceIndex.idlFactory,
      }
    );
  }
});

export function setUser(canisterId: Principal) {
  actorStore.user = createActorManager<userDid._SERVICE>({
    agentManager,
    canisterId,
    idlFactory: user.idlFactory,
  });
  const actor = actorStore.user.getActor();

  if (!actor) {
    throw new Error('Failed to create user actor');
  }

  return { actor, manager: actorStore.user };
}

export function setWorkspace(canisterId: Principal) {
  actorStore.workspace = createActorManager<workspaceDid._SERVICE>({
    agentManager,
    canisterId,
    idlFactory: workspace.idlFactory,
  });
  const actor = actorStore.workspace.getActor();

  if (!actor) {
    throw new Error('Failed to create workspace actor');
  }

  return { actor, manager: actorStore.workspace };
}

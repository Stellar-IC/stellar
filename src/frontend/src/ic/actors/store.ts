import { ActorSubclass } from '@dfinity/agent';
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
  user: ActorManager<ActorSubclass<userDid._SERVICE>> | null;
  user_index: ActorManager<ActorSubclass<userIndexDid._SERVICE>>;
  workspace: ActorManager<ActorSubclass<workspaceDid._SERVICE>> | null;
  workspace_index: ActorManager<ActorSubclass<workspaceIndexDid._SERVICE>>;
};

const defaultActorManagers: ActorStore = {
  user: null,
  user_index: createActorManager({
    agentManager,
    canisterId: userIndex.canisterId,
    idlFactory: userIndex.idlFactory,
  }),
  workspace: null,
  workspace_index: createActorManager({
    agentManager,
    canisterId: workspaceIndex.canisterId,
    idlFactory: workspaceIndex.idlFactory,
  }),
};

export const actorStore: ActorStore = {
  user: null,
  user_index: defaultActorManagers.user_index,
  workspace: null,
  workspace_index: defaultActorManagers.workspace_index,
};

// Subscribe to auth state changes to update the actors with a static canister id
agentManager.subscribeAuthState((authState, prevState) => {
  if (prevState.authenticated !== authState.authenticated) {
    actorStore.user_index = createActorManager({
      agentManager,
      canisterId: userIndex.canisterId,
      idlFactory: userIndex.idlFactory,
    });
    actorStore.workspace_index = createActorManager({
      agentManager,
      canisterId: workspaceIndex.canisterId,
      idlFactory: workspaceIndex.idlFactory,
    });
  }
});

export function setUser(canisterId: Principal) {
  actorStore.user = createActorManager({
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
  actorStore.workspace = createActorManager({
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

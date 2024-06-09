import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

import * as actorStore from '@/ic/actors/store';
import { logger as baseLogger } from '@/modules/logger';

import { _SERVICE } from '../../../../../declarations/user/user.did';
import {
  canisterId as canisterIdForWorkspaceIndex,
  createActor as createActorForWorkspaceIndex,
} from '../../../../../declarations/workspace_index';

/**
 * Register user, finding or creating a user for the given identity.
 * The result will contain the user's id which is the principal for their canister.
 *
 * @param identity
 * @returns Principal - user id
 */
export const registerUser = async (
  identity: DelegationIdentity
): Promise<{ userId: Principal; userActor: _SERVICE }> => {
  console.log('registerUser');
  const logger = baseLogger.getLogger('auth');
  const userIndex = actorStore.actorStore.user_index.getActor();

  if (!userIndex) {
    throw new Error('User index actor is not available');
  }

  logger.info(
    'Getting user canister prinipal for identity:',
    identity.getPrincipal().toString()
  );

  const result = await userIndex.registerUser();

  if ('err' in result) {
    if ('insufficientCycles' in result.err) {
      throw new Error('Insufficient Cycles for user registration');
    }

    throw new Error('Unknown error occurred during user registration');
  }

  const userId = result.ok;
  const { actor: userActor } = actorStore.setUser(userId);
  const [personalWorkspaceResult, profileResult] = await Promise.all([
    userActor.personalWorkspace(),
    userActor.profile(),
  ]);

  if ('err' in personalWorkspaceResult) {
    throw new Error('Failed to get user personal workspace');
  }

  if ('err' in profileResult) {
    throw new Error('Failed to get user profile');
  }

  const { username } = profileResult.ok;

  if (personalWorkspaceResult.ok.length === 0) {
    const workspaceIndexActor = createActorForWorkspaceIndex(
      canisterIdForWorkspaceIndex,
      {
        agentOptions: {
          identity,
        },
      }
    );
    const createWorkspaceResult = await workspaceIndexActor.createWorkspace();

    if ('err' in createWorkspaceResult) {
      throw new Error('Failed to create user personal workspace');
    }

    const workspaceId = createWorkspaceResult.ok;
    const { actor: workspaceActor } = actorStore.setWorkspace(workspaceId);

    await Promise.all([
      userActor.setPersonalWorkspace(workspaceId),
      workspaceActor.addUsers([
        [
          identity.getPrincipal(),
          {
            username,
            role: { admin: null },
            identity: identity.getPrincipal(),
            canisterId: userId,
          },
        ],
      ]),
    ]);

    return { userId, userActor };
  }

  logger.info(`Retrieved user canister principal: ${userId}`);

  return { userId, userActor };
};

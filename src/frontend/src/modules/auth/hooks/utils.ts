import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

import { logger as baseLogger } from '@/modules/logger';

import { createActor } from '../../../../../declarations/user';
import { Result_8 as ProfileQueryResult } from '../../../../../declarations/user/user.did';
import {
  canisterId as canisterIdForUserIndex,
  createActor as createActorForUserIndex,
} from '../../../../../declarations/user_index';
import {
  canisterId as canisterIdForWorkspaceIndex,
  createActor as createActorForWorkspaceIndex,
} from '../../../../../declarations/workspace_index';

const createAuthenticatedUserIndexActor = (identity: DelegationIdentity) =>
  createActorForUserIndex(canisterIdForUserIndex, {
    agentOptions: {
      identity,
    },
  });

/**
 * Register user, finding or creating a user for the given identity.
 * The result will contain the user's id which is the principal for their canister.
 *
 * @param identity
 * @returns Principal - user id
 */
export const registerUser = async (
  identity: DelegationIdentity
): Promise<Principal> => {
  const logger = baseLogger.getLogger('auth');
  const userIndex = createAuthenticatedUserIndexActor(identity);

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

  // get or create user's personal workspace
  const userActor = createActor(userId, {
    agentOptions: {
      identity,
    },
  });

  const personalWorkspaceResult = await userActor.personalWorkspace();
  if ('err' in personalWorkspaceResult) {
    throw new Error('Failed to get user personal workspace');
  }

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
    await userActor.setPersonalWorkspace(workspaceId);

    return userId;
  }

  logger.info(`Retrieved user canister principal: ${userId}`);

  return userId;
};

export const getUserProfile = async (args: {
  userId: Principal;
  identity: DelegationIdentity;
}): Promise<ProfileQueryResult> => {
  const logger = baseLogger.getLogger('auth');

  const { userId, identity } = args;
  const userActor = createActor(userId, {
    agentOptions: {
      identity,
    },
  });
  const result = await userActor.profile();

  if ('ok' in result) {
    logger.info('Retrieved profile for user:', result.ok.username[0]);
  } else {
    logger.error('Error occurred during user profile retrieval');
  }

  return result;
};

import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

import { logger as baseLogger } from '@/modules/logger';

import { createActor } from '../../../../../declarations/user';
import { Result_4 as ProfileQueryResult } from '../../../../../declarations/user/user.did';
import {
  canisterId as canisterIdForUserIndex,
  createActor as createActorForUserIndex,
} from '../../../../../declarations/user_index';

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

  logger.info(`Retrieved user canister principal: ${result.ok}`);

  return result.ok;
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

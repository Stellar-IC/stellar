import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { logger as baseLogger } from '@/modules/logger';
import { createActor } from '../../../../../declarations/user';
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

  logger.info('Getting user canister prinipal');
  const result = await userIndex.registerUser();

  if (!('ok' in result)) {
    throw new Error('Unknown error occurred during user registration');
  }

  logger.info(`Retrieved user canister principal: ${result.ok}`);

  return result.ok;
};

export const getUserProfile = async (args: {
  userId: Principal;
  identity: DelegationIdentity;
}) => {
  const logger = baseLogger.getLogger('auth');

  const { userId, identity } = args;
  const userActor = createActor(userId, {
    agentOptions: {
      identity,
    },
  });
  const result = await userActor.profile();

  if (!('ok' in result))
    throw new Error("There was an error getting user's profile");

  logger.info('Retrieved profile for user:', result.ok.username[0]);

  return result.ok;
};

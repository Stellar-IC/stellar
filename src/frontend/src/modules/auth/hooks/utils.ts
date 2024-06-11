import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

import * as actorStore from '@/ic/actors/store';
import { logger as baseLogger } from '@/modules/logger';

import { _SERVICE } from '../../../../../declarations/user/user.did';

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
    if ('InsufficientCycles' in result.err) {
      throw new Error('Insufficient Cycles for user registration');
    }

    throw new Error('Unknown error occurred during user registration');
  }

  const userId = result.ok;
  const { actor: userActor } = actorStore.setUser(userId);

  logger.info(`Retrieved user canister principal: ${userId}`);

  return { userId, userActor };
};

import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { useCallback, useEffect, useState } from 'react';

import { INTERNET_IDENTITY_HOST } from '@/config';
import * as actorStore from '@/ic/actors/store';
import { agentManager } from '@/ic/agentManager';
import { logger as baseLogger } from '@/modules/logger';

import { PublicUserProfile } from '../../../../../declarations/user/user.did';
import { login as _login } from '../commands';

import { registerUser } from './utils';

type AuthenticatedUserDetails = {
  userId: Principal;
  identity: DelegationIdentity;
  profile: PublicUserProfile;
};

export class AnonymousUserProfile implements PublicUserProfile {
  username = '';
  avatarUrl: [] | [string] = [];
}

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<Principal>(Principal.anonymous());
  const [identity, setIdentity] = useState<Identity>(new AnonymousIdentity());
  const [profile, setProfile] = useState<PublicUserProfile>(
    new AnonymousUserProfile()
  );

  const logger = baseLogger.getLogger('auth');
  logger.setDefaultLevel(baseLogger.levels.INFO);

  const updateState = useCallback(
    (userDetails: AuthenticatedUserDetails | undefined) => {
      if (!userDetails) return;
      const { userId, identity, profile } = userDetails;
      setIdentity(identity);
      setUserId(userId);
      setProfile(profile);
    },
    [setIdentity, setUserId, setProfile]
  );

  const getUserProfile = useCallback(
    async (identity: DelegationIdentity): Promise<AuthenticatedUserDetails> => {
      const userId = await registerUser(identity);
      const { manager: userActor } = actorStore.setUser(userId);
      const profileResult = await userActor.callMethod('profile');

      if ('ok' in profileResult) {
        return {
          userId,
          identity,
          profile: profileResult.ok,
        };
      }

      throw new Error(`Failed to get user profile. ${profileResult.err}`);
    },
    []
  );

  const login = async () => {
    setIsLoading(true);

    return _login({ identityProvider: `${INTERNET_IDENTITY_HOST}` })
      .then(agentManager.authenticate)
      .then(async (identity): Promise<AuthenticatedUserDetails | undefined> => {
        if (identity instanceof DelegationIdentity) {
          const result = getUserProfile(identity);
          // eslint-disable-next-line consistent-return
          return result;
        }

        logger.info('Failed to login');

        return undefined;
      })
      .then(updateState)
      .finally(() => {
        setIsLoading(false);
      });
  };

  const hydrate = useCallback(async () => {
    logger.info('Refreshing auth state');
    setIsLoading(true);

    return agentManager
      .authenticate()
      .then(async (identity): Promise<AuthenticatedUserDetails | undefined> => {
        if (identity instanceof AnonymousIdentity) {
          logger.info('Anonymous identity found. Done hydrating.');
          return;
        }

        if (identity instanceof DelegationIdentity) {
          const result = getUserProfile(identity);
          // eslint-disable-next-line consistent-return
          return result;
        }
      })
      .then(updateState)
      .finally(() => {
        setIsLoading(false);
      });
  }, [getUserProfile, logger, updateState]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      hydrate();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [hydrate, updateState]);

  return {
    identity,
    // If identity is a DelegationIdentity and user is not anonymous,
    // then the user is authenticated.
    // Ideally we would check if the user is authenticated by checking
    // if the identity is a DelegationIdentity but it would be difficult
    // to test because we would need to mock the DelegationIdentity class.
    isAuthenticated: 'getDelegation' in identity && !userId.isAnonymous(),
    isLoading,
    profile,
    setProfile,
    userId,
    login,
  };
};

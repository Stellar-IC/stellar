import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { useCallback, useEffect, useState } from 'react';

import { INTERNET_IDENTITY_HOST } from '@/config';
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
  const [error, setError] = useState<Error | null>(null);

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
      const { userId, userActor } = await registerUser(identity);
      const profileResult = await userActor.profile();

      if ('ok' in profileResult) {
        return {
          userId,
          identity,
          profile: profileResult.ok,
        };
      }

      const err = new Error(`Failed to get user profile. ${profileResult.err}`);
      setError(err);
      throw err;
    },
    []
  );

  const login = async () => {
    setIsLoading(true);

    return _login({ identityProvider: `${INTERNET_IDENTITY_HOST}` })
      .then(agentManager.authenticate)
      .then(async (identity): Promise<AuthenticatedUserDetails | undefined> => {
        if (identity instanceof DelegationIdentity) {
          return getUserProfile(identity);
        }

        setError(new Error('Failed to authenticate'));
        return undefined;
      })
      .then(updateState)
      .catch((e) => {
        setError(e);
      })
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
        if (identity instanceof DelegationIdentity) {
          return getUserProfile(identity);
        }

        return undefined;
      })
      .then(updateState)
      .catch((e) => {
        setError(e);
      })
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
    error,
  };
};

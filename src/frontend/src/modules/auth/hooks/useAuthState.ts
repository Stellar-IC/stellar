import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { useEffect, useState } from 'react';

import { useHydrate } from './useHydrate';
import { getUserProfile, registerUser } from './utils';

import { UserProfile } from '../../../../../declarations/user/user.did';
import { getAuthClient } from '../client';
import { login as _login } from '../commands';

export class AnonymousUserProfile implements UserProfile {
  username = 'Anonymous';
  created_at = 1000000000000000000n;
  updatedAt = 1000000000000000000n;
}

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [userId, setUserId] = useState<Principal>(Principal.anonymous());
  const [identity, setIdentity] = useState<Identity>(new AnonymousIdentity());
  const [profile, setProfile] = useState<UserProfile>(
    new AnonymousUserProfile()
  );
  const { hydrate } = useHydrate();

  const login = async (options: { identityProvider: string }) => {
    setIsLoading(true);

    return _login(options).then(async () => {
      getAuthClient()
        .then(async (authClient) => authClient.getIdentity())
        .then(async (identity) => {
          if (identity instanceof DelegationIdentity) {
            setIdentity(identity);
            const newUserId = await registerUser(identity);
            setUserId(newUserId);
            const result = await getUserProfile({
              userId: newUserId,
              identity,
            });
            if ('ok' in result) {
              setProfile(result.ok);
            }
            // TODO: handle error
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  };

  useEffect(() => {
    setIsHydrating(true);

    const timeout = setTimeout(() => {
      hydrate()
        .then((result) => {
          if (result) {
            const { userId, identity, profile } = result;
            setIdentity(identity);
            setUserId(userId);
            setProfile(profile);
          }
        })
        .finally(() => {
          setIsHydrating(false);
        });
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [hydrate]);

  return {
    identity,
    // If identity is a DelegationIdentity and user is not anonymous,
    // then the user is authenticated.
    // Ideally we would check if the user is authenticated by checking
    // if the identity is a DelegationIdentity but it would be difficult
    // to test because we would need to mock the DelegationIdentity class.
    isAuthenticated: 'getDelegation' in identity && !userId.isAnonymous(),
    isLoading: isLoading || isHydrating,
    profile,
    userId,
    login,
  };
};

import { useEffect, useState } from 'react';
import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { AnonymousIdentity, Identity } from '@dfinity/agent';
import { getAuthClient, login as _login } from '../client';

import { useHydrate } from './useHydrate';
import { getUserProfile, registerUser } from './utils';
import { UserProfile } from '../../../../../declarations/user/user.did';

class AnonymousUserProfile implements UserProfile {
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
            setProfile(await getUserProfile({ userId: newUserId, identity }));
          }
        })
        .catch((err) => {
          console.error(err);
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
    isAuthenticated:
      identity instanceof DelegationIdentity && !userId.isAnonymous(),
    isLoading: isLoading || isHydrating,
    profile,
    userId,
    login,
  };
};

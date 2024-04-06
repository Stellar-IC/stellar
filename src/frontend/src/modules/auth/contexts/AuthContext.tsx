import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createContext, PropsWithChildren, useContext } from 'react';

import { UserProfile } from '../../../../../declarations/user/user.did';
import { useAuthState } from '../hooks/useAuthState';

type SerializedUserProfile = Omit<UserProfile, 'username'> & {
  username: string;
};

// eslint-disable-next-line no-spaced-func
const AuthContext = createContext<{
  login: () => void;
  identity: Identity;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: Principal;
  profile: SerializedUserProfile;
  setProfile: (profile: UserProfile) => void;
} | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuthContext must be used within AuthContextProvider');
  }

  return context;
};

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const {
    login,
    identity,
    isAuthenticated,
    isLoading,
    userId,
    profile,
    setProfile,
  } = useAuthState();

  const serializedProfile: SerializedUserProfile = {
    ...profile,
    username: profile.username || '',
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        identity,
        isAuthenticated,
        isLoading,
        userId,
        profile: serializedProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

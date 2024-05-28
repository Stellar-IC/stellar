import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createContext, PropsWithChildren, useContext } from 'react';

import { PublicUserProfile } from '../../../../../declarations/user/user.did';
import { useAuthState } from '../hooks/useAuthState';

type SerializedUserProfile = Omit<PublicUserProfile, 'username'> & {
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
  setProfile: React.Dispatch<React.SetStateAction<PublicUserProfile>>;
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

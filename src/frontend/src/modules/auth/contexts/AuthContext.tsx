import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createContext, PropsWithChildren, useContext } from 'react';
import { UserProfile } from '../../../../../declarations/user/user.did';
import { useAuthState } from '../hooks/auth';

type SerializedUserProfile = Omit<UserProfile, 'username'> & {
  username: string;
};

const AuthContext = createContext<{
  login: (options: { identityProvider: string }) => void;
  identity: Identity;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: Principal;
  profile: SerializedUserProfile;
} | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuthContext must be used within AuthContextProvider');
  }

  return context;
};

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const { login, identity, isAuthenticated, isLoading, userId, profile } =
    useAuthState();

  const serializedProfile: SerializedUserProfile = {
    ...profile,
    username: profile.username[0] || '',
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

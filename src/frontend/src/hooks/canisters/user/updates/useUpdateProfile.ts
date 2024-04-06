import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

import { useUpdate } from '@/hooks/useUpdate';

import { useUserActor } from '../useUserActor';

export const useUpdateProfile = (options: {
  userId: Principal;
  identity: Identity;
}) => {
  const { actor } = useUserActor(options);

  return useUpdate(options.userId, actor.updateProfile);
};

import * as actors from '@/ic/actors/store';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

export const useCreateDefaultWorkspace = () => {
  const { identity, userId, profile } = useAuthContext();

  const createWorkspace = () => {
    const workspaceIndexActor = actors.actorStore.workspace_index.getActor();
    const userActor = actors.actorStore.user?.getActor();

    if (!workspaceIndexActor) {
      throw new Error('Workspace index actor is not available');
    }

    if (!userActor) {
      throw new Error('User actor is not available');
    }

    const { username } = profile;

    return workspaceIndexActor
      .createWorkspace({
        name: `${username}'s space`,
        description: 'Wow! My very own space',
        additionalOwners: [],
        initialUsers: [
          [
            identity.getPrincipal(),
            {
              username,
              role: { admin: null },
              identity: identity.getPrincipal(),
              canisterId: userId,
            },
          ],
        ],
      })
      .then(async (res) => {
        if ('err' in res) {
          throw new Error('Failed to create user personal workspace');
        }

        const workspaceId = res.ok;
        actors.setWorkspace(workspaceId);

        return Promise.all([
          Promise.resolve(workspaceId),
          userActor.setPersonalWorkspace(workspaceId),
        ]);
      });
  };

  return { createWorkspace };
};

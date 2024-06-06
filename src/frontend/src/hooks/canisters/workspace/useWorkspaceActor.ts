import { useWorkspaceContext } from '@/contexts/WorkspaceContext/useWorkspaceContext';

export const useWorkspaceActor = () => {
  const context = useWorkspaceContext();

  if (!context.actor) {
    throw new Error('Workspace actor has not been created');
  }

  return context.actor;
};

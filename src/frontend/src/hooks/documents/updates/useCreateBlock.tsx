import { Identity } from '@dfinity/agent';
import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import { useUpdate } from '../../useUpdate';

export const useCreateBlock = (options: { identity: Identity }) => {
  const { actor, canisterId } = useDocumentsActor(options);
  return useUpdate(canisterId, actor.addBlock);
};

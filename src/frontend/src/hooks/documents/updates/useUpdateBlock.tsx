import { Identity } from '@dfinity/agent';
import { useDocumentsActor } from '@/hooks/ic/actors/useDocumentsActor';
import {
  UpdateBlockUpdateInput,
  UpdateBlockUpdateOutput,
} from '../../../../../declarations/documents/documents.did';
import { useUpdate } from '../../useUpdate';

export const useUpdateBlock = (options: {
  identity: Identity;
}): [
  (input: [UpdateBlockUpdateInput]) => Promise<UpdateBlockUpdateOutput>,
  { data: UpdateBlockUpdateOutput | null; isLoading: boolean }
] => {
  const { actor, canisterId } = useDocumentsActor(options);

  return useUpdate(canisterId, actor.updateBlock);
};

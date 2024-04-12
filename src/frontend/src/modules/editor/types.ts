import { PartialBlockEvent } from '@/hooks/documents/useTextBlockKeyboardEventHandlers/types';
import { Block } from '@/types';

export type EditorSaveFn = (data: {
  events: PartialBlockEvent[];
  updatedBlocks: { [key: string]: Block };
}) => Promise<void>;

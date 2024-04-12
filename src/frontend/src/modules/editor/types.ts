import { PartialBlockEvent } from '@/modules/editor/hooks/useEditorEventHandlers/types';
import { Block } from '@/types';

export type EditorSaveFn = (data: {
  events: PartialBlockEvent[];
  updatedBlocks: { [key: string]: Block };
}) => Promise<void>;

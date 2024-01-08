import { ExternalId } from '@/types';
import { Tree } from '@stellar-ic/lseq-ts';

export type TextBlockBlockType =
  | { page: null }
  | { paragraph: null }
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { todoList: null }
  | { bulletedList: null }
  | { numberedList: null }
  | { toggleList: null }
  | { toggleHeading1: null }
  | { toggleHeading2: null }
  | { toggleHeading3: null }
  | { code: null }
  | { quote: null }
  | { callout: null };

export type TextBlockProps = {
  blockIndex: number;
  blockType: TextBlockBlockType;
  blockExternalId: ExternalId;
  parentBlockExternalId?: ExternalId | null;
  parentBlockIndex?: number;
  placeholder?: string;
  value: Tree.Tree;
  onInsert: (cursorPosition: number, character: string) => void;
  onRemove: (cursorPosition: number) => void;
};

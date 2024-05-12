import { Tree } from '@/modules/lseq';
import { ExternalId } from '@/types';

export type TextBlockBlockType =
  | { page: null }
  | { paragraph: null }
  | { heading1: null }
  | { heading2: null }
  | { heading3: null }
  | { todoList: null }
  | { bulletedList: null }
  | { numberedList: null }
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
  placeholder?: string;
  value: Tree.Tree;
};

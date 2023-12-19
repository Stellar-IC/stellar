import { createContext } from 'react';
import { Block, Page } from '@/types';
import {
  BlockType,
  Result as PageByUuidQueryResult,
  Result_1 as BlockByUuidQueryResult,
  TreeEvent,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

// eslint-disable-next-line no-spaced-func
export const PagesContext = createContext<{
  pages: {
    data: Record<string, Page>;
    query: (args_0: UUID) => Promise<PageByUuidQueryResult>;
    updateLocal: (externalId: string, updatedData: Page) => void;
  };
  blocks: {
    data: Record<string, Block>;
    query: (args_0: UUID) => Promise<BlockByUuidQueryResult>;
    updateLocal: (externalId: string, updatedData: Block) => void;
  };
  addBlock: (pageExternalId: UUID, blockType: BlockType, index: number) => void;
  removeBlock: (pageExternalId: UUID, index: number) => void;
  updateBlock: (
    blockExternalId: UUID,
    event:
      | {
          updateBlockType: {
            data: { blockType: BlockType; blockExternalId: UUID };
          };
        }
      | {
          updateProperty:
            | {
                title: {
                  data: { transaction: TreeEvent[]; blockExternalId: UUID };
                };
              }
            | {
                checked: {
                  data: { checked: boolean; blockExternalId: UUID };
                };
              };
        }
      | {
          updateParent: {
            data: { parentBlockExternalId: UUID; blockExternalId: UUID };
          };
        }
      | {
          updateContent: {
            data: { transaction: TreeEvent[]; blockExternalId: UUID };
          };
        }
  ) => void;
  //   insertCharacter: (
  //     blockExternalId: string,
  //     position: number,
  //     character: string
  //   ) => Promise<void>;
  //   removeCharacter: (blockExternalId: string, position: number) => Promise<void>;
} | null>(null);

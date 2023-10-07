import { createContext } from 'react';
import { Block, Page } from '@/types';
import {
  BlockType,
  Result as PageByUuidQueryResult,
  Result_1 as BlockByUuidQueryResult,
  Transaction,
  UUID,
} from '../../../../declarations/documents/documents.did';

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
  addBlock: (pageexternalId: UUID, blockType: BlockType, index: number) => void;
  removeBlock: (pageexternalId: UUID, blockExternalId: UUID) => void;
  updateBlock: (pageexternalId: UUID, blockExternalId: UUID, transactions: Transaction[]) => void;
} | null>(null);

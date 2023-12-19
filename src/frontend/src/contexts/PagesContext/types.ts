import {
  BlockType,
  TreeEvent,
  UUID,
} from '../../../../declarations/workspace/workspace.did';

export type BlockEvent =
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
    };

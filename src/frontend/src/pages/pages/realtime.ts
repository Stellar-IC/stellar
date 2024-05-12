import { db } from '@/db';
import { store } from '@/modules/data-store';
import { EditorController } from '@/modules/editor/EditorController';
import { PartialBlockEvent } from '@/modules/editor/hooks/useEditorEventHandlers/types';
import { Tree } from '@/modules/lseq';
import { Block } from '@/types';

import {
  BlockBlockTypeUpdatedEventData,
  BlockContentUpdatedEventData,
  BlockCreatedEventData,
  BlockEvent,
  BlockParentUpdatedEventData,
  BlockPropertyCheckedUpdatedEventData,
  BlockPropertyTitleUpdatedEventData,
} from '../../../../declarations/workspace/workspace.did';

const saveBlocks = async (blocks: Block[]) => {
  store.blocks.bulkPut(
    blocks.map((block) => ({
      key: block.uuid,
      value: block,
    }))
  );

  await db.blocks.bulkPut(blocks);
};

export const handlePropertyTitleUpdate = (
  data: BlockPropertyTitleUpdatedEventData
) => {
  const { blockExternalId, transaction } = data;

  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);

      await saveBlocks(blocks);

      blocks.forEach((block) => {
        // Find the blcok in the DOM and update the content
        const domElement = document.querySelector(
          `[data-blockid="${block.uuid}"] span[role="textbox"]`
        );
        if (domElement) {
          domElement.textContent = Tree.toText(block.properties.title);
        }
      });
    },
  });

  editorController
    .updateBlock(blockExternalId, {
      updatePropertyTitle: {
        blockExternalId,
        transaction,
      },
    })
    .save(true);
};

const handlePropertyCheckedUpdate = (
  data: BlockPropertyCheckedUpdatedEventData
) => {
  const { blockExternalId, checked } = data;

  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);
      saveBlocks(blocks);
    },
  });

  editorController
    .updateBlock(blockExternalId, {
      updatePropertyChecked: {
        blockExternalId,
        checked,
      },
    })
    .save(true);
};

const handleBlockTypeUpdate = (data: BlockBlockTypeUpdatedEventData) => {
  const { blockExternalId } = data;

  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);
      saveBlocks(blocks);
    },
  });

  editorController
    .updateBlock(blockExternalId, {
      updateBlockType: data,
    })
    .save(true);
};

const handleParentUpdate = (data: BlockParentUpdatedEventData) => {
  const { blockExternalId } = data;
  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);
      saveBlocks(blocks);
    },
  });

  editorController
    .updateBlock(blockExternalId, {
      updateParent: data,
    })
    .save(true);
};

const handleContentUpdate = (data: BlockContentUpdatedEventData) => {
  const { blockExternalId, transaction } = data;

  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);
      saveBlocks(blocks);
    },
  });

  editorController.updateBlockContent(blockExternalId, transaction).save(true);
};

const handleBlockCreated = (data: BlockCreatedEventData) => {
  // TODO: Implement
  const { block, index } = data;
  const editorController = new EditorController({
    onSave: async (data: {
      events: PartialBlockEvent[];
      updatedBlocks: { [key: string]: Block };
    }) => {
      const { updatedBlocks } = data;
      const blocks = Object.values(updatedBlocks);
      saveBlocks(blocks);
    },
  });
  // editorController.addBlock(parse(block.parent[0])).save(true);
};

export const blockEventHandler = (message: { blockEvent: BlockEvent }) => {
  if ('blockEvent' in message) {
    const { blockEvent } = message;
    const { data } = blockEvent;

    if ('blockUpdated' in data) {
      if ('updatePropertyTitle' in data.blockUpdated) {
        return handlePropertyTitleUpdate(data.blockUpdated.updatePropertyTitle);
      }

      if ('updatePropertyChecked' in data.blockUpdated) {
        return handlePropertyCheckedUpdate(
          data.blockUpdated.updatePropertyChecked
        );
      }

      if ('updateBlockType' in data.blockUpdated) {
        return handleBlockTypeUpdate(data.blockUpdated.updateBlockType);
      }

      // TODO: Fix this, tab/shift-tab doesn't work
      if ('updateParent' in data.blockUpdated) {
        return handleParentUpdate(data.blockUpdated.updateParent);
      }

      if ('updateContent' in data.blockUpdated) {
        return handleContentUpdate(data.blockUpdated.updateContent);
      }
    } else if ('blockCreated' in data) {
      return handleBlockCreated(data.blockCreated);
    }
  }
};

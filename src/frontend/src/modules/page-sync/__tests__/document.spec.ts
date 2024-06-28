import { v4 } from 'uuid';

import { CollaborativeDocument } from '../document';
import { DocumentObject } from '../fixtures/doc';
import { helloExclamation } from '../mocks/document_changes';
import { DocumentUpdate } from '../types';

const mockWebSocketProvider = {
  on: jest.fn(),
  send: jest.fn(),
};

describe('CollaborativeDocument', () => {
  let doc: CollaborativeDocument;

  beforeEach(() => {
    doc = new CollaborativeDocument({
      provider: mockWebSocketProvider,
      page: {
        id: 'page-id',
        parent: {
          id: 'workspace-id',
          type: { workspace: null },
        },
      },
      userId: 'test_user',
    });
  });

  it('should be created', () => {
    const stateObject = doc.toJson();
    expect(stateObject.children).toEqual([]);
    expect(stateObject.content).toEqual('');
    expect(stateObject.id).toEqual(doc.state.id);
    expect(stateObject.props).toEqual({});
  });

  describe('toJson', () => {
    it('should return a state object', () => {
      const pageId = doc.state.id;
      const updates: DocumentUpdate[] = [
        // Create heading block
        {
          id: v4(), // update id
          changes: [
            {
              blockId: pageId,
              data: {
                children: {
                  insert: {
                    position: [1],
                    transactionType: { insert: null },
                    value: 'block-id-1',
                  },
                },
              },
            },
            {
              blockId: 'block-id-1',
              data: {
                blockType: { heading1: null },
              },
            },
          ],
          time: 0n,
          userId: 'test',
        },
        // Change props of heading block
        {
          id: v4(), // update id
          changes: [
            {
              blockId: 'block-id-1',
              data: {
                props: [
                  ['checked', { boolean: true }],
                  ['foo', { text: 'bar' }],
                ],
              },
            },
          ],
          time: 0n,
          userId: 'test',
        },
        // Change content of heading block
        {
          id: v4(), // update id
          changes: helloExclamation('block-id-1'),
          time: 0n,
          userId: 'test',
        },
        // Insert a new block wih a nested block
        {
          id: v4(), // update id
          changes: [
            {
              blockId: pageId,
              data: {
                children: {
                  insert: {
                    position: [2],
                    transactionType: { insert: null },
                    value: 'block-id-2',
                  },
                },
              },
            },
            {
              blockId: 'block-id-2',
              data: {
                children: {
                  insert: {
                    position: [1],
                    transactionType: { insert: null },
                    value: 'block-id-2a',
                  },
                },
              },
            },
          ],
          time: 0n,
          userId: 'test',
        },
      ];

      doc.state.updates.push(...updates);

      const stateObject = doc.toJson();
      expect(stateObject).toEqual(DocumentObject);
    });
  });
});

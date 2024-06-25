import { parse, v4 } from 'uuid';

import { CollaborativeDocument, DocumentStateUpdate } from '../document';
import { documentStateObject } from '../fixtures/doc';
import { helloExclamation } from '../mocks/document_changes';

const mockWebSocketProvider = {
  on: jest.fn(),
  send: jest.fn(),
};

describe('CollaborativeDocument', () => {
  let doc: CollaborativeDocument;

  beforeEach(() => {
    doc = new CollaborativeDocument({
      provider: mockWebSocketProvider,
      pageId: 'page-id',
    });
  });

  it('should be created', () => {
    const stateObject = doc.toObject();
    expect(stateObject.children).toEqual([]);
    expect(stateObject.content).toEqual('');
    expect(stateObject.id).toEqual(doc.state.id);
    expect(stateObject.props).toEqual({});
  });

  describe('toObject', () => {
    it('should return a state object', () => {
      const pageId = doc.state.id;
      const updates: DocumentStateUpdate[] = [
        // Create heading block
        {
          id: parse(v4()), // update id
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
          id: parse(v4()), // update id
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
          id: parse(v4()), // update id
          changes: helloExclamation('block-id-1'),
          time: 0n,
          userId: 'test',
        },
        // Insert a new block wih a nested block
        {
          id: parse(v4()), // update id
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

      const stateObject = doc.toObject();
      expect(stateObject).toEqual(documentStateObject);
    });
  });
});

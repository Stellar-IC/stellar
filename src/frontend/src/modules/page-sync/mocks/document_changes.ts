export function helloExclamation(blockId: string) {
  return [
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [1],
            transactionType: { insert: null },
            value: 'H',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [2],
            transactionType: { insert: null },
            value: 'e',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [3],
            transactionType: { insert: null },
            value: 'l',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [4],
            transactionType: { insert: null },
            value: 'l',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [5],
            transactionType: { insert: null },
            value: 'o',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [6],
            transactionType: { insert: null },
            value: '?',
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          delete: {
            position: [6],
            transactionType: { delete: null },
          },
        },
      },
    },
    {
      blockId,
      data: {
        content: {
          insert: {
            position: [7],
            transactionType: { insert: null },
            value: '!',
          },
        },
      },
    },
  ];
}

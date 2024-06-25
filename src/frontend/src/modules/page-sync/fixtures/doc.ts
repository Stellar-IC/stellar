export const documentStateObject = {
  id: 'page-id',
  props: {},
  children: [
    {
      id: 'block-id-1',
      props: {
        checked: {
          boolean: true,
        },
        foo: {
          text: 'bar',
        },
      },
      children: [],
      content: 'Hello!',
      blockType: {
        heading1: null,
      },
    },
    {
      id: 'block-id-2',
      props: {},
      children: [
        {
          id: 'block-id-2a',
          props: {},
          children: [],
          content: '',
          blockType: {
            paragraph: null,
          },
        },
      ],
      content: '',
      blockType: {
        paragraph: null,
      },
    },
  ],
  content: '',
  blockType: {
    paragraph: null,
  },
};

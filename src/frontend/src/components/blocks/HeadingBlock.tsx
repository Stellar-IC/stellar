// import { Heading } from "@mantine/core";
import { Box } from '@mantine/core';
import { useCallback } from 'react';
import { Block } from '@/types';

export const HeadingBlock = ({ block }: { block: Block }) => {
  const getSize = useCallback(() => {
    if ('heading3' in block.blockType) return 'lg';
    if ('heading2' in block.blockType) return 'xl';
    return '2xl';
  }, [block]);

  return (
    // <Heading
    //     size={getSize()}
    //     role="textbox"
    //     contentEditable
    //     suppressContentEditableWarning
    //     style={{
    //         outline: "none",
    //     }}
    //     marginBottom="1rem"
    // >
    //     {/* {block.properties["title"][0]} */}
    // </Heading>
    <Box />
  );
};

import { Box } from '@mantine/core';
import { createRef, useEffect, useMemo } from 'react';

import { Node, Tree } from '@stellar-ic/lseq-ts';
import { NodeRenderer } from './NodeRenderer';

type TreeViewerProps = {
  tree: Tree.Tree;
};

export const TreeViewer = ({ tree }: TreeViewerProps) => {
  const canvasRef = useMemo(() => createRef<HTMLCanvasElement>(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.canvas.height = 1000;
      ctx.canvas.width = 1000;
      ctx.clearRect(0, 0, 100, 100);

      ctx.font = '12px Arial';

      function nodes(tree: Tree.Tree): Node.Node[] {
        function buildNodes(rootNode: Node.Node): Node.Node[] {
          const shouldHideDeleted = false;
          let final = shouldHideDeleted && rootNode.deletedAt ? [] : [rootNode];

          if (rootNode.children.size === 0) return final;

          for (let i = 0; i < rootNode.base; i += 1) {
            const childNode = rootNode.children.get(i);
            if (!childNode) continue;
            final = [...final, ...buildNodes(childNode)];
          }

          return final;
        }

        return buildNodes(tree.rootNode);
      }

      function displayCharacters(ctx: CanvasRenderingContext2D) {
        const characters = nodes(tree);
        let i = 0;

        for (const character of characters) {
          const x = (i * 100) % 1000;
          const y = Math.floor(i / 10) * 100;
          const nodeRenderer = new NodeRenderer(ctx, character, i - 1, x, y);
          nodeRenderer.render();
          i += 1;
        }
      }

      displayCharacters(ctx);
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, [canvasRef, tree]);

  return (
    <Box
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="#e8e8e8"
      w="100%"
      h="400px"
      // overflow="scroll"
      // borderTop="1px solid #aaa"
      // boxShadow="0px 8px 20px 0px #000"
    >
      <canvas ref={canvasRef} height="10000px" width="10000px" />
    </Box>
  );
};

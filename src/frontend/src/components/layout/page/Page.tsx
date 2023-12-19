import { Box } from '@mantine/core';
import { PropsWithChildren } from 'react';

export function Page({ children }: PropsWithChildren) {
  return <Box w="100%">{children}</Box>;
}

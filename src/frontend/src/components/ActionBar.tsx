import { ActionIcon, Flex } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';

import { layoutManager } from '@/LayoutManager';

import classes from './ActionBar.module.css';
import { ColorSchemeToggle } from './ColorSchemeToggle/ColorSchemeToggle';

interface ActionBarProps {
  additionalActions?: React.ReactNode;
}

export function ActionBar({ additionalActions }: ActionBarProps) {
  return (
    <Flex className={classes.wrapper}>
      <Flex className={classes.actions}>
        <ActionIcon
          variant="subtle"
          onClick={() => {
            if (layoutManager.layout === 'NAVIGATION_OPEN') {
              layoutManager.layout = 'CLOSED';
            } else {
              layoutManager.layout = 'NAVIGATION_OPEN';
            }
          }}
        >
          <IconMenu2 />
        </ActionIcon>
      </Flex>
      <Flex gap="sm" className={classes.actions}>
        {additionalActions}
        <ColorSchemeToggle />
      </Flex>
    </Flex>
  );
}

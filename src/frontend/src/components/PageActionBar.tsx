import { Button, Flex } from '@mantine/core';
import { IconHistory, IconMenu2 } from '@tabler/icons-react';

import { layoutManager } from '@/LayoutManager';

import classes from './PageActionBar.module.css';

export function PageActionBar({
  openActivityLog,
}: {
  openActivityLog: () => void;
}) {
  return (
    <Flex className={classes.wrapper}>
      <Flex className={classes.actions}>
        <Button
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
        </Button>
      </Flex>
      <Flex gap="sm" className={classes.actions}>
        <Button variant="subtle" onClick={openActivityLog}>
          <IconHistory />
        </Button>
      </Flex>
    </Flex>
  );
}

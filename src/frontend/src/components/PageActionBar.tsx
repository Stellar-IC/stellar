import { Flex } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';

import classes from './PageActionBar.module.css';

export function PageActionBar({
  openActivityLog,
}: {
  openActivityLog: () => void;
}) {
  return (
    <Flex className={classes.wrapper}>
      <Flex gap="sm" className={classes.actions}>
        <IconHistory onClick={openActivityLog} />
      </Flex>
    </Flex>
  );
}

import {
  Button,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  useMantineColorScheme,
} from '@mantine/core';
import { IconPaint } from '@tabler/icons-react';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Menu width="dropdown">
      <MenuTarget>
        <Button size="compact-sm" variant="transparent">
          <IconPaint />
        </Button>
      </MenuTarget>
      <MenuDropdown>
        <MenuItem onClick={() => setColorScheme('light')}>Light</MenuItem>
        <MenuItem onClick={() => setColorScheme('dark')}>Dark</MenuItem>
        <MenuItem onClick={() => setColorScheme('auto')}>Auto</MenuItem>
      </MenuDropdown>
    </Menu>
  );
}

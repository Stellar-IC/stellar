import {
  Button,
  Group,
  Menu,
  MenuDropdown,
  // MenuButton,
  MenuItem,
  MenuTarget,
  Text,
  //  MenuList
} from '@mantine/core';
import { useCallback } from 'react';
import { INTERNET_IDENTITY_HOST } from '@/config';
import { logout } from '@/modules/auth/commands';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';
import classes from './AuthButton.module.css';

export function AuthButton() {
  const { isAuthenticated, login, profile, userId } = useAuthContext();

  const handleLogin = useCallback(
    () =>
      login({
        identityProvider: `${INTERNET_IDENTITY_HOST}`,
      }),
    [login]
  );

  return (
    <div className={classes.section}>
      {isAuthenticated ? (
        <>
          <Text className={classes.userId}>{userId.toString()}</Text>
          <Menu width="target">
            <MenuTarget>
              <Button size="sm" variant="transparent">
                {profile.username || '---'}
              </Button>
            </MenuTarget>
            <MenuDropdown>
              <MenuItem onClick={() => logout()}>Profile</MenuItem>
              <MenuItem onClick={() => logout()}>Logout</MenuItem>
            </MenuDropdown>
          </Menu>
        </>
      ) : (
        <Group>
          <Text>{profile.username}</Text>
          <Button size="sm" onClick={handleLogin}>
            Login
          </Button>
        </Group>
      )}
    </div>
  );
}

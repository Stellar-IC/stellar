import type { Principal } from '@dfinity/principal';
import {
  Text,
  Group,
  px,
  useMantineTheme,
  Button,
  Flex,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
} from '@mantine/core';
import { Link } from 'react-router-dom';

import { useLayoutManager } from '@/LayoutManager';
import { logout } from '@/modules/auth/commands';
import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import authButtonClasses from './AuthButton.module.css';
import classes from './NavbarSearch.module.css';
import { PrincipalBadge } from './PrincipalBadge';

export function SettingsNavigation({
  workspaceId,
}: {
  workspaceId?: Principal | null;
}) {
  const theme = useMantineTheme();
  const { layout, layoutManager } = useLayoutManager();
  const isOpen = layout === 'NAVIGATION_OPEN';
  const { isAuthenticated, profile } = useAuthContext();

  const xsBreakpoint = Number(`${px(theme.breakpoints.xs)}`.replace('px', ''));

  return (
    <nav
      className={classes.navbar}
      style={
        isOpen
          ? { transition: '0.2s ease-in-out' }
          : {
              overflowX: 'hidden',
              width: 0,
              padding: 0,
              opacity: 0,
              transition: '0.2s ease-in-out',
            }
      }
    >
      <div className={classes.section}>
        <div className={authButtonClasses.section}>
          {isAuthenticated ? (
            <Flex>
              <Menu width="target">
                <MenuTarget>
                  <Button size="sm" variant="transparent">
                    {profile.username || '---'}
                  </Button>
                </MenuTarget>
                <MenuDropdown>
                  <MenuItem onClick={() => logout()}>Logout</MenuItem>
                </MenuDropdown>
              </Menu>
            </Flex>
          ) : (
            <Group>
              <Text>{profile.username}</Text>
              <Button
                size="sm"
                // onClick={() => {
                //   login();
                // }}
              >
                Login
              </Button>
            </Group>
          )}
        </div>
      </div>
      <div className={classes.section}>
        <div
          style={{
            padding: theme.spacing.xs,
            paddingTop: 0,
          }}
        >
          <Text size="sm">Workspace</Text>
          {workspaceId && <PrincipalBadge principal={workspaceId} />}
        </div>
      </div>

      <div className={classes.section}>
        <div className={classes.pages}>
          <Link
            to="/settings"
            className={classes.pageLink}
            style={{
              flexGrow: 1,
              alignSelf: 'center',
            }}
            onClick={() => {
              if (document.body.clientWidth < xsBreakpoint) {
                layoutManager.layout = 'CLOSED';
              }
            }}
          >
            Settings
          </Link>
        </div>
      </div>

      {/* {workspaceId && <PageLinksSection />} */}
    </nav>
  );
}

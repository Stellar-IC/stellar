import {
  Box,
  Button,
  Flex,
  // IconButton,
  Input,
  Menu,
  // MenuButton,
  MenuItem,
  // MenuList,
  Text,
  // useStyleConfig,
} from '@mantine/core';
// import { CartOutline, Menu as MenuIcon, LocationOutline } from "react-ionicons";
import { Link } from 'react-router-dom';
import { AuthButton } from '../AuthButton/AuthButton';

function AppSearch() {
  return (
    <Box w="100%">
      <Input height="40px" placeholder="Search Leafy" />
    </Box>
  );
}

export function AppHeader() {
  // const styles = useStyleConfig("AppHeader");

  return (
    <Box>
      <Flex
        // alignItems="center"
        justify="space-between"
        px="50"
      >
        <Text>Leafy</Text>
        <Box>
          <AuthButton />
          {/* <IconButton
                        aria-label="View your cart"
                        color="inherit"
                        icon={<CartOutline color="inherit" />}
                    /> */}
        </Box>
      </Flex>
      <Flex gap="100" px="50" py="25">
        <Menu>
          {/* <MenuButton
                        as={IconButton}
                        aria-label="Toggle app menu"
                        variant="ghost"
                        icon={<MenuIcon color="inherit" />}
                        size="xs"
                    ></MenuButton> */}
          {/* <MenuList color="black">
                        <MenuItem as={Link} to="/">
                            Home
                        </MenuItem>
                        <MenuItem as={Link} to="/create">
                            Create
                        </MenuItem>
                        <MenuItem as={Link} to="/guides">
                            Gardening Guides
                        </MenuItem>
                        <MenuItem as={Link} to="/taxo/plants">
                            Plant Library
                        </MenuItem>
                        <MenuItem as={Link} to="/my-garden">
                            My Garden
                        </MenuItem>
                    </MenuList> */}
        </Menu>
        <AppSearch />
      </Flex>
      <Box px="50" py="25">
        <Button
          variant="ghost"
          // leftIcon={<LocationOutline color="inherit" />}
          size="sm"
        >
          <Text>11435</Text>
        </Button>
      </Box>
    </Box>
  );
}

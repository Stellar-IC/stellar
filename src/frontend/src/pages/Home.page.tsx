import {
  ActionIcon,
  Anchor,
  Container,
  Flex,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import { toText } from '@stellar-ic/lseq-ts/Tree';
import { IconPlus } from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';

import { PageWrapper } from '@/PageWrapper';
import { db } from '@/db';
import { useCreatePageWithRedirect } from '@/hooks/canisters/workspace/updates/useCreatePageWithRedirect';
import { LocalStorageBlock } from '@/types';

export function HomePage() {
  const theme = useMantineTheme();
  const createPageAndRedirect = useCreatePageWithRedirect();

  const pages = useLiveQuery<LocalStorageBlock[], LocalStorageBlock[]>(
    () => db.blocks.filter((block) => 'page' in block.blockType).toArray(),
    [],
    []
  );

  return (
    <PageWrapper>
      <Container>
        <div style={{ padding: theme.spacing.sm }}>
          <Flex align="center" justify="space-between">
            <h2>Pages</h2>
            <ActionIcon
              variant="subtle"
              onClick={createPageAndRedirect}
              aria-label="Create a new page"
            >
              <IconPlus />
            </ActionIcon>
          </Flex>
          <Stack>
            {pages.map((page) => (
              <Anchor
                key={page.uuid}
                component={Link}
                to={`/pages/${page.uuid}`}
              >
                {toText(page.properties.title) || 'Untitled'}
              </Anchor>
            ))}
          </Stack>
        </div>
      </Container>
    </PageWrapper>
  );
}

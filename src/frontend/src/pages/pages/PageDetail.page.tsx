import { Container, Stack } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { Blocks } from '@/components/blocks/Blocks';
import {
  Page,
  PageNavigation,
  PageSection,
} from '@/components/layout/page/Page';
import { useEffect } from 'react';
import { parse } from 'uuid';
import { usePagesContext } from '@/contexts/blocks/usePagesContext';

export function PageDetailPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const {
    pages: { data = {}, query: queryPage },
  } = usePagesContext();
  if (!pageId) throw new Error('Missing pageId');

  useEffect(() => {
    queryPage(parse(pageId));
  }, [queryPage, pageId]);

  const page = data[pageId];

  if (!page) return <Page />;

  return (
    <Page>
      <PageNavigation />
      <Container maw="container.sm">
        <PageSection>
          <Stack mt="100" gap="xs" px="10rem">
            <Blocks page={page} />
          </Stack>
        </PageSection>
      </Container>
    </Page>
  );
}

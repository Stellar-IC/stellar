import { Box, Button, Container } from '@mantine/core';

import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import { LandingPageFooter } from './components/LandingPageFooter';
import { LandingPageHeader } from './components/LandingPageHeader';

const sectionContainerWidth = '44rem';

export function LandingPage() {
  const { login } = useAuthContext();

  return (
    <Box style={{ width: '100%' }}>
      <LandingPageHeader login={login} />
      <section>
        <Container maw={sectionContainerWidth}>
          <h1>Stellar IC</h1>
          <p>
            Stellar IC is a collaborative document editor built on the Internet
            Computer. It provides a real-time collaborative editing experience
            with a focus on privacy and security.
          </p>
          <Button onClick={login}>Get started</Button>
        </Container>
      </section>
      <section>
        <Container maw={sectionContainerWidth}>
          <h2>Features</h2>
          <ul>
            <li>Real-time collaborative editing</li>
            <li>Privacy-first design</li>
            <li>Secure by default</li>
            <li>Open-source</li>
            <li>Personal Workspaces</li>
          </ul>
        </Container>
      </section>
      <section>
        <Container maw={sectionContainerWidth}>
          <h1>Roadmap</h1>
          <ol>
            <li>Mainnet Launch</li>
            <li>File Uploads</li>
            <li>Rich Text Editing</li>
            <li>Public Workspaces</li>
            <li>Ledger Integration</li>
            <li>SNS</li>
          </ol>
        </Container>
      </section>
      <LandingPageFooter />
    </Box>
  );
}

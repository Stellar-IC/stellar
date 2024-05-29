import { Box, Button, Container, Flex, Stack } from '@mantine/core';

import { useAuthContext } from '@/modules/auth/contexts/AuthContext';

import classes from './Landing.module.css';

const sectionContainerWidth = '26rem';

export function LandingPage() {
  const { login } = useAuthContext();

  return (
    <Box style={{ width: '100%', overflowY: 'scroll' }}>
      {/* <LandingPageHeader login={login} /> */}
      <Box
        className={classes.ScrollContainer}
        style={{ height: '100%', overflowY: 'scroll' }}
      >
        <section className={classes.Section}>
          <Container maw={sectionContainerWidth}>
            <Stack gap="xl">
              <Flex
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <h1
                  className={classes.LandingHeading}
                  style={{ fontSize: '3rem' }}
                >
                  Stellar
                </h1>
                <h4 className={classes.TagLine}>Space to shape our future.</h4>
              </Flex>
              <Flex style={{ justifyContent: 'center' }}>
                <Button onClick={login}>Sign In</Button>
              </Flex>
            </Stack>
          </Container>
        </section>

        <section className={classes.Section}>
          <Container maw={sectionContainerWidth}>
            <Flex
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <svg
                width="159"
                height="160"
                viewBox="0 0 159 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M157.5 80C157.5 123.363 122.569 158.5 79.5 158.5C36.4306 158.5 1.5 123.363 1.5 80C1.5 36.6368 36.4306 1.5 79.5 1.5C122.569 1.5 157.5 36.6368 157.5 80Z"
                  stroke="#999999"
                  strokeWidth="3"
                />
              </svg>
              <h1
                className={classes.LandingHeading}
                style={{ fontSize: '3rem' }}
              >
                Spaces
              </h1>
              <h4 className={classes.SubHeading}>
                Private spaces for the solo pioneer. Shared spaces for
                collaborators
              </h4>
            </Flex>
            <Flex
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <p className={classes.Paragraph}>
                Spaces are at the core of Stellar. These are isolated areas
                where you can create documents, manage projects, and collaborate
                with others in real-time. You maintain control of the data in
                your Space, which is stored securely and completely on-chain.
              </p>
              <div>
                <Button onClick={login}>Get started</Button>
              </div>
            </Flex>
          </Container>
        </section>

        <section className={classes.Section}>
          <Container maw={sectionContainerWidth}>
            <Flex
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <svg
                width="111"
                height="164"
                viewBox="0 0 111 164"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M109 2.5C82.8333 3.19869 24.8 4.17686 2 2.5V162.5H109V2.5Z"
                  stroke="#999999"
                  strokeWidth="3"
                />
              </svg>
              <h2
                className={classes.LandingHeading}
                style={{ fontSize: '3rem' }}
              >
                Pages
              </h2>
              <h4 className={classes.SubHeading}>
                Block-based collaborative doument editing
              </h4>
            </Flex>
            <Flex
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <p className={classes.Paragraph}>
                Pages are a great way to organize your thoughts, plans, goals,
                and much more. You can create private pages or share them with
                the world.
              </p>
              <div>
                <Button onClick={login}>Get started</Button>
              </div>
            </Flex>
          </Container>
        </section>

        <section className={classes.Section}>
          <Container
            maw={sectionContainerWidth}
            style={{ textAlign: 'center' }}
          >
            <h4 className={classes.SubHeading}>The Mission</h4>
            <p
              className={classes.Paragraph}
              style={{ paddingTop: 0, paddingBottom: 0 }}
            >
              There is a new frontier for decentralization and world-wide
              collaboration made possible by the Internet Computer Protocol. The
              rise of DAOs (Decentralized Autonomous Organizations), and other
              types of community-driven initiatives, will change the world in
              ways that are unimaginable, bringing increased levels of ownership
              and freedom to everyone.
            </p>
            <p
              className={classes.Paragraph}
              style={{ paddingTop: 0, paddingBottom: 0 }}
            >
              In order for community members to be effective participants and/or
              contributors, they should have access to the same information and
              resources as the core development teams. Think product and
              technical specifications, design files, project planning, and
              other resources that are typically siloed within the core team.
            </p>
            <p
              className={classes.Paragraph}
              style={{ paddingTop: 0, paddingBottom: 0 }}
            >
              Stellar’s mission is to build products that enable increased
              levels of collaboration and community-building across
              decentralized initiatives. We believe that the future of work is
              decentralized, and we’re building the tools to make that future a
              reality.
            </p>
            <div>
              <Button onClick={login}>Join Stellar</Button>
            </div>
          </Container>
        </section>
        {/* <LandingPageFooter /> */}
      </Box>
    </Box>
  );
}

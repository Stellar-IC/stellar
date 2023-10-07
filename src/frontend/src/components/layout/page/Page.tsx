import {
  Box,
  BoxProps,
  Flex,
  Text,
  // useStyleConfig,
} from '@mantine/core';
import { PropsWithChildren } from 'react';
// import { ChevronBack } from "react-ionicons";
import { useNavigate } from 'react-router-dom';

export function Page({ children }: PropsWithChildren) {
  return <Box w="100%">{children}</Box>;
}

export function PageSection({
  children,
  variant,
}: // textAlign,
PropsWithChildren<{
  variant?: 'outline';
  // textAlign?: BoxProps["textAlign"];
}>) {
  // const styles = useStyleConfig("PageSection", { variant });

  return (
    <Box
      w="100%"
      // __css={styles}
      // textAlign={textAlign}
    >
      {children}
    </Box>
  );
}

export function PageSectionBody({ children }: PropsWithChildren) {
  return <Box py="50">{children}</Box>;
}

export function PageSectionHeader({
  headingText,
  subHeadingText,
}: {
  headingText?: string;
  subHeadingText?: string;
}) {
  return (
    <Flex
      py="50"
      // flexDirection="column"
      gap="25"
    >
      {/* {!!headingText && <Heading size="md">{headingText}</Heading>} */}
      {!!subHeadingText && <Text>{subHeadingText}</Text>}
    </Flex>
  );
}

export function PageSectionFooter({ children }: PropsWithChildren) {
  return <Box py="50">{children}</Box>;
}

export function PageNavigation() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* <IconButton
                aria-label="Previous page"
                icon={<ChevronBack></ChevronBack>}
                onClick={() => {
                    navigate(-1);
                }}
            /> */}
    </Box>
  );
}

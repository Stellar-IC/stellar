import { Principal } from '@dfinity/principal';
import { Button, Text, Tooltip } from '@mantine/core';
import { useState } from 'react';

interface PrincipalBadgeProps {
  principal: Principal;
}

export function PrincipalBadge({ principal }: PrincipalBadgeProps) {
  const [isCopied, setIsCopied] = useState(false);
  const tooltipLabel = isCopied ? 'Copied!' : 'Click to copy';
  const value = principal.toString();

  return (
    <Tooltip label={tooltipLabel} withArrow position="top">
      <Button
        size="sm"
        variant="subtle"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        }}
      >
        <Text size="xs">{value}</Text>
      </Button>
    </Tooltip>
  );
}

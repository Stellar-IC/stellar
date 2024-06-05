import { Image } from '@mantine/core';
import { useRef } from 'react';

import { network } from '@/config';

interface UserProfileFormProps {
  src?: string;
  fallbackSrc?: string;
}

export const IcImage = ({ src, fallbackSrc }: UserProfileFormProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  let finalSrc = src;

  // Convert the avatar URL to a local URL if the network is local
  if (src && network === 'local') {
    const matchResult = src.match(/^https:\/\/([a-z0-9-]+)\.icp0\.io(.+)$/);
    const canisterId = matchResult ? matchResult[1] : null;
    const rest = matchResult ? matchResult[2] : null;
    finalSrc = `http://localhost:4943${rest}?canisterId=${canisterId}`;
  }

  return (
    <Image
      ref={imageRef}
      h={120}
      w={120}
      fit="cover"
      radius="100%"
      src={finalSrc || fallbackSrc}
    />
  );
};

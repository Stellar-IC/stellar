import { AnonymousIdentity } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { logger as baseLogger } from '@/modules/logger';
import { useCallback, useState } from 'react';
import { getAuthClient } from '../client';

import { getUserProfile, registerUser } from './utils';

const logger = baseLogger.getLogger('auth');
logger.setDefaultLevel(baseLogger.levels.INFO);

export const useHydrate = () => {
  const [isLoading, setIsLoading] = useState(false);

  const hydrate = useCallback(async () => {
    logger.info('Refreshing auth state');

    setIsLoading(true);

    return getAuthClient()
      .then((authClient) => authClient.getIdentity())
      .then(async (identity) => {
        if (!identity) {
          logger.info('Identity not found. Done hydrating.');
          return;
        }

        if (identity instanceof DelegationIdentity) {
          logger.info('Delegation Identity found');
          const userId = await registerUser(identity);
          const result = await getUserProfile({ userId, identity });

          if ('ok' in result) {
            return {
              userId,
              identity,
              profile: result.ok,
            };
          }

          logger.error('Failed to hydrate auth state');
          return;
        }

        if (identity instanceof AnonymousIdentity) {
          logger.info('Anonymous identity found. Done hydrating.');
          return;
        }

        logger.info('Unknown identity type. Done hydrating.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { hydrate, isLoading };
};

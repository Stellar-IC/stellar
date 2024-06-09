import { createAgentManager } from '@ic-reactor/core';

import { network } from '@/config';

export const agentManager = createAgentManager({
  withLocalEnv: network === 'local',
});

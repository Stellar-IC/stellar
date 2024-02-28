import { ActorSubclass } from '@dfinity/agent';
import { createContext } from 'react';

import { CanisterId } from '@/types';

import { _SERVICE } from '../../../../declarations/workspace/workspace.did';

export const WorkspaceContext = createContext<{
  actor: ActorSubclass<_SERVICE>;
  workspaceId: CanisterId;
} | null>(null);

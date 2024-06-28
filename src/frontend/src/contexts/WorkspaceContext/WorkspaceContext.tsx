import { ActorSubclass } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createContext } from 'react';

import { _SERVICE } from '../../../../declarations/workspace/workspace.did';

export const WorkspaceContext = createContext<{
  actor: ActorSubclass<_SERVICE> | null;
  workspaceId: Principal;
} | null>(null);

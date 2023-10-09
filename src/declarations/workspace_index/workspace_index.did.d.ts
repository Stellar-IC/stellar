import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result =
  | { ok: Principal }
  | {
      err:
        | { anonymousWorkspaceIndex: null }
        | { anonymousCaller: null }
        | { insufficientCycles: null }
        | { unauthorizedCaller: null }
        | { anonymousOwner: null };
    };
export type Time = bigint;
export type UUID = Uint8Array | number[];
export interface Workspace {
  id: WorkspaceId;
  owner: WorkspaceOwner;
  name: WorkspaceName;
  createdAt: Time;
  uuid: UUID;
  description: WorkspaceDescription;
  updatedAt: Time;
}
export type WorkspaceDescription = string;
export type WorkspaceId = Principal;
export type WorkspaceName = string;
export type WorkspaceOwner = Principal;
export interface _SERVICE {
  createWorkspace: ActorMethod<[{ owner: Principal }], Result>;
  upgradeWorkspaceCanister: ActorMethod<[Principal], undefined>;
  walletBalance: ActorMethod<[], bigint>;
  workspaceByUuid: ActorMethod<[UUID], [] | [Workspace]>;
}

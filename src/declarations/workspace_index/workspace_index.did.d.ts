import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Edge { 'node' : Workspace }
export interface PaginatedResults { 'edges' : Array<Edge> }
export type Result = { 'ok' : Principal } |
  {
    'err' : { 'anonymousUser' : null } |
      { 'anonymousCaller' : null } |
      { 'insufficientCycles' : null } |
      { 'unauthorizedCaller' : null }
  };
export type Time = bigint;
export type UUID = Uint8Array | number[];
export interface Workspace {
  'owner' : WorkspaceOwner,
  'name' : WorkspaceName,
  'createdAt' : Time,
  'uuid' : UUID,
  'description' : WorkspaceDescription,
  'updatedAt' : Time,
}
export type WorkspaceDescription = string;
export type WorkspaceName = string;
export type WorkspaceOwner = Principal;
export interface _SERVICE {
  'createWorkspace' : ActorMethod<[{ 'owner' : Principal }], Result>,
  'cyclesInformation' : ActorMethod<
    [],
    { 'balance' : bigint, 'capacity' : bigint }
  >,
  'requestCycles' : ActorMethod<[bigint], { 'accepted' : bigint }>,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
  'workspaceByUuid' : ActorMethod<[UUID], Workspace>,
  'workspaces' : ActorMethod<[{}], PaginatedResults>,
}

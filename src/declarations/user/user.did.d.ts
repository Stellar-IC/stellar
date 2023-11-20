import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface ProfileInput { 'username' : Username }
export type Result = { 'ok' : WorkspaceId } |
  { 'err' : { 'anonymousUser' : null } | { 'insufficientCycles' : null } };
export type Time = bigint;
export interface User {
  'personalWorkspace' : ActorMethod<[], Result>,
  'profile' : ActorMethod<[], UserProfile>,
  'updateProfile' : ActorMethod<[ProfileInput], UserProfile>,
  'upgradePersonalWorkspace' : ActorMethod<[], undefined>,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
}
export interface UserInitArgs { 'owner' : Principal, 'capacity' : bigint }
export interface UserProfile {
  'username' : Username__1,
  'created_at' : Time,
  'updatedAt' : Time,
}
export type Username = string;
export type Username__1 = string;
export type WorkspaceId = Principal;
export interface _SERVICE extends User {}

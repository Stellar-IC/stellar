import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface ProfileInput {
  username: Username;
}
export type Result = { ok: UserProfile } | { err: { notAuthorized: null } };
export type Time = bigint;
export interface User {
  getPersonalWorkspace: ActorMethod<[], [] | [WorkspaceId]>;
  profile: ActorMethod<[], Result>;
  setPersonalWorkspace: ActorMethod<[WorkspaceId], undefined>;
  updateProfile: ActorMethod<[ProfileInput], Result>;
  wallet_balance: ActorMethod<[], bigint>;
  wallet_receive: ActorMethod<[], { accepted: bigint }>;
}
export interface UserProfile {
  updated_at: Time;
  username: [] | [Username];
  created_at: Time;
}
export type Username = string;
export type WorkspaceId = Principal;
export interface _SERVICE extends User {}

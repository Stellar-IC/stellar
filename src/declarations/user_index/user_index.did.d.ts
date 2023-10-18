import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type RegisterUserError = { 'userNotFound' : null } |
  { 'anonymousUser' : null } |
  { 'failedToCreateWorkspace' : null } |
  { 'insufficientCycles' : null } |
  { 'missingUserCanister' : null };
export type RegisterUserResult = { 'ok' : Principal } |
  { 'err' : RegisterUserError };
export interface _SERVICE {
  'registerUser' : ActorMethod<[], RegisterUserResult>,
  'upgradeUserCanisters' : ActorMethod<[], undefined>,
  'walletBalance' : ActorMethod<[], bigint>,
}

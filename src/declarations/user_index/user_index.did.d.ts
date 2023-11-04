import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type RegisterUserError = { 'userNotFound' : null } |
  { 'anonymousUser' : null } |
  { 'insufficientCycles' : null } |
  { 'missingUserCanister' : null };
export type RegisterUserResult = { 'ok' : Principal } |
  { 'err' : RegisterUserError };
export interface _SERVICE {
  'cyclesInformation' : ActorMethod<
    [],
    { 'balance' : bigint, 'capacity' : bigint }
  >,
  'registerUser' : ActorMethod<[], RegisterUserResult>,
  'requestCycles' : ActorMethod<[bigint], { 'accepted' : bigint }>,
  'upgradeUserCanisters' : ActorMethod<[], undefined>,
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
}

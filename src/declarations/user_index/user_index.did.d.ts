import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type RegisterUserError =
  | { userNotFound: null }
  | { anonymousUser: null }
  | { insufficientCycles: null };
export type RegisterUserResult = { ok: Principal } | { err: RegisterUserError };
export type Result = { ok: Array<Principal> } | { err: null };
export interface _SERVICE {
  registerUser: ActorMethod<[], RegisterUserResult>;
  users: ActorMethod<[], Result>;
  walletBalance: ActorMethod<[], bigint>;
}

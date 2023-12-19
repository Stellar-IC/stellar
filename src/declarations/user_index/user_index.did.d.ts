import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface CanisterSettings {
  freezing_threshold: [] | [bigint];
  controllers: [] | [Array<Principal>];
  memory_allocation: [] | [bigint];
  compute_allocation: [] | [bigint];
}
export type RegisterUserError =
  | { userNotFound: null }
  | { anonymousUser: null }
  | { insufficientCycles: null }
  | { missingUserCanister: null };
export type RegisterUserResult = { ok: Principal } | { err: RegisterUserError };
export interface _SERVICE {
  cyclesInformation: ActorMethod<[], { balance: bigint; capacity: bigint }>;
  registerUser: ActorMethod<[], RegisterUserResult>;
  requestCycles: ActorMethod<[bigint], { accepted: bigint }>;
  updateUserCanisterSettings: ActorMethod<
    [Principal, CanisterSettings],
    undefined
  >;
  upgradeUserCanisters: ActorMethod<[], undefined>;
  upgradeUserCanistersWasm: ActorMethod<[Uint8Array | number[]], undefined>;
  upgradeUserPersonalWorkspaceCanistersWasm: ActorMethod<
    [Uint8Array | number[]],
    undefined
  >;
  walletReceive: ActorMethod<[], { accepted: bigint }>;
}

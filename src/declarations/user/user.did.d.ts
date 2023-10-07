import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type DeliveryAgentAccount = {};
export interface ProfileInput {
  username: Username;
}
export type Result = { ok: UserProfile } | { err: { notAuthorized: null } };
export type Result_1 =
  | { ok: DeliveryAgentAccount }
  | {
      err: { notAuthorized: null } | { alreadyExists: null } | { unknownError: null };
    };
export type Time = bigint;
export interface User {
  createDeliveryAgentAccount: ActorMethod<[ProfileInput], Result_1>;
  profile: ActorMethod<[], Result>;
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
export interface _SERVICE extends User {}

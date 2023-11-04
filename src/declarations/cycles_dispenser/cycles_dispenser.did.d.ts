import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface RegisterableCanister {
  'walletReceive' : ActorMethod<[], { 'accepted' : bigint }>,
}
export interface _SERVICE {
  'register' : ActorMethod<[Principal], undefined>,
  'registerSelf' : ActorMethod<[], undefined>,
  'requestCycles' : ActorMethod<[bigint], { 'accepted' : bigint }>,
}

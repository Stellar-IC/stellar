import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type RequestCyclesUpdateError = { 'topUpAlreadyInProgress' : null } |
  { 'insufficientFunds' : null } |
  { 'unauthorized' : null } |
  { 'throttled' : null } |
  { 'amountTooHigh' : null };
export interface RequestCyclesUpdateOk { 'accepted' : bigint }
export type RequestCyclesUpdateOutput = { 'ok' : RequestCyclesUpdateOk } |
  { 'err' : RequestCyclesUpdateError };
export interface _SERVICE {
  'requestCycles' : ActorMethod<[bigint], RequestCyclesUpdateOutput>,
}

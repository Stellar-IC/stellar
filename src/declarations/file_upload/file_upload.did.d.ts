import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileUpload {
  'createAssetCanister' : ActorMethod<[], Result_2>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'store' : ActorMethod<
    [
      {
        'key' : Key,
        'content' : Uint8Array | number[],
        'content_type' : string,
      },
    ],
    Result_1
  >,
  'upgradeAssets' : ActorMethod<[Uint8Array | number[]], Result>,
}
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'streaming_strategy' : [] | [StreamingStrategy],
  'status_code' : number,
}
export type Key = string;
export type Result = { 'ok' : null } |
  { 'err' : { 'unauthorized' : null } };
export type Result_1 = { 'ok' : { 'url' : string } } |
  { 'err' : string };
export type Result_2 = { 'ok' : Principal } |
  { 'err' : { 'unauthorized' : null } };
export interface StreamingCallbackHttpResponse {
  'token' : [] | [StreamingCallbackToken],
  'body' : Uint8Array | number[],
}
export interface StreamingCallbackToken {
  'key' : string,
  'sha256' : [] | [Uint8Array | number[]],
  'index' : bigint,
  'content_encoding' : string,
}
export type StreamingStrategy = {
    'Callback' : {
      'token' : StreamingCallbackToken,
      'callback' : [Principal, string],
    }
  };
export interface _SERVICE extends FileUpload {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];

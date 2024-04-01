export const idlFactory = ({ IDL }) => {
  const ClientPrincipal = IDL.Principal;
  const ClientKey = IDL.Record({
    'client_principal' : ClientPrincipal,
    'client_nonce' : IDL.Nat64,
  });
  const CanisterWsCloseArguments = IDL.Record({ 'client_key' : ClientKey });
  const CanisterWsCloseResult = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : IDL.Text,
  });
  const CanisterWsGetMessagesArguments = IDL.Record({ 'nonce' : IDL.Nat64 });
  const CanisterOutputMessage = IDL.Record({
    'key' : IDL.Text,
    'content' : IDL.Vec(IDL.Nat8),
    'client_key' : ClientKey,
  });
  const CanisterOutputCertifiedMessages = IDL.Record({
    'messages' : IDL.Vec(CanisterOutputMessage),
    'cert' : IDL.Vec(IDL.Nat8),
    'tree' : IDL.Vec(IDL.Nat8),
    'is_end_of_queue' : IDL.Bool,
  });
  const CanisterWsGetMessagesResult = IDL.Variant({
    'Ok' : CanisterOutputCertifiedMessages,
    'Err' : IDL.Text,
  });
  const WebsocketMessage = IDL.Record({
    'sequence_num' : IDL.Nat64,
    'content' : IDL.Vec(IDL.Nat8),
    'client_key' : ClientKey,
    'timestamp' : IDL.Nat64,
    'is_service_message' : IDL.Bool,
  });
  const CanisterWsMessageArguments = IDL.Record({ 'msg' : WebsocketMessage });
  const AppMessage = IDL.Record({ 'message' : IDL.Text });
  const CanisterWsMessageResult = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : IDL.Text,
  });
  const GatewayPrincipal = IDL.Principal;
  const CanisterWsOpenArguments = IDL.Record({
    'gateway_principal' : GatewayPrincipal,
    'client_nonce' : IDL.Nat64,
  });
  const CanisterWsOpenResult = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'ws_close' : IDL.Func(
        [CanisterWsCloseArguments],
        [CanisterWsCloseResult],
        [],
      ),
    'ws_get_messages' : IDL.Func(
        [CanisterWsGetMessagesArguments],
        [CanisterWsGetMessagesResult],
        ['query'],
      ),
    'ws_message' : IDL.Func(
        [CanisterWsMessageArguments, IDL.Opt(AppMessage)],
        [CanisterWsMessageResult],
        [],
      ),
    'ws_open' : IDL.Func([CanisterWsOpenArguments], [CanisterWsOpenResult], []),
  });
};
export const init = ({ IDL }) => { return []; };

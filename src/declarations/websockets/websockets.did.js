export const idlFactory = ({ IDL }) => {
  const UUID = IDL.Vec(IDL.Nat8);
  const BlockType = IDL.Variant({
    'numberedList' : IDL.Null,
    'todoList' : IDL.Null,
    'toggleHeading1' : IDL.Null,
    'toggleHeading2' : IDL.Null,
    'toggleHeading3' : IDL.Null,
    'code' : IDL.Null,
    'heading1' : IDL.Null,
    'heading2' : IDL.Null,
    'heading3' : IDL.Null,
    'page' : IDL.Null,
    'callout' : IDL.Null,
    'quote' : IDL.Null,
    'bulletedList' : IDL.Null,
    'paragraph' : IDL.Null,
  });
  const BlockCreatedEventData = IDL.Record({
    'block' : IDL.Record({
      'uuid' : UUID,
      'blockType' : BlockType,
      'parent' : IDL.Opt(UUID),
    }),
    'index' : IDL.Nat,
  });
  const BlockPropertyCheckedUpdatedEventData = IDL.Record({
    'checked' : IDL.Bool,
    'blockExternalId' : UUID,
  });
  const BlockBlockTypeUpdatedEventData = IDL.Record({
    'blockType' : BlockType,
    'blockExternalId' : UUID,
  });
  const NodeIndex = IDL.Nat16;
  const NodeIdentifier = IDL.Vec(NodeIndex);
  const NodeValue = IDL.Text;
  const TreeEvent = IDL.Variant({
    'delete' : IDL.Record({
      'transactionType' : IDL.Variant({ 'delete' : IDL.Null }),
      'position' : NodeIdentifier,
    }),
    'insert' : IDL.Record({
      'transactionType' : IDL.Variant({ 'insert' : IDL.Null }),
      'value' : NodeValue,
      'position' : NodeIdentifier,
    }),
  });
  const BlockContentUpdatedEventData = IDL.Record({
    'transaction' : IDL.Vec(TreeEvent),
    'blockExternalId' : UUID,
  });
  const BlockParentUpdatedEventData = IDL.Record({
    'parentBlockExternalId' : UUID,
    'blockExternalId' : UUID,
  });
  const BlockPropertyTitleUpdatedEventData = IDL.Record({
    'transaction' : IDL.Vec(TreeEvent),
    'blockExternalId' : UUID,
  });
  const BlockUpdatedEventData = IDL.Variant({
    'updatePropertyChecked' : BlockPropertyCheckedUpdatedEventData,
    'updateBlockType' : BlockBlockTypeUpdatedEventData,
    'updateContent' : BlockContentUpdatedEventData,
    'updateParent' : BlockParentUpdatedEventData,
    'updatePropertyTitle' : BlockPropertyTitleUpdatedEventData,
  });
  const Time = IDL.Int;
  const BlockEvent = IDL.Record({
    'data' : IDL.Variant({
      'blockCreated' : BlockCreatedEventData,
      'blockUpdated' : BlockUpdatedEventData,
    }),
    'user' : IDL.Principal,
    'uuid' : UUID,
    'timestamp' : Time,
  });
  const AppMessage = IDL.Variant({
    'ping' : IDL.Record({ 'message' : IDL.Text }),
    'blockEvent' : BlockEvent,
    'associateUser' : IDL.Record({ 'userId' : IDL.Principal }),
  });
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
    'sendMessage' : IDL.Func([IDL.Principal, AppMessage], [], []),
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

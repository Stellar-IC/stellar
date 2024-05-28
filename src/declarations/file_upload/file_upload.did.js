export const idlFactory = ({ IDL }) => {
  const Result_2 = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const StreamingCallbackToken = IDL.Record({
    'key' : IDL.Text,
    'sha256' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'index' : IDL.Nat,
    'content_encoding' : IDL.Text,
  });
  const StreamingCallbackHttpResponse = IDL.Record({
    'token' : IDL.Opt(StreamingCallbackToken),
    'body' : IDL.Vec(IDL.Nat8),
  });
  const StreamingStrategy = IDL.Variant({
    'Callback' : IDL.Record({
      'token' : StreamingCallbackToken,
      'callback' : IDL.Func(
          [StreamingCallbackToken],
          [StreamingCallbackHttpResponse],
          ['query'],
        ),
    }),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'streaming_strategy' : IDL.Opt(StreamingStrategy),
    'status_code' : IDL.Nat16,
  });
  const Key = IDL.Text;
  const Result_1 = IDL.Variant({
    'ok' : IDL.Record({ 'url' : IDL.Text }),
    'err' : IDL.Text,
  });
  const Result = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Variant({ 'unauthorized' : IDL.Null }),
  });
  const FileUpload = IDL.Service({
    'createAssetCanister' : IDL.Func([], [Result_2], []),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], []),
    'store' : IDL.Func(
        [
          IDL.Record({
            'key' : Key,
            'content' : IDL.Vec(IDL.Nat8),
            'content_type' : IDL.Text,
          }),
        ],
        [Result_1],
        [],
      ),
    'upgradeAssets' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result], []),
  });
  return FileUpload;
};
export const init = ({ IDL }) => { return []; };

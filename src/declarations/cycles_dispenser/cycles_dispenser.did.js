export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'requestCycles' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };

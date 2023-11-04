export const idlFactory = ({ IDL }) => {
  const RegisterableCanister = IDL.Service({
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
  return IDL.Service({
    'register' : IDL.Func([RegisterableCanister], [], ['oneway']),
    'registerSelf' : IDL.Func([], [], ['oneway']),
    'requestCycles' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };

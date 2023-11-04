export const idlFactory = ({ IDL }) => {
  const RegisterUserError = IDL.Variant({
    'userNotFound' : IDL.Null,
    'anonymousUser' : IDL.Null,
    'insufficientCycles' : IDL.Null,
    'missingUserCanister' : IDL.Null,
  });
  const RegisterUserResult = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : RegisterUserError,
  });
  return IDL.Service({
    'cyclesInformation' : IDL.Func(
        [],
        [IDL.Record({ 'balance' : IDL.Nat, 'capacity' : IDL.Nat })],
        [],
      ),
    'registerUser' : IDL.Func([], [RegisterUserResult], []),
    'requestCycles' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'upgradeUserCanisters' : IDL.Func([], [], ['oneway']),
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };

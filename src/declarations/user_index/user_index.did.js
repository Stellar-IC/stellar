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
  const CanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Opt(IDL.Nat),
    'controllers' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'memory_allocation' : IDL.Opt(IDL.Nat),
    'compute_allocation' : IDL.Opt(IDL.Nat),
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
    'updateUserCanisterSettings' : IDL.Func(
        [IDL.Principal, CanisterSettings],
        [],
        [],
      ),
    'upgradeUserCanisters' : IDL.Func([], [], ['oneway']),
    'upgradeUserCanistersWasm' : IDL.Func([IDL.Vec(IDL.Nat8)], [], ['oneway']),
    'upgradeUserPersonalWorkspaceCanistersWasm' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [],
        [],
      ),
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };

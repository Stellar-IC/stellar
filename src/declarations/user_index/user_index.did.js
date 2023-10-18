export const idlFactory = ({ IDL }) => {
  const RegisterUserError = IDL.Variant({
    'userNotFound' : IDL.Null,
    'anonymousUser' : IDL.Null,
    'failedToCreateWorkspace' : IDL.Null,
    'insufficientCycles' : IDL.Null,
    'missingUserCanister' : IDL.Null,
  });
  const RegisterUserResult = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : RegisterUserError,
  });
  return IDL.Service({
    'registerUser' : IDL.Func([], [RegisterUserResult], []),
    'upgradeUserCanisters' : IDL.Func([], [], ['oneway']),
    'walletBalance' : IDL.Func([], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };

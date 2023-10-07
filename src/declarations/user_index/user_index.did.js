export const idlFactory = ({ IDL }) => {
  const RegisterUserError = IDL.Variant({
    userNotFound: IDL.Null,
    anonymousUser: IDL.Null,
    insufficientCycles: IDL.Null,
  });
  const RegisterUserResult = IDL.Variant({
    ok: IDL.Principal,
    err: RegisterUserError,
  });
  const Result = IDL.Variant({
    ok: IDL.Vec(IDL.Principal),
    err: IDL.Null,
  });
  return IDL.Service({
    registerUser: IDL.Func([], [RegisterUserResult], []),
    users: IDL.Func([], [Result], ['query']),
    walletBalance: IDL.Func([], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => {
  return [];
};

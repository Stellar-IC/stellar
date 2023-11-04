export const idlFactory = ({ IDL }) => {
  const WorkspaceId = IDL.Principal;
  const Result = IDL.Variant({
    ok: WorkspaceId,
    err: IDL.Variant({
      anonymousUser: IDL.Null,
      insufficientCycles: IDL.Null,
    }),
  });
  const Time = IDL.Int;
  const Username__1 = IDL.Text;
  const UserProfile = IDL.Record({
    updatedAt: Time,
    username: Username__1,
    created_at: Time,
  });
  const Username = IDL.Text;
  const ProfileInput = IDL.Record({ username: Username });
  const User = IDL.Service({
    personalWorkspace: IDL.Func([], [Result], []),
    profile: IDL.Func([], [UserProfile], ['query']),
    updateProfile: IDL.Func([ProfileInput], [UserProfile], []),
    walletReceive: IDL.Func([], [IDL.Record({ accepted: IDL.Nat64 })], []),
  });
  return User;
};
export const init = ({ IDL }) => {
  return [IDL.Record({ owner: IDL.Principal, capacity: IDL.Nat })];
};

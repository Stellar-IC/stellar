export const idlFactory = ({ IDL }) => {
  const WorkspaceId = IDL.Principal;
  const Time = IDL.Int;
  const Username = IDL.Text;
  const UserProfile = IDL.Record({
    updated_at: Time,
    username: IDL.Opt(Username),
    created_at: Time,
  });
  const Result = IDL.Variant({
    ok: UserProfile,
    err: IDL.Variant({ notAuthorized: IDL.Null }),
  });
  const ProfileInput = IDL.Record({ username: Username });
  const User = IDL.Service({
    getPersonalWorkspace: IDL.Func([], [IDL.Opt(WorkspaceId)], ['query']),
    profile: IDL.Func([], [Result], ['query']),
    setPersonalWorkspace: IDL.Func([WorkspaceId], [], ['oneway']),
    updateProfile: IDL.Func([ProfileInput], [Result], []),
    wallet_balance: IDL.Func([], [IDL.Nat], []),
    wallet_receive: IDL.Func([], [IDL.Record({ accepted: IDL.Nat64 })], []),
  });
  return User;
};
export const init = ({ IDL }) => {
  return [IDL.Record({ principal: IDL.Principal, capacity: IDL.Nat })];
};

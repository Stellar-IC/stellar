export const idlFactory = ({ IDL }) => {
  const UserInitArgs = IDL.Record({
    'owner' : IDL.Principal,
    'capacity' : IDL.Nat,
  });
  const WorkspaceId = IDL.Principal;
  const Result = IDL.Variant({
    'ok' : WorkspaceId,
    'err' : IDL.Variant({
      'anonymousUser' : IDL.Null,
      'insufficientCycles' : IDL.Null,
    }),
  });
  const Username__1 = IDL.Text;
  const Time = IDL.Int;
  const UserProfile = IDL.Record({
    'username' : Username__1,
    'created_at' : Time,
    'updatedAt' : Time,
  });
  const CanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Opt(IDL.Nat),
    'controllers' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'memory_allocation' : IDL.Opt(IDL.Nat),
    'compute_allocation' : IDL.Opt(IDL.Nat),
  });
  const Username = IDL.Text;
  const ProfileInput = IDL.Record({ 'username' : Username });
  const User = IDL.Service({
    'personalWorkspace' : IDL.Func([], [Result], []),
    'profile' : IDL.Func([], [UserProfile], ['query']),
    'updatePersonalWorkspaceCanisterSettings' : IDL.Func(
        [CanisterSettings],
        [],
        [],
      ),
    'updateProfile' : IDL.Func([ProfileInput], [UserProfile], []),
    'upgradePersonalWorkspace' : IDL.Func([], [], ['oneway']),
    'upgradePersonalWorkspaceCanisterWasm' : IDL.Func(
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
  return User;
};
export const init = ({ IDL }) => {
  const UserInitArgs = IDL.Record({
    'owner' : IDL.Principal,
    'capacity' : IDL.Nat,
  });
  return [UserInitArgs];
};

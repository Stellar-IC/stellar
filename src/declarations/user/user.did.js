export const idlFactory = ({ IDL }) => {
  const Username = IDL.Text;
  const ProfileInput = IDL.Record({ username: Username });
  const DeliveryAgentAccount = IDL.Record({});
  const Result_1 = IDL.Variant({
    ok: DeliveryAgentAccount,
    err: IDL.Variant({
      notAuthorized: IDL.Null,
      alreadyExists: IDL.Null,
      unknownError: IDL.Null,
    }),
  });
  const Time = IDL.Int;
  const UserProfile = IDL.Record({
    updated_at: Time,
    username: IDL.Opt(Username),
    created_at: Time,
  });
  const Result = IDL.Variant({
    ok: UserProfile,
    err: IDL.Variant({ notAuthorized: IDL.Null }),
  });
  const User = IDL.Service({
    createDeliveryAgentAccount: IDL.Func([ProfileInput], [Result_1], []),
    profile: IDL.Func([], [Result], ['query']),
    updateProfile: IDL.Func([ProfileInput], [Result], []),
    wallet_balance: IDL.Func([], [IDL.Nat], []),
    wallet_receive: IDL.Func([], [IDL.Record({ accepted: IDL.Nat64 })], []),
  });
  return User;
};
export const init = ({ IDL }) => {
  return [IDL.Record({ principal: IDL.Principal, capacity: IDL.Nat })];
};

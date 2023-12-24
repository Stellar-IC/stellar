export const idlFactory = ({ IDL }) => {
  const RequestCyclesUpdateOk = IDL.Record({ 'accepted' : IDL.Nat64 });
  const RequestCyclesUpdateError = IDL.Variant({
    'topUpAlreadyInProgress' : IDL.Null,
    'insufficientFunds' : IDL.Null,
    'unauthorized' : IDL.Null,
    'throttled' : IDL.Null,
    'amountTooHigh' : IDL.Null,
  });
  const RequestCyclesUpdateOutput = IDL.Variant({
    'ok' : RequestCyclesUpdateOk,
    'err' : RequestCyclesUpdateError,
  });
  return IDL.Service({
    'requestCycles' : IDL.Func([IDL.Nat], [RequestCyclesUpdateOutput], []),
  });
};
export const init = ({ IDL }) => { return []; };

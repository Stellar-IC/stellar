export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({
    'ok' : IDL.Principal,
    'err' : IDL.Variant({
      'anonymousUser' : IDL.Null,
      'anonymousCaller' : IDL.Null,
      'insufficientCycles' : IDL.Null,
      'unauthorizedCaller' : IDL.Null,
    }),
  });
  const UUID = IDL.Vec(IDL.Nat8);
  const WorkspaceOwner = IDL.Principal;
  const WorkspaceName = IDL.Text;
  const Time = IDL.Int;
  const WorkspaceDescription = IDL.Text;
  const Workspace = IDL.Record({
    'owner' : WorkspaceOwner,
    'name' : WorkspaceName,
    'createdAt' : Time,
    'uuid' : UUID,
    'description' : WorkspaceDescription,
    'updatedAt' : Time,
  });
  const Edge = IDL.Record({ 'node' : Workspace });
  const PaginatedResults = IDL.Record({ 'edges' : IDL.Vec(Edge) });
  return IDL.Service({
    'createWorkspace' : IDL.Func(
        [IDL.Record({ 'owner' : IDL.Principal })],
        [Result],
        [],
      ),
    'cyclesInformation' : IDL.Func(
        [],
        [IDL.Record({ 'balance' : IDL.Nat, 'capacity' : IDL.Nat })],
        [],
      ),
    'requestCycles' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'walletReceive' : IDL.Func(
        [],
        [IDL.Record({ 'accepted' : IDL.Nat64 })],
        [],
      ),
    'workspaceByUuid' : IDL.Func([UUID], [Workspace], []),
    'workspaces' : IDL.Func([IDL.Record({})], [PaginatedResults], []),
  });
};
export const init = ({ IDL }) => { return []; };

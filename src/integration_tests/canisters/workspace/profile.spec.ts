// import { ActorSubclass } from '@dfinity/agent';
// import type { Principal } from '@dfinity/principal';
import { describe, beforeAll } from 'vitest';

// import { createActor as createActorUser } from '../../../declarations/user/index';
// import {
//   canisterId as userIndexCanisterId,
//   createActor as createActorUserIndex,
// } from '../../../declarations/user_index/index';
// import { _SERVICE as _SERVICE_USER_INDEX } from '../../../declarations/user_index/user_index.did';

// import { identity } from '../../indentity';
// import { assertResultOk } from '../../helpers';

// service {
//   addBlock: (AddBlockUpdateInput) -> (AddBlockUpdateOutput);
//   blockByUuid: (UUID) -> (Result_1) query;
//   createPage: (CreatePageUpdateInput) -> (CreatePageUpdateOutput);
//   getInitArgs: () -> (record {
//                         capacity: nat;
//                         owner: principal;
//                       });
//   getInitData: () ->
//    (record {
//       createdAt: Time;
//       description: WorkspaceDescription;
//       name: WorkspaceName;
//       updatedAt: Time;
//       uuid: UUID;
//     });
//   pageByUuid: (UUID) -> (Result) query;
//   pages:
//    (record {
//       cursor: opt PrimaryKey__1;
//       limit: opt nat;
//       order: opt SortOrder;
//     }) -> (PaginatedResults) query;
//   removeBlock: (RemoveBlockUpdateInput) -> (RemoveBlockUpdateOutput);
//   saveEvents: (SaveEventTransactionUpdateInput) ->
//    (SaveEventTransactionUpdateOutput);
//   toObject: () -> (Workspace__1) query;
//   updateBlock: (UpdateBlockUpdateInput) -> (UpdateBlockUpdateOutput);
// };

describe('profile', () => {
  // let userIndex: ActorSubclass<_SERVICE_USER_INDEX>;
  // let userId: Principal;
  // let workspaceId: Principal;

  beforeAll(async () => {
    // console.log({ userIndexCanisterId, workspaceIndexCanisterId });
    // userIndex = createActorUserIndex(userIndexCanisterId, {
    //   agentOptions: {
    //     host: 'http://localhost:5173',
    //     identity,
    //   },
    // });
    // const createUserResult = assertResultOk(await userIndex.registerUser());
    // userId = createUserResult.ok;
    // const user = createActorUser(userId, {
    //   agentOptions: {
    //     host: 'http://localhost:5173',
    //     identity,
    //   },
    // });
    // const personalWorkspaceResult = assertResultOk(
    //   await user.personalWorkspace()
    // );
    // workspaceId = personalWorkspaceResult.ok;
  });

  // describe('toObject', () => {
  //   test('should fail for anonymous user', async () => {
  //     const workspace = createActorWorkspace(workspaceId, {
  //       agentOptions: {
  //         host: 'http://localhost:5173',
  //       },
  //     });

  //     await expect(async () => {
  //       await workspace.toObject();
  //     }).rejects.toThrowError(/Anonymous access not allowed/);
  //   });

  //   test.todo('should fail for unauthorized user');

  //   test('should return the workspace', async () => {
  //     const workspace = createActorWorkspace(workspaceId, {
  //       agentOptions: {
  //         host: 'http://localhost:5173',
  //         identity,
  //       },
  //     });
  //     // 'owner' : WorkspaceOwner,
  //     // 'name' : WorkspaceName,
  //     // 'createdAt' : Time,
  //     // 'uuid' : UUID,
  //     // 'description' : WorkspaceDescription,
  //     // 'updatedAt' : Time,
  //     const result = await workspace.toObject();

  //     expect(result.owner).toEqual(identity);

  //     // TODO: Figure out why there is a time mismatch between createdAt from the
  //     // canister and the now variable
  //     // const createdAt = new Date(Number(result.created_at / 1000000n));
  //     // const updatedAt = new Date(Number(result.updatedAt / 1000000n));

  //     // expect(createdAt.getDate()).toEqual(now.getDate());
  //     // expect(createdAt.getMonth()).toEqual(now.getMonth());
  //     // expect(createdAt.getFullYear()).toEqual(now.getFullYear());

  //     // expect(updatedAt.getDate()).toEqual(now.getDate());
  //     // expect(updatedAt.getMonth()).toEqual(now.getMonth());
  //     // expect(updatedAt.getFullYear()).toEqual(now.getFullYear());
  //   });
  // });
});

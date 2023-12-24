import { ActorSubclass } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { expect, test, describe, beforeAll } from 'vitest';

import { createActor as createActorUser } from '../../../../declarations/user/index';
import {
  canisterId,
  createActor,
} from '../../../../declarations/user_index/index';
import { _SERVICE } from '../../../../declarations/user_index/user_index.did';

import { assertResultOk } from '../../../helpers';
import { identityFromSeed } from '../../../indentity';

describe('updateProfile', () => {
  let userIndex: ActorSubclass<_SERVICE>;
  let userPrincipal: Principal;
  const identity = identityFromSeed();

  beforeAll(async () => {
    userIndex = createActor(canisterId, {
      agentOptions: {
        host: 'http://localhost:5173',
        identity,
      },
    });

    const result = assertResultOk(await userIndex.registerUser());
    userPrincipal = result.ok;
  });

  test('should fail for anonymous user', async () => {
    const user = createActorUser(userPrincipal, {
      agentOptions: {
        host: 'http://localhost:5173',
      },
    });

    expect(async () => {
      await user.updateProfile({ username: 'eric_cartman' });
    }).rejects.toThrow(/Anonymous access not allowed/);
  });

  test("should update the user's profile", async () => {
    const user = createActorUser(userPrincipal, {
      agentOptions: {
        host: 'http://localhost:5173',
        identity,
      },
    });
    const result = await user.updateProfile({
      username: 'eric_cartman',
    });

    if ('err' in result) {
      fail("failed to update user's profile");
    }

    expect(result.ok.username).toEqual('eric_cartman');
    // TODO : Assert that updatedAt is updated
  });
});

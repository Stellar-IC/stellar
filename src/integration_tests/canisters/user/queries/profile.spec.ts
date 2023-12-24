import { ActorSubclass } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { expect, test, describe, beforeAll } from 'vitest';

import { createActor as createActorUser } from '../../../../declarations/user/index';
import {
  canisterId,
  createActor,
} from '../../../../declarations/user_index/index';
import { _SERVICE } from '../../../../declarations/user_index/user_index.did';

import { identity, identityFromSeed } from '../../../indentity';
import { assertResultOk } from '../../../helpers';

describe('profile', () => {
  let userIndex: ActorSubclass<_SERVICE>;
  let userPrincipal: Principal;

  beforeAll(async () => {
    userIndex = createActor(canisterId, {
      agentOptions: {
        host: 'http://localhost:5173',
        identity: identityFromSeed(),
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

    await expect(async () => {
      await user.profile();
    }).rejects.toThrow(/Anonymous access not allowed/);
  });

  test("should return the user's profile", async () => {
    const now = new Date();
    const user = createActorUser(userPrincipal, {
      agentOptions: {
        host: 'http://localhost:5173',
        identity,
      },
    });
    const result = await user.profile();

    if ('err' in result) {
      fail("failed to get user's profile");
    }

    const profile = result.ok;

    expect(profile.username).toEqual([]);

    // TODO: Figure out why there is a time mismatch between createdAt from the
    // canister and the now variable
    const createdAt = new Date(Number(profile.created_at / 1000000n));
    const updatedAt = new Date(Number(profile.updatedAt / 1000000n));

    expect(createdAt.getDate()).toEqual(now.getDate());
    expect(createdAt.getMonth()).toEqual(now.getMonth());
    expect(createdAt.getFullYear()).toEqual(now.getFullYear());

    expect(updatedAt.getDate()).toEqual(now.getDate());
    expect(updatedAt.getMonth()).toEqual(now.getMonth());
    expect(updatedAt.getFullYear()).toEqual(now.getFullYear());
  });
});

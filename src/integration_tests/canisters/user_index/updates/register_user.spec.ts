import { expect, test } from 'vitest';
import {
  canisterId,
  createActor,
} from '../../../../declarations/user_index/index';
import { assertResultErr, assertResultOk } from '../../../helpers';
import { identity } from '../../../indentity';

describe('registerUser', () => {
  test('should fail for anonymous user', async () => {
    const userIndex = createActor(canisterId, {
      agentOptions: {
        host: 'http://localhost:5173',
      },
    });
    const result = assertResultErr(await userIndex.registerUser());
    expect(result.err).toEqual({
      anonymousUser: null,
    });
  });

  test('should return the principal for the new user', async () => {
    const userIndex = createActor(canisterId, {
      agentOptions: {
        host: 'http://localhost:5173',
        identity,
      },
    });
    const result = assertResultOk(await userIndex.registerUser());
    expect(result.ok.toText()).toBe('ctiya-peaaa-aaaaa-qaaja-cai');
  });
});

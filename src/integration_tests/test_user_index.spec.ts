import { expect, test } from 'vitest';
import { canisterId, createActor } from '../declarations/user_index/index';
import { assertResultOk } from './helpers';
import { identity } from './indentity';

test('should handle a basic greeting', async () => {
  const userIndex = createActor(canisterId, {
    agentOptions: {
      host: 'http://localhost:5173',
      identity,
    },
  });
  const result = assertResultOk(await userIndex.registerUser());
  expect(result.ok.toText()).toBe('ctiya-peaaa-aaaaa-qaaja-cai');
});

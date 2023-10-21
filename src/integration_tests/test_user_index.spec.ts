import { expect, test } from 'vitest';
import { canisterId, createActor } from '../declarations/user_index/index';
import { identity } from './indentity';

test('should handle a basic greeting', async () => {
  const userIndex = createActor(canisterId, {
    agentOptions: {
      host: 'http://localhost:5173',
      identity,
    },
  });

  const result1 = await userIndex.registerUser();
  if (!('ok' in result1)) {
    throw new Error(
      `Error calling registerUser: ${JSON.stringify(result1.err)}`
    );
  }

  expect(result1.ok.toText()).toBe('ctiya-peaaa-aaaaa-qaaja-cai');
});

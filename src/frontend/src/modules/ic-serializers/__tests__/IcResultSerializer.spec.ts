import { describe, expect } from 'vitest';

import { IcResultSerializer } from '../IcResultSerializer';

describe('IcResultSerializer', () => {
  it('should return null if input does not have an "ok" value', () => {
    const serializer = new IcResultSerializer();
    const result = serializer.serialize(
      { err: { blockNotFound: null } },
      { fromShareable: (data) => data }
    );
    expect(result).toEqual(null);
  });

  it('should serialize the input\'s "ok" value', () => {
    const serializer = new IcResultSerializer<number, unknown, string>();
    const result = serializer.serialize(
      { ok: 1 },
      {
        fromShareable: (data) => `${data}`,
      }
    );
    expect(result).toEqual('1');
  });
});

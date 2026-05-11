import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';

import { EnvKEKProvider } from './kek.js';

const savedEnv = { ...process.env };

beforeEach(() => {
  // 32 bytes random base64 (44 chars including padding for 32 raw bytes)
  process.env.TOMORI_KEK_V1 = randomBytes(32).toString('base64');
  process.env.TOMORI_KEK_PROVIDER = 'env';
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('crypto/kek EnvKEKProvider (§6.8)', () => {
  it('current() returns 32-byte key with id "env:v1"', async () => {
    const provider = new EnvKEKProvider();
    const cur = await provider.current();
    expect(cur.id).toBe('env:v1');
    expect(Buffer.isBuffer(cur.key)).toBe(true);
    expect(cur.key.length).toBe(32);
  });

  it('byId("env:v1") returns the same key as current()', async () => {
    const provider = new EnvKEKProvider();
    const cur = await provider.current();
    const byId = await provider.byId('env:v1');
    expect(byId.equals(cur.key)).toBe(true);
  });

  it('byId() with unknown id throws', async () => {
    const provider = new EnvKEKProvider();
    await expect(provider.byId('env:v999')).rejects.toThrow();
  });

  it('current() throws when TOMORI_KEK_V1 is missing', async () => {
    delete process.env.TOMORI_KEK_V1;
    const provider = new EnvKEKProvider();
    await expect(provider.current()).rejects.toThrow();
  });

  it('current() throws when TOMORI_KEK_V1 is not 32 bytes after base64 decode', async () => {
    process.env.TOMORI_KEK_V1 = Buffer.from('too-short').toString('base64');
    const provider = new EnvKEKProvider();
    await expect(provider.current()).rejects.toThrow();
  });
});

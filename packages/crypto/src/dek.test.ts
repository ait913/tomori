import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';

import { encrypt, decrypt, type EncryptedBlob } from './dek.js';

const newDEK = () => randomBytes(32);
const aadOf = (userId: string) => Buffer.from(userId, 'utf8');

describe('crypto/dek (§7.9)', () => {
  it('§7.9.2 encrypt → decrypt roundtrip matches the plaintext (string)', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const blob = encrypt(dek, 'こんにちは、tomori', aad);
    const out = decrypt(dek, blob, aad);
    expect(out.toString('utf8')).toBe('こんにちは、tomori');
  });

  it('§7.9.2 encrypt → decrypt roundtrip matches the plaintext (Buffer)', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const payload = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x01]);
    const blob = encrypt(dek, payload, aad);
    const out = decrypt(dek, blob, aad);
    expect(out.equals(payload)).toBe(true);
  });

  it('§7.9.3 decrypt with a different user-id AAD throws (cross-user leak prevention)', () => {
    const dek = newDEK();
    const blob = encrypt(dek, 'secret', aadOf('user-A'));
    expect(() => decrypt(dek, blob, aadOf('user-B'))).toThrow();
  });

  it('§7.9.4 decrypt with a tampered nonce (1 byte flip) throws', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const blob = encrypt(dek, 'payload', aad);
    const tamperedNonce = Buffer.from(blob.nonce);
    tamperedNonce[0] = tamperedNonce[0]! ^ 0xff;
    const tampered: EncryptedBlob = {
      ciphertext: blob.ciphertext,
      nonce: tamperedNonce,
      alg_version: blob.alg_version,
    };
    expect(() => decrypt(dek, tampered, aad)).toThrow();
  });

  it('§7.9.5 decrypt with a tampered ciphertext (1 byte flip) throws', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const blob = encrypt(dek, 'payload-of-some-length', aad);
    const tamperedCt = Buffer.from(blob.ciphertext);
    tamperedCt[0] = tamperedCt[0]! ^ 0xff;
    const tampered: EncryptedBlob = {
      ciphertext: tamperedCt,
      nonce: blob.nonce,
      alg_version: blob.alg_version,
    };
    expect(() => decrypt(dek, tampered, aad)).toThrow();
  });

  it('decrypt with a wrong DEK throws', () => {
    const dek1 = newDEK();
    const dek2 = newDEK();
    const blob = encrypt(dek1, 'sensitive', aadOf('user-1'));
    expect(() => decrypt(dek2, blob, aadOf('user-1'))).toThrow();
  });

  it('alg_version is always 1 (§6.8 implementation constant)', () => {
    const dek = newDEK();
    const blob = encrypt(dek, 'anything', aadOf('user-1'));
    expect(blob.alg_version).toBe(1);
  });

  it('nonce is exactly 12 bytes (§6.8)', () => {
    const dek = newDEK();
    const blob = encrypt(dek, 'anything', aadOf('user-1'));
    expect(blob.nonce.length).toBe(12);
  });

  it('ciphertext length = plaintext bytes + 16 (GCM tag, §6.8 AES-256-GCM)', () => {
    const dek = newDEK();
    const plaintext = 'hello world';
    const ptBytes = Buffer.byteLength(plaintext, 'utf8');
    const blob = encrypt(dek, plaintext, aadOf('user-1'));
    expect(blob.ciphertext.length).toBe(ptBytes + 16);
  });

  it('nonces do not collide across 20 invocations on the same DEK (statistical sanity)', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const blob = encrypt(dek, `payload-${i}`, aad);
      seen.add(blob.nonce.toString('hex'));
    }
    expect(seen.size).toBe(20);
  });

  it('encrypt/decrypt works with empty plaintext', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const blob = encrypt(dek, '', aad);
    const out = decrypt(dek, blob, aad);
    expect(out.toString('utf8')).toBe('');
    expect(blob.ciphertext.length).toBe(16); // tag only
  });

  it('encrypt/decrypt works with an empty AAD buffer', () => {
    const dek = newDEK();
    const aad = Buffer.alloc(0);
    const blob = encrypt(dek, 'payload', aad);
    const out = decrypt(dek, blob, aad);
    expect(out.toString('utf8')).toBe('payload');
  });

  it('decrypt with a tampered last byte of ciphertext (auth tag region) throws', () => {
    const dek = newDEK();
    const aad = aadOf('user-1');
    const blob = encrypt(dek, 'payload', aad);
    const ct = Buffer.from(blob.ciphertext);
    ct[ct.length - 1] = ct[ct.length - 1]! ^ 0x01;
    expect(() => decrypt(dek, { ...blob, ciphertext: ct }, aad)).toThrow();
  });
});

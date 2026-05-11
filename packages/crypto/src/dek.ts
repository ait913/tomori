import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedBlob = {
  ciphertext: Buffer;
  nonce: Buffer;
  alg_version: number;
};

const ALG = "aes-256-gcm";
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;

export function encrypt(dek: Buffer, plaintext: Buffer | string, aad: Buffer): EncryptedBlob {
  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = createCipheriv(ALG, dek, nonce);
  cipher.setAAD(aad);

  const input = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext;
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, tag]),
    nonce,
    alg_version: 1
  };
}

export function decrypt(dek: Buffer, blob: EncryptedBlob, aad: Buffer): Buffer {
  const body = blob.ciphertext.subarray(0, blob.ciphertext.length - TAG_LENGTH);
  const tag = blob.ciphertext.subarray(blob.ciphertext.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALG, dek, blob.nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(body), decipher.final()]);
}

import type { Pool } from "pg";

import { decrypt, encrypt, getDEKById, getOrCreateActiveDEK } from "@tomori/crypto";

import type { ApiEnv } from "../types.js";

export async function encryptForUser(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string,
  plaintext: string
): Promise<{ dekId: string; ciphertext: Buffer; nonce: Buffer; algVersion: number }> {
  const { id, dek } = await getOrCreateActiveDEK(pool, kekProvider, userId);
  const blob = encrypt(dek, plaintext, Buffer.from(userId, "utf8"));
  return {
    dekId: id,
    ciphertext: blob.ciphertext,
    nonce: blob.nonce,
    algVersion: blob.alg_version
  };
}

export async function decryptForUser(
  pool: Pool,
  kekProvider: ApiEnv["Variables"]["kekProvider"],
  userId: string,
  dekId: string,
  ciphertext: Buffer,
  nonce: Buffer,
  algVersion: number
): Promise<string> {
  const dek = await getDEKById(pool, kekProvider, dekId);
  return decrypt(dek, { ciphertext, nonce, alg_version: algVersion }, Buffer.from(userId, "utf8")).toString("utf8");
}

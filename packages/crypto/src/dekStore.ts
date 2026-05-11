import { randomBytes } from "node:crypto";

import type { Pool } from "pg";

import { decrypt, encrypt } from "./dek.js";
import type { KEKProvider } from "./kek.js";

export type ActiveDEK = { id: string; dek: Buffer };

export async function getOrCreateActiveDEK(
  pool: Pool,
  kekProvider: KEKProvider,
  userId: string
): Promise<ActiveDEK> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{
      id: string;
      dek_ciphertext: Buffer;
      dek_nonce: Buffer;
      kek_id: string;
      alg_version: number;
    }>(
      `SELECT id, dek_ciphertext, dek_nonce, kek_id, alg_version
       FROM user_keys
       WHERE user_id = $1 AND retired_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    if (existing.rowCount && existing.rows[0]) {
      const row = existing.rows[0];
      const key = await kekProvider.byId(row.kek_id);
      const dek = decrypt(key, { ciphertext: row.dek_ciphertext, nonce: row.dek_nonce, alg_version: row.alg_version }, Buffer.from(userId, "utf8"));
      await client.query("COMMIT");
      return { id: row.id, dek };
    }

    const dek = randomBytes(32);
    const currentKek = await kekProvider.current();
    const blob = encrypt(currentKek.key, dek, Buffer.from(userId, "utf8"));
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO user_keys (user_id, dek_ciphertext, dek_nonce, kek_id, alg_version)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, blob.ciphertext, blob.nonce, currentKek.id, blob.alg_version]
    );
    await client.query("COMMIT");
    return { id: inserted.rows[0]!.id, dek };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDEKById(pool: Pool, kekProvider: KEKProvider, id: string): Promise<Buffer> {
  const result = await pool.query<{
    user_id: string;
    dek_ciphertext: Buffer;
    dek_nonce: Buffer;
    kek_id: string;
    alg_version: number;
  }>(
    `SELECT user_id, dek_ciphertext, dek_nonce, kek_id, alg_version
     FROM user_keys
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`DEK not found for id: ${id}`);
  }

  const key = await kekProvider.byId(row.kek_id);
  return decrypt(key, { ciphertext: row.dek_ciphertext, nonce: row.dek_nonce, alg_version: row.alg_version }, Buffer.from(row.user_id, "utf8"));
}

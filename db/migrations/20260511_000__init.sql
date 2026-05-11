CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dek_ciphertext bytea NOT NULL,
  dek_nonce bytea NOT NULL,
  kek_id text NOT NULL,
  alg_version smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
CREATE UNIQUE INDEX user_keys_one_active_per_user_idx ON user_keys(user_id) WHERE retired_at IS NULL;

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX sessions_token_hash_idx ON sessions(token_hash);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

CREATE TABLE magic_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX magic_tokens_token_hash_idx ON magic_tokens(token_hash);

CREATE TABLE mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  valence real,
  arousal real,
  tags text[] NOT NULL DEFAULT '{}',
  note_cipher bytea,
  note_nonce bytea,
  dek_id uuid REFERENCES user_keys(id) ON DELETE CASCADE,
  alg_version smallint NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'manual'
);
CREATE INDEX mood_logs_user_ts_idx ON mood_logs(user_id, ts DESC);

CREATE TABLE sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  bedtime_at timestamptz,
  wake_at timestamptz,
  quality smallint CHECK (quality BETWEEN 1 AND 5),
  source text NOT NULL DEFAULT 'manual',
  UNIQUE(user_id, date)
);

CREATE TABLE dialog_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('morning', 'evening', 'talk')),
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  close_reason text,
  turn_cap smallint NOT NULL
);
CREATE INDEX dialog_sessions_user_started_idx ON dialog_sessions(user_id, started_at DESC);

CREATE TABLE dialog_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES dialog_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  turn_index smallint NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content_cipher bytea NOT NULL,
  content_nonce bytea NOT NULL,
  dek_id uuid NOT NULL REFERENCES user_keys(id) ON DELETE CASCADE,
  alg_version smallint NOT NULL DEFAULT 1,
  model text,
  ts timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, turn_index)
);
CREATE INDEX dialog_turns_user_ts_idx ON dialog_turns(user_id, ts DESC);

CREATE TABLE dialog_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES dialog_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  summary_cipher bytea NOT NULL,
  summary_nonce bytea NOT NULL,
  dek_id uuid NOT NULL REFERENCES user_keys(id) ON DELETE CASCADE,
  alg_version smallint NOT NULL DEFAULT 1,
  ts timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dialog_summaries_user_date_idx ON dialog_summaries(user_id, date DESC);

CREATE TABLE crisis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES dialog_sessions(id) ON DELETE SET NULL,
  detected_by text NOT NULL CHECK (detected_by IN ('regex', 'classifier', 'both')),
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  meta jsonb
);

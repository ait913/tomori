#!/bin/sh
set -e

cd /app

echo "[entrypoint] running database migrations..."
node_modules/.bin/node-pg-migrate up \
  --migrations-dir /app/db/migrations \
  --migration-file-language sql

echo "[entrypoint] starting API server..."
exec node /app/apps/api/dist/index.js

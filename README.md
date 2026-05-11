# tomori Phase 1 Core

Phase 1 Web-only MVP for tomori.

## Workspace

- `apps/web`: Next.js static export frontend
- `apps/api`: Hono API on Node 22
- `packages/shared`: shared schemas and types
- `packages/crypto`: envelope encryption utilities
- `packages/llm`: Anthropic wrapper, prompts, context builder, PII masking
- `packages/safety`: crisis detection and hotline card
- `db/`: migrations and reference schema

## Commands

```bash
pnpm install
pnpm db:migrate
pnpm typecheck
pnpm build
```

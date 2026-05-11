FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src
COPY packages/crypto/package.json packages/crypto/package.json
COPY packages/crypto/tsconfig.json packages/crypto/tsconfig.json
COPY packages/crypto/src packages/crypto/src
COPY packages/llm/package.json packages/llm/package.json
COPY packages/llm/tsconfig.json packages/llm/tsconfig.json
COPY packages/llm/src packages/llm/src
COPY packages/safety/package.json packages/safety/package.json
COPY packages/safety/tsconfig.json packages/safety/tsconfig.json
COPY packages/safety/src packages/safety/src
COPY apps/api apps/api

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @tomori/shared build
RUN pnpm --filter @tomori/crypto build
RUN pnpm --filter @tomori/llm build
RUN pnpm --filter @tomori/safety build
RUN pnpm --filter @tomori/api build

WORKDIR /app/apps/api

ENV PORT=3001

EXPOSE 3001

CMD ["pnpm", "start"]

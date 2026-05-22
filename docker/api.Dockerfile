## ─────────────────────────────────────────────────────────────
## Dockerfile for apps/api  (monorepo-aware)
## Build context MUST be the repository root (.)
## ─────────────────────────────────────────────────────────────

# ── Stage 1: Install & Build ──────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /build

# System deps for native modules (bcrypt, prisma, etc.)
RUN apt-get update && \
    apt-get install -y python3 build-essential make g++ ca-certificates openssl && \
    rm -rf /var/lib/apt/lists/*

# 1. Copy root workspace manifests (package.json + lock file)
COPY package.json package-lock.json ./

# 2. Copy workspace package manifests so npm can resolve the workspace graph
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json

# 3. Install ALL dependencies (workspace-aware) from the lock file
RUN npm ci --include=dev

# 4. Copy workspace sources
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# 5. Generate Prisma client & build the database package
WORKDIR /build/packages/database
RUN npx prisma generate
RUN npm run build

# 6. Build the API
WORKDIR /build/apps/api
RUN npm run build

# ── Stage 2: Production runtime ──────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# OpenSSL is needed by Prisma at runtime
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy root workspace manifests
COPY package.json package-lock.json ./

# Copy package manifests for workspaces we need at runtime
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json

# Install production-only deps (workspace-aware)
RUN npm ci --omit=dev --workspace=apps/api --workspace=packages/database

# Copy built artifacts
COPY --from=builder /build/apps/api/dist ./apps/api/dist
COPY --from=builder /build/packages/database/dist ./packages/database/dist

# Copy Prisma schema (needed for prisma generate)
COPY --from=builder /build/packages/database/prisma ./packages/database/prisma

# Re-generate Prisma client in the runner (ensures it matches the runtime OS/arch)
RUN cd packages/database && npx prisma generate

EXPOSE 4000

WORKDIR /app/apps/api
# Run migrations then start the API server
CMD cd /app/packages/database && npx prisma migrate deploy && cd /app/apps/api && node dist/index.js

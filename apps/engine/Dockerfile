## ─────────────────────────────────────────────────────────────
## Dockerfile for apps/engine (Next.js frontend)
## Build context: ./apps/engine  (standalone, no workspace deps)
## ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder
WORKDIR /app

# Accept NEXT_PUBLIC_* as build args (Next.js bakes them at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_NAME=Wavo

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Copy package manifests and install deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --silent; \
    else \
      npm install --silent --no-audit --no-fund --legacy-peer-deps; \
    fi

# Copy source and build
COPY . .
RUN npm run build

# ── Production runtime ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy Next.js build output + static assets
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]

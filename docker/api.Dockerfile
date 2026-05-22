## Dockerfile for building `apps/api` using repo root as build context
FROM node:20-slim AS builder
WORKDIR /build

# Install system build deps for native modules
RUN apt-get update && apt-get install -y python3 build-essential make g++ ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files for the api subfolder and install deps
COPY apps/api/package*.json ./api/
COPY apps/api/tsconfig*.json ./api/
RUN if [ -f ./api/package-lock.json ]; then \
      cd ./api && npm ci --silent; \
    else \
      cd ./api && npm install --silent --no-audit --no-fund --legacy-peer-deps; \
    fi

# Copy api source and build
COPY apps/api ./api
WORKDIR /build/api
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

# Copy built artifacts and package files from builder
COPY --from=builder /build/api/dist ./dist
COPY --from=builder /build/api/package*.json ./

ENV NODE_ENV=production

# Install only production dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --production --silent; \
    else \
      npm install --production --silent --no-audit --no-fund; \
    fi

EXPOSE 4000

CMD ["node", "dist/index.js"]

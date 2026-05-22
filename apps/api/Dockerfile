## Multi-stage Dockerfile for apps/api
# Builds TypeScript sources and produces a small runtime image

FROM node:20-slim AS builder
WORKDIR /app

# Install build tools needed for some native npm modules (node-gyp)
RUN apt-get update && apt-get install -y python3 build-essential make g++ ca-certificates && rm -rf /var/lib/apt/lists/*

# When the build context is `./apps/api` (as in compose), copy files relative to that context.
# Copy package files and tsconfig, install dev deps required for build
COPY package*.json ./
COPY tsconfig*.json ./
# Use flags to make npm install more robust inside the build environment
# --no-audit: skip audit network calls
# --no-fund: skip funding messages
# --legacy-peer-deps: avoid peer dependency conflicts during install
# When the build context is `./apps/api` (as in compose), copy files relative to that context.
# Copy package files and tsconfig, configure npm for more resilient installs, then install
COPY package*.json ./
COPY tsconfig*.json ./

# Configure npm to use the official registry, enable retries and allow unsafe-perm
RUN npm config set registry https://registry.npmjs.org && \
		npm config set fetch-retries 5 && \
		npm config set fetch-retry-factor 2 && \
		npm config set fetch-retry-mintimeout 1000 && \
		npm config set fetch-retry-maxtimeout 60000 && \
		npm config set unsafe-perm true && \
		npm cache clean --force || true

RUN if [ -f package-lock.json ]; then \
			npm ci --silent; \
		else \
			npm install --silent --no-audit --no-fund --legacy-peer-deps; \
		fi

# Copy the rest of the app source and build
COPY . ./
RUN npm run build

## Runtime image
FROM node:20-slim AS runner
WORKDIR /app

# Copy built artifacts and package files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

# Install only production dependencies
RUN npm install --production --silent

EXPOSE 4000

CMD ["node", "dist/index.js"]

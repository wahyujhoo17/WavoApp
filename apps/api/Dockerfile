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
RUN set -eux; \
	attempts=0; \
	until [ $attempts -ge 3 ]; do \
		npm install --silent --no-audit --no-fund --legacy-peer-deps && break || true; \
		attempts=$((attempts+1)); \
		echo "npm install failed, retrying ($attempts/3)"; \
		sleep 3; \
	done; \
	if [ $attempts -ge 3 ]; then \
		echo "npm install ultimately failed — dumping npm logs:"; \
		ls -la /root/.npm/_logs || true; \
		cat /root/.npm/_logs/*.log || true; \
		exit 1; \
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

## Multi-stage Dockerfile to run both `apps/api` and `apps/engine` in one container
## Builder stage: install deps and build both projects
FROM node:18 AS builder
WORKDIR /build

# Install and build API
COPY apps/api/package*.json ./api/
RUN cd ./api && npm ci
COPY apps/api ./api
RUN cd ./api && npm run build

# Install and build Engine (Next.js)
COPY apps/engine/package*.json ./engine/
RUN cd ./engine && npm ci
COPY apps/engine ./engine
RUN cd ./engine && npm run build

## Runtime image
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built API
COPY --from=builder /build/api/dist ./api/dist
COPY --from=builder /build/api/package*.json ./api/

# Copy built Engine (.next and public)
COPY --from=builder /build/engine/.next ./engine/.next
COPY --from=builder /build/engine/public ./engine/public
COPY --from=builder /build/engine/package*.json ./engine/

# Install production dependencies for both subapps
RUN cd ./api && npm ci --production
RUN cd ./engine && npm ci --production

# Copy start script
COPY apps/monolith/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 4000 3001

CMD ["/app/start.sh"]

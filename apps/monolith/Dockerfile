## Multi-stage Dockerfile to run both `apps/api` and `apps/engine` in one container
## Builder stage: install deps and build both projects
FROM node:20 AS builder
WORKDIR /build

# Install and build API
COPY apps/api/package*.json ./api/
# Use `npm install` here because repository may not include package-lock.json
RUN cd ./api && npm install --silent
COPY apps/api ./api
RUN cd ./api && npm run build

# Install and build Engine (Next.js)
COPY apps/engine/package*.json ./engine/
# Use `npm install` here because repository may not include package-lock.json
RUN cd ./engine && npm install --silent
COPY apps/engine ./engine
RUN cd ./engine && npm run build

## Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built API
COPY --from=builder /build/api/dist ./api/dist
COPY --from=builder /build/api/package*.json ./api/

# Copy built Engine (.next and public)
COPY --from=builder /build/engine/.next ./engine/.next
COPY --from=builder /build/engine/public ./engine/public
COPY --from=builder /build/engine/package*.json ./engine/

# Install production dependencies for both subapps
RUN cd ./api && npm install --production --silent
RUN cd ./engine && npm install --production --silent

# Copy start script
COPY apps/monolith/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 4000 3001

CMD ["/app/start.sh"]

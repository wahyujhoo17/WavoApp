# Dokploy deployment guide

This repo is prepared for deploying `apps/api` (backend) and `apps/engine` (frontend) to Dokploy using Git-based builds.

High level steps:

- In Dokploy, create two applications pointing to this repository:
  - App `api`: set "Build path" to `apps/api` and Dockerfile path to `apps/api/Dockerfile` (or use `apps/monolith/Dockerfile` if you prefer a single container)
  - App `engine`: set "Build path" to `apps/engine` and Dockerfile path to `apps/engine/Dockerfile`

- Add required secrets for each app via Dokploy's Secrets settings (do NOT commit these to Git):
  - Common: `NODE_ENV`, `PORT`
  - API: `DATABASE_URL`, `REDIS_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `JWT_PRIVATE_KEY`, `ENCRYPTION_KEY`
  - Engine: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, and any other `NEXT_PUBLIC_*` values

- Trigger a deploy (Dokploy will build the Dockerfile from the specified path).

Notes and tips:

- Keep `.env` files out of the repo. Use the committed `*.env.example` files for reference.
- If you want Dokploy to run multiple services (DB, Redis) consider using managed services (e.g., Valkey, Upstash, managed Postgres) and provide their URLs as secrets.
- CI: A GitHub Actions workflow exists at `.github/workflows/build-and-push.yml` to build and push a monolith image to GHCR if you prefer registry-based deployment.

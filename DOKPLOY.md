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

Using Docker Compose in Dokploy
--------------------------------

Dokploy's UI includes a "Compose" option that can deploy a multi-container stack from a Docker Compose file. I've added `docker-compose.dokploy.yml` to the repo which defines `api`, `engine`, `postgres`, `redis`, and `minio` services for convenience.

Steps to deploy using Compose in Dokploy UI:

1. In Dokploy, choose Actions → Compose (or "New App" → choose Compose if available).
2. Point Dokploy at the repository and branch `main` and set the Compose file path to `docker-compose.dokploy.yml`.
3. Before deploying, replace the placeholder credentials in the compose file by adding Dokploy Secrets for the variables used by `api` and `minio` (e.g., `DATABASE_URL`, `REDIS_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `JWT_PRIVATE_KEY`, `ENCRYPTION_KEY`). Dokploy should allow you to override environment variables defined in the Compose file via its Secrets UI.
4. Start the deploy and watch the logs. Dokploy will create the containers as services and wire the network between them.

Important production notes:

- While Compose is convenient for testing or small deployments, for production it's recommended to use managed DB/Redis/Object storage services and point the `api` to those URLs via secrets. Managed services scale better and are typically more reliable.
- If you keep Postgres/Redis/MinIO within the Compose stack, ensure you have backups and persistent volumes configured.


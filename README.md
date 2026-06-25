<p align="center">
  <img src="https://img.shields.io/badge/Wavo-WhatsApp%20Gateway-7c3aed?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Wavo" />
</p>

<h1 align="center">Wavo</h1>

<p align="center">
  <strong>Self-hosted WhatsApp API Gateway Platform</strong><br/>
  Send messages, manage multiple instances, configure webhooks, and monitor delivery — all via REST API.<br/>
  🌐 Official Website: <a href="https://wavo.lumicloud.my.id/">wavo.lumicloud.my.id</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify" alt="Fastify" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="docs/images/dashboard.png" alt="Wavo Dashboard" width="100%" />
</p>

<p align="center">
  <img src="docs/images/services.png" alt="Wavo WhatsApp Services" width="100%" />
</p>

<p align="center">
  <img src="docs/images/logs.png" alt="Wavo API Traffic Logs" width="100%" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📱 **Multi-Instance WhatsApp** | Connect and manage multiple WhatsApp accounts simultaneously |
| 📤 **REST API Messaging** | Send text, images, documents, and bulk broadcasts via API |
| 🔐 **JWT + Refresh Token Rotation** | Secure authentication with automatic token refresh and replay protection |
| 🔑 **API Keys** | Scoped server-to-server keys for programmatic access (`wavo_sk_*`) |
| 📊 **Real-time Dashboard** | Beautiful Next.js dashboard with live QR scanning, message logs, and analytics |
| 🪝 **Webhooks** | HMAC-signed webhook delivery for incoming messages and status updates |
| 📊 **Message Queues** | BullMQ-powered queues with plan-based priority (Enterprise → Pro → Free) |
| 🗄️ **Object Storage** | MinIO/S3-compatible media storage with local fallback |
| 📋 **Audit Logs** | Track all user actions for compliance and debugging |
| 🐳 **Docker Ready** | One-command deploy with Docker Compose |

---

## 🏗️ Architecture

```
wavo-monorepo/
├── apps/
│   ├── api/              # Fastify REST API + WebSocket (Baileys engine)
│   └── engine/           # Next.js 16 Dashboard (React 19, shadcn/ui)
├── packages/
│   └── database/         # Prisma ORM (schema, migrations, client)
├── docker/
│   └── api.Dockerfile    # Multi-stage production Dockerfile
├── docker-compose.yml    # Full-stack local development
└── docker-compose.dokploy.yml  # Dokploy deployment
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **API Server** | Fastify 5, Socket.IO 4 |
| **WhatsApp Engine** | Baileys (unofficial WA Web API) |
| **Message Queue** | BullMQ + Redis 7 |
| **Database** | PostgreSQL 15 + Prisma 6 |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Object Storage** | MinIO (S3-compatible) with local fallback |
| **Auth** | JWT (access + refresh tokens), bcrypt, API keys |
| **Runtime** | Node.js 20 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 15+
- **Redis** 7+
- **npm** ≥ 9 (uses npm workspaces)

### 1. Clone & Install

```bash
git clone https://github.com/wahyujhoo17/WavoApp.git
cd WavoApp
npm install
```

### 2. Configure Environment

```bash
# Copy example env files
cp apps/api/.env.example apps/api/.env
cp apps/engine/.env.example apps/engine/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/wavo?schema=public
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY=your_32_char_secret_key_here_ok
JWT_PUBLIC_KEY=your_32_char_secret_key_here_ok
ENCRYPTION_KEY=your_32_char_encryption_key_ok
PORT=4000
```

Edit `apps/engine/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_APP_NAME=Wavo
```

### 3. Setup Database

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed demo data
npx prisma db seed

cd ../..
```

### 4. Start Development

```bash
# Terminal 1 — API Server
cd apps/api
npm run dev
# → http://localhost:4000

# Terminal 2 — Dashboard
npm run dev:engine
# → http://localhost:3001
```

---

## 🐳 Docker Deployment

### Local Docker Compose

```bash
docker compose up --build
```

This spins up the entire stack:

| Service | Port | Description |
|---------|------|-------------|
| `api` | 4000 | Fastify API + WebSocket |
| `wavo-frontend` | 3000 | Next.js Dashboard |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis (BullMQ queues) |
| `minio` | 9000 | Object storage |

> ⚠️ **Important on Docker Environment Variables:** 
> When running the application inside Docker containers, do not use `localhost` or `127.0.0.1` for external services like Database and Redis in your `.env`. Instead, use the container service names defined in `docker-compose.yml`:
> - **Database URL**: `DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/wavo?schema=public`
> - **Redis URL**: `REDIS_URL=redis://redis:6379`

### Dokploy Deployment

See [DOKPLOY.md](./DOKPLOY.md) for detailed Dokploy deployment instructions.

**Quick setup:**

1. Create a Compose app in Dokploy pointing to `docker-compose.dokploy.yml`
2. Add environment variables (see [env-examples/.env.dokploy](./env-examples/.env.dokploy))
3. Set domains for API and Frontend services
4. Deploy

> ⚠️ **Important:** The API Dockerfile requires the **repository root** as build context because `apps/api` depends on the workspace package `packages/database` (Prisma).

---

## 📡 API Overview

**Base URL:** `http://localhost:4000/api/v1`

### Authentication

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123", "fullName": "John Doe"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123"}'
```

### Send Messages

```bash
# Send text message
curl -X POST http://localhost:4000/api/v1/send/text \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "your-service-uuid",
    "to": "6281234567890",
    "message": "Hello from Wavo!"
  }'
```

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Create account | — |
| `POST` | `/auth/login` | Sign in → JWT + refresh token | — |
| `POST` | `/auth/refresh` | Rotate refresh token | — |
| `POST` | `/auth/logout` | Revoke session | JWT |
| `GET` | `/services` | List WhatsApp instances | JWT |
| `POST` | `/services` | Create instance | JWT |
| `POST` | `/services/:id/connect` | Connect & get QR code | JWT |
| `POST` | `/services/:id/disconnect` | Disconnect instance | JWT |
| `POST` | `/send/text` | Send text message | JWT / API Key |
| `POST` | `/send/bulk` | Broadcast (up to 500) | JWT / API Key |
| `POST` | `/send/image` | Send image (multipart) | JWT / API Key |
| `GET` | `/logs` | Message logs (cursor pagination) | JWT |
| `GET` | `/analytics` | Stats & metrics | JWT |
| `POST` | `/webhooks` | Configure webhook | JWT |
| `POST` | `/api-keys` | Generate API key | JWT |

> Full interactive API documentation available at the Dashboard → **Docs** page.

---

## 🪝 Webhooks

Wavo delivers real-time HTTP POST notifications signed with HMAC SHA-256:

**Events:**
- `message.received` — Incoming message from a contact
- `message.sent` — Outgoing message delivered
- `message.failed` — Delivery failure
- `instance.connected` — WhatsApp connected
- `instance.disconnected` — WhatsApp disconnected

**Verification:**

```javascript
const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-wavo-signature'];
  const computed = crypto
    .createHmac('sha256', process.env.WAVO_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature === computed) {
    // ✓ Authentic — process event
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

---

## 🗂️ Database Schema

Key models managed by Prisma:

| Model | Description |
|-------|-------------|
| `User` | Accounts with role (USER/ADMIN) and plan (FREE/PRO/BUSINESS/ENTERPRISE) |
| `Session` | JWT refresh tokens with token family tracking for RTR |
| `WhatsAppService` | Connected WhatsApp instances with encrypted session storage |
| `ApiKey` | Scoped API keys with SHA-256 hashing (`wavo_sk_*` prefix) |
| `WebhookConfig` | Webhook URLs with HMAC signing secrets |
| `MessageLog` | Full message history with status tracking |
| `QueueJob` | BullMQ job tracking with priority queues |
| `AuditLog` | User action audit trail |

```bash
# View database in Prisma Studio
cd packages/database
npx prisma studio
```

---

## 📁 Project Structure

```
apps/
├── api/
│   └── src/
│       ├── config/        # Environment validation
│       ├── routes/        # Fastify route handlers
│       │   ├── auth.ts    # Register, login, refresh, logout, profile
│       │   ├── services.ts # WhatsApp instance CRUD + connect/disconnect
│       │   ├── messaging.ts # Send text, bulk, image
│       │   └── logs.ts    # Message logs + analytics
│       ├── services/      # Business logic
│       │   ├── whatsapp.ts # Baileys session manager
│       │   ├── queue.ts   # BullMQ queue workers
│       │   ├── webhook.ts # Webhook dispatcher
│       │   └── storage.ts # MinIO/local file storage
│       ├── server.ts      # Fastify + Socket.IO setup
│       └── index.ts       # Bootstrap entry point
└── engine/
    └── src/
        ├── app/           # Next.js App Router pages
        ├── components/    # React components (shadcn/ui)
        └── lib/           # API client, utilities

packages/
└── database/
    ├── prisma/
    │   ├── schema.prisma  # Database schema
    │   └── migrations/    # Migration history
    └── src/               # Prisma client export
```

---

## 🔒 Security

- **Password Hashing** — bcrypt with configurable rounds (default: 12)
- **JWT** — Short-lived access tokens (15m) + refresh token rotation with family tracking
- **Token Replay Detection** — Reusing a revoked refresh token terminates the entire session family
- **API Key Hashing** — Keys stored as SHA-256 hashes; full key shown only once at creation
- **Webhook Signing** — HMAC SHA-256 signatures on all webhook deliveries
- **Session Encryption** — WhatsApp session credentials encrypted with AES-256-GCM
- **Input Validation** — Zod schemas on all API endpoints

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ by the Wavo team
</p>

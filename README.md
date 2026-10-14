# MTW Corporate Travel Platform — Backend

BusinessTravelSimplified. NestJS 11 modular monolith (microservices-ready) with an adapter-based **Distribution Hub**.

## Stack

- Node.js 24 LTS · TypeScript 5.9 · NestJS 11 (Fastify) · pnpm + Nx
- MySQL 8 · Prisma 7 · Redis 7 · BullMQ · NATS
- Zod · CASL · OpenTelemetry · Prometheus

## Quick start

```bash
fnm use          # or nvm use — requires Node 24.21+
pnpm install
cp .env.example .env
pnpm docker:up
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:gateway
```

Health: `GET http://localhost:3000/v1/health`  
OpenAPI: `http://localhost:3000/docs`  
Metrics: `http://localhost:3000/metrics`

## Deploy modes

| `DEPLOY_MODE` | Behaviour |
|---|---|
| `monolith` (default) | All domains in-process; in-memory messaging |
| `microservices` | Separate processes; NATS transport |

## Adding a supplier

See [docs/adding-a-supplier.md](docs/adding-a-supplier.md).

```bash
pnpm gen:adapter --vertical hotel --code acme
```

## Workspace layout

```
apps/
  api-gateway/          # public REST + per-portal BFF stubs
  auth-service/ … audit-service/   # 15 domain apps (+ distribution-hub)
  distribution-hub/     # adapters: hotel / flight / bus / cab / train
libs/                   # common, config, contracts, database, cache, queue, …
tools/generators/       # pnpm gen:adapter | gen:service
deploy/                 # docker, k8s, helm, github-actions
docs/                   # ADRs, adapter guide, API guide, runbooks
```

Architecture ADRs: `docs/adr/`.

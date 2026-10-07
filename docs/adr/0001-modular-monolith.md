# ADR-0001: Modular Monolith First

## Status
Accepted

## Context
MTW needs many bounded contexts (auth, booking, distribution hub, …) and a future path to independently deployable services, without paying microservices operational cost on day one.

## Decision
Ship a **modular monolith**: each domain is an isolated Nest module/app with its own Prisma models (prefixed tables), public contracts in `@mtw/contracts`, and no cross-module DB joins. `DEPLOY_MODE=monolith|microservices` selects in-process vs NATS transport.

## Consequences
- Fast local DX and simpler transactions initially.
- Clear seams for later extraction.
- Requires discipline: no leaking internals across modules.

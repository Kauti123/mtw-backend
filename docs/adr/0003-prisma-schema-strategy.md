# ADR-0003: Prisma Schema Strategy

## Status
Accepted

## Context
Target end-state is database-per-service. Day one needs one MySQL instance and shared migrations.

## Decision
Single Prisma schema with **table prefixes** per domain (`auth_`, `user_`, `booking_`, …). Read replica via `@prisma/extension-read-replicas` for reporting. Outbox table lives in platform prefix for reliable events.

## Consequences
- Easy local setup.
- Migration to separate DBs later is mechanical (split schema files + connection strings).
- Must enforce tenancy in application layer (Prisma extension), not via DB schemas alone.

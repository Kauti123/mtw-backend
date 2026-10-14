# ADR-0002: Nx + pnpm Workspaces

## Status
Accepted

## Context
We need many Nest apps, shared libs, generators (`gen:adapter`, `gen:service`), and cached CI builds.

## Decision
Use **pnpm workspaces** for dependency management and **Nx** for task graph, caching, and Nest generators. Turborepo was considered but Nx Nest plugin + generators fit better.

## Consequences
- Higher initial setup cost.
- Stronger long-term DX for multi-app monorepo.

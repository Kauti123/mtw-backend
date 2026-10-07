# ADR-0004: Adapter-based Distribution Hub

## Status
Accepted

## Context
Booking/pricing must not couple to supplier APIs. Adding TBO, Amadeus, or a new bus API must be isolated.

## Decision
All supplier I/O goes through `apps/distribution-hub` via `SupplierAdapter` + `@RegisterAdapter` discovery. Canonical models live in `@mtw/contracts`. Three integration tiers: code adapter, declarative REST (JSONata), and provider pattern for payments/messaging.

## Consequences
- New supplier = adapter folder + DB config row.
- Booking orchestrator stays supplier-agnostic.
- Requires strict adapter contract tests.

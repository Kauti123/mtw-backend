# Adding a Supplier to MTW Distribution Hub

Goal: add a new travel supplier with **zero changes** to booking, pricing, or orchestration code.

## Three tiers

| Tier | When to use | Effort |
|---|---|---|
| 1. Code adapter | GDS, SOAP, OAuth, complex mapping | `pnpm gen:adapter` + fill mappers |
| 2. Declarative REST | Simple JSON REST APIs | Admin Portal JSON/YAML definition |
| 3. Provider pattern | Payments, email, WhatsApp, SMS | Implement provider interface |

## Tier 1 — worked example (sandbox)

The **MOCK** hotel adapter ships with the platform and is the reference implementation.

### 1. Generate scaffold

```bash
pnpm gen:adapter --vertical hotel --code acme
```

Creates:

```
apps/distribution-hub/src/adapters/hotel/acme/
  acme.adapter.ts
  acme.client.ts
  acme.mapper.request.ts
  acme.mapper.response.ts
  acme.schemas.ts
  acme.errors.ts
  acme.config.schema.ts
  acme.adapter.spec.ts
  README.md
```

### 2. Implement only client + mappers

- Map canonical `SearchRequest<'HOTEL'>` → supplier payload
- Call supplier HTTP/SOAP API via `BaseSupplierAdapter` HTTP client
- Map response → canonical `SearchResult<'HOTEL'>`
- Map supplier error codes → `SupplierError` taxonomy

### 3. Register (automatic)

Annotate with `@RegisterAdapter({ code: 'ACME', vertical: 'HOTEL', version: '1' })`.  
`AdapterRegistry` discovers it on boot — no manual module wiring.

### 4. Enable in DB (no deploy)

Insert rows:

- `supplier_supplier` — code `ACME`, enabled
- `supplier_credential` — AES-GCM encrypted credentials
- `supplier_vertical_config` — base URL, timeout, priority, capabilities
- optional `supplier_rule` — corporate/market allow-list

### 5. Verify

```bash
# Test connection
curl -X POST /v1/admin/suppliers/ACME/test-connection

# Search via hub (booking-service never sees ACME)
curl -X POST /v1/hub/search -d '{ "vertical": "HOTEL", ... }'
```

### Contract tests

Every adapter must pass the Pact + fixture harness under `*.adapter.spec.ts`.

## What you must NOT change

- `booking-service` orchestration
- `pricing-service` engines
- Hub `BookingOrchestrator` / routing engine

If you feel you need to touch those, stop — extend the adapter contract or open an ADR.

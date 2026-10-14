# Auth endpoint inventory (global JwtAuthGuard)

Default: **authentication required** via `Authorization: Bearer <access_token>`.

Global guard: `JwtAuthGuard` registered with `APP_GUARD` in `SecurityModule` (`@mtw/security`).  
Bypass: only routes explicitly marked `@Public()` from `@mtw/common`.

## Public exceptions (approved)

| Method | Path | Justification |
|--------|------|---------------|
| GET | `/health` | Ops liveness/readiness dependency check |
| GET | `/health/live` | K8s liveness |
| GET | `/health/ready` | K8s readiness |
| GET | `/metrics` | Prometheus scrape |
| POST | `/v1/auth/login` | Pre-auth login |
| POST | `/v1/auth/refresh` | Pre-auth refresh (opaque refresh token in body) |
| POST | `/v1/auth/register` | Pre-auth registration |
| POST | `/v1/auth/admin/login` | Misba Supervision admin login |
| POST | `/v1/auth/admin/refresh` | Admin refresh |
| POST | `/v1/hub/webhooks/:supplierCode` | Inbound supplier webhook (no Bearer; signature auth TBD) |

## Protected by default (representative)

All other controllers require a valid access JWT, including:

- `/v1/admin-users/**` (except login/refresh above)
- `/v1/roles/**`, `/v1/permissions/**`, `/v1/users/**`
- `/v1/corporates/**`, `/v1/corporate-codes/**`, `/v1/masterdata/**`
- `/v1/policies/**`, `/v1/bookings/**`, `/v1/hub/search|book|cancel|adapters`
- `/v1/markup-rules/**`, commercial pricing routes
- `/v1/audit/**`
- BFF portals `/v1/bff/**`
- Module health probes under `/v1/*/health` (auth required)

## Token rules

- Access tokens: signed HS256 JWT (`iss`, `aud`, `exp`, `typ` = `access` \| `admin_access`)
- Refresh tokens: opaque secrets (not accepted as Bearer access tokens)
- Bearer header only — query/body/cookies are not accepted for access tokens

## Remaining security gaps

1. Access-token revocation/denylist not implemented (short TTL mitigates).
2. Supplier webhook signature verification not yet implemented (`@Public` temporary).
3. Role/permission/tenant authorization guards are separate from authentication and should continue to be enforced per resource.
4. Standalone microservice processes that do not import `SecurityModule` would not inherit the guard — monolith gateway does.

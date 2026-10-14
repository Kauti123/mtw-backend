# MTW API Guide

Base URL: `https://api.mtw.com/v1` (local: `http://localhost:3000/v1`)

## Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
```
Send `Authorization: Bearer <accessToken>` on protected routes.

## Booking flow (uses Distribution Hub under the hood)
```
POST /bookings/search
POST /bookings                 # Idempotency-Key required
GET  /bookings/:bookingRef
POST /bookings/:bookingRef/cancel
```

## Hub (internal / admin)
```
POST /hub/search
POST /hub/book
POST /hub/cancel
GET  /hub/adapters
POST /hub/webhooks/:supplierCode
```

## Health & metrics
```
GET /health
GET /health/live
GET /health/ready
GET /metrics
GET /docs
```

OpenAPI is published at `/docs`.

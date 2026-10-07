# Incident Response Runbook — MTW Backend

## Severity
- **SEV1**: Booking create/cancel failing for all corporates
- **SEV2**: Single supplier circuit open / elevated errors
- **SEV3**: Elevated latency, non-booking degradation

## First 5 minutes
1. Check Grafana dashboard `MTW Overview` — error rate, p95 search
2. `GET /health/ready` on api-gateway
3. Check Redis / MySQL / NATS container health (`docker compose ps`)
4. Check `mtw_supplier_errors_total` for which supplier/code

## Supplier outage
1. Confirm circuit state in `supplier_health`
2. Routing auto-skips OPEN circuits — verify partial search still returns
3. Disable supplier in DB (`supplier.enabled=false`) if poison
4. Notify via status page

## Rollback
```bash
helm rollback mtw-backend 1
```

## Contacts
- On-call: #mtw-oncall
- Supplier desk: #mtw-suppliers

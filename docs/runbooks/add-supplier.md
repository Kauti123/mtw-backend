# Runbook: Add a supplier

Follow `docs/adding-a-supplier.md`. Quick path:

1. `pnpm gen:adapter --vertical hotel --code acme`
2. Implement client + mappers
3. Insert `supplier_supplier` + credentials + vertical config
4. `POST /v1/hub/search` to verify

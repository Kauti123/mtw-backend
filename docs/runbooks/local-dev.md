# Local development

```bash
pnpm install
docker compose up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm start:monolith
```

Gateway: http://localhost:3000  
OpenAPI: http://localhost:3000/docs  
Health: http://localhost:3000/health

# AIGuidebook

Monorepo for a student-facing AI usage guidebook platform.

## Stack
- Frontend: React + Vite + TypeScript + React Router
- Backend: NestJS + TypeScript
- DB: PostgreSQL + Prisma
- PDF: Playwright HTML-to-PDF

## Workspace
- `apps/web`
- `apps/api`
- `packages/shared`

## Local Run
1. Copy `.env.example` to `.env` in repo root and adjust values.
2. Start PostgreSQL:
   - Docker: `docker compose -f infra/docker/docker-compose.yml up -d`
3. Install dependencies:
   - `pnpm install`
4. Generate Prisma client and run migrations:
   - `pnpm --filter @aiguidebook/api prisma:generate`
   - `pnpm --filter @aiguidebook/api prisma:migrate`
5. Seed dev data:
   - `pnpm --filter @aiguidebook/api prisma:seed`
6. Run apps:
   - `pnpm dev`

API runs on `http://localhost:3000/api/v1` and web on `http://localhost:5173`.

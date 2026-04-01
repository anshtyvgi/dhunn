# Dhun

Dhun now has two apps in the repo:

- `app/`: Next.js frontend
- `backend/`: NestJS API, workers, Prisma schema, BullMQ orchestration

## Secure Production Stack

- Frontend: Next.js 16, React 19, Clerk
- Backend: NestJS 11, Prisma, PostgreSQL, Redis, BullMQ
- Storage: Cloudflare R2
- AI: Gemini for lyrics and covers, WAN 1.5 for audio

## Local Development

1. Copy env templates:
   - `cp app/.env.example app/.env.local`
   - `cp backend/.env.example backend/.env`
2. Fill in your secrets.
3. Start infra:
   - `docker compose up -d postgres redis`
4. Install dependencies:
   - in `app/`: `npm install`
   - in `backend/`: `npm install`
5. Generate Prisma client and run migrations:
   - in `backend/`: `npx prisma generate`
   - in `backend/`: `npx prisma migrate dev`
6. Start the backend:
   - in `backend/`: `npm run start:dev`
7. Start the frontend:
   - in `app/`: `npm run dev`

## What I Still Need From You

To make the app truly functional against real services, you need to provide these:

- Clerk
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- Gemini
  - `GEMINI_API_KEY`
- WAN / Wavespeed
  - `WAN_API_KEY`
- Cloudflare R2
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `R2_ENDPOINT`
  - `R2_PUBLIC_BASE_URL`
- Payments provider
  - webhook signing secret for `PAYMENTS_WEBHOOK_SECRET`

## Current State

- Frontend auth is scaffolded with Clerk middleware and provider.
- Frontend generation routes now proxy to the Nest backend.
- Backend has the generation session model, queue orchestration, workers, refund logic, and publishing rules.
- Docker Compose is included for local Postgres and Redis.

## Important Note

I could not run dependency installs or a full build in this environment, so the implementation is in place but still needs one real install-and-verify pass on your machine with actual secrets.

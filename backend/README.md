# Dhun Backend

Production-oriented NestJS backend for Dhun's multi-step generation pipeline.

## Folder Structure

```text
backend/
  prisma/
    schema.prisma
  src/
    auth/
      auth.module.ts
      clerk-auth.guard.ts
    common/
      config/
      decorators/
      interfaces/
    modules/
      community/
      generate/
      payments/
      songs/
      users/
    prisma/
    providers/
      clerk/
      gemini/
      r2/
      wan/
    queues/
      orchestrator/
      queue.constants.ts
      queue.module.ts
    workers/
      audio/
      cover/
    app.module.ts
    main.ts
```

## Core Flow

1. `POST /api/generate/dedicate`
2. Clerk user is validated
3. Coins are debited in the same database transaction that creates the generation session
4. Orchestrator job calls Gemini for 3 lyric variants plus tags and cover prompts
5. Three audio jobs and three cover jobs are enqueued in parallel
6. Cover jobs usually finish first, so `GET /api/generate/session/:id` can return posters before audio
7. Audio jobs upload final assets to R2 and mark the session complete when all variants are ready
8. If the whole generation fails, coins are refunded exactly once

## API Surface

- `POST /api/generate/dedicate`
- `GET /api/generate/session/:id`
- `POST /api/songs/publish`
- `GET /api/community/feed`
- `POST /api/payments/webhook`

## Infra Notes

- PostgreSQL holds source of truth for users, sessions, songs, transactions, and shares
- Redis + BullMQ handle orchestration, retries, and worker concurrency
- R2 stores durable audio and image assets
- Clerk secures every non-public endpoint
- Frontend should poll the session endpoint for progressive delivery

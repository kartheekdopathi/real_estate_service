# Activity Review Log

Use this file to share your development activities. Missing items will be added to the plan and tracker.

## How to submit
Add entries in this format:

- Date:
- Activity:
- Files changed:
- Result:
- Blockers (if any):
- Next step:

## Review Workflow
1. You add your activity.
2. I review it.
3. I update missing parts in:
   - docs/TASKS.md
   - docs/WORK_TRACK.md
   - docs/DECISIONS.md (if architecture decisions are needed)

## Entries

### 2026-03-11
- Date: 2026-03-11
- Activity: Initial UI setup and phase-0 base setup completed.
- Files changed: web/*, docs/*
- Result: Landing page live; Prisma/env/hooks configured.
- Blockers (if any): None
- Next step: Start authentication module skeleton.

### 2026-03-11 (Location Service)
- Date: 2026-03-11
- Activity: Started location-based property discovery for buy/rent/agent workflow.
- Files changed: web/prisma/schema.prisma, web/src/app/api/properties/nearby/route.ts, web/src/lib/geo.ts, docs/*
- Result: Nearby REST API foundation created with distance filtering.
- Blockers (if any): Need DB migration run once PostgreSQL is connected.
- Next step: Add map UI + geocoding integration.

### 2026-03-11 (Auth + Property Types + Posting)
- Date: 2026-03-11
- Activity: Prepared database and REST APIs for signup/login and buy/rent property posting with type catalog.
- Files changed: web/prisma/schema.prisma, web/prisma/seed.js, web/src/app/api/auth/*, web/src/app/api/properties/route.ts, web/src/app/api/property-types/route.ts, web/src/lib/auth.ts, web/src/lib/server-auth.ts, docs/*
- Result: Core auth and property posting foundation is ready.
- Blockers (if any): Need PostgreSQL running locally to execute `db:push` + `db:seed`.
- Next step: Build UI forms for signup/login/post-property and map-based search.

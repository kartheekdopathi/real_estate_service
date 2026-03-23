# Real Estate Service

This repository is prepared for a full real estate platform using **Next.js + Node.js**.

## Current stack (planned)
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Node.js runtime via Next.js Route Handlers (phase 1), optional dedicated API service in phase 2
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth
- Storage: Cloudinary or S3 for property images
- Payments (optional): Stripe

## Project status
This repo now includes implementation documentation and a task tracker:
- Product requirements: `docs/PRD.md`
- Architecture: `docs/ARCHITECTURE.md`
- API plan: `docs/API_SPEC.md`
- Setup guide: `docs/SETUP.md`
- Task board: `docs/TASKS.md`
- Decision log: `docs/DECISIONS.md`
- Work history tracker: `docs/WORK_TRACK.md`
- Activity review input: `docs/ACTIVITY_REVIEW.md`

## Workspace layout
- `web/` → Next.js application (TypeScript + Tailwind + App Router)
- `docs/` → planning, architecture, API, and execution tracking docs

## Run locally
1. `cd web`
2. `npm run dev`
3. Open `http://localhost:3000`

## Database/Auth quick commands
- `npm --prefix web run db:generate`
- `npm --prefix web run db:push`
- `npm --prefix web run db:seed`

Implemented foundation includes:
- Auth APIs: signup, login, me, logout
- Property type catalog API
- Property list + post API for buy/rent flows
- Nearby location API

## Key note
Yes, you can use Next.js and Node.js together in the same application. Next.js server APIs run on Node.js runtime.

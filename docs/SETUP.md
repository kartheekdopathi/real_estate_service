# Setup Guide (Planned)

## Prerequisites
- Node.js 20+
- npm/pnpm
- PostgreSQL 15+

## Environment variables (example)
- DATABASE_URL=
- NEXTAUTH_SECRET=
- NEXTAUTH_URL=
- MEDIA_PROVIDER=cloudinary
- JOB_DRIVER=redis
- CLOUDINARY_CLOUD_NAME=
- CLOUDINARY_API_KEY=
- CLOUDINARY_API_SECRET=
- MEDIA_WEBHOOK_SECRET=
- REDIS_URL=

### Optional (local media mode)
- MEDIA_PROVIDER=minio
- MINIO_ENDPOINT=
- MINIO_ACCESS_KEY=
- MINIO_SECRET_KEY=
- MINIO_BUCKET=

### Optional (no-Redis local mode)
- JOB_DRIVER=inmemory

## Initial install commands (to run once app is scaffolded)
1. Initialize app
2. Install dependencies
3. Create Prisma schema and run migrations
4. Seed basic roles/users (optional)

## Local DB bootstrap (current)
1. Copy `.env.example` to `.env` in `web/`
2. Set `DATABASE_URL` and `AUTH_JWT_SECRET`
3. Run `npm --prefix web run db:generate`
4. Run `npm --prefix web run db:push`
5. Run `npm --prefix web run db:seed`

This seeds master property types such as building, plot/land, apartment/flat, house, villa, office, and shop.

## Notes
Detailed runnable commands will be added after scaffolding codebase.

# Architecture

## High-Level
- **Client/UI**: Next.js App Router pages/components
- **Server/API**: Next.js Route Handlers (Node runtime)
- **Data layer**: Prisma Client + PostgreSQL
- **Media**: Cloudinary/S3
- **Auth**: NextAuth sessions/JWT

## Media Upload & Processing (future-ready)
- **Upload pattern**: Direct-to-cloud uploads with signed URLs (avoid proxying large files through app server)
- **Images**:
	- Auto resize and generate variants (thumbnail, card, detail, original)
	- Convert to modern formats (WebP/AVIF where supported)
	- Strip metadata and optimize quality/compression
- **Videos**:
	- Transcode to HLS/MP4 renditions (360p/720p/1080p)
	- Generate poster/preview thumbnails
	- Optional moderation scan and duration/size validation
- **Processing model**:
	- Async jobs/queue for heavy processing (BullMQ + Redis or cloud-native processing)
	- Webhooks/callbacks update media processing status in DB
- **Delivery**:
	- CDN-backed URLs
	- Signed/private URLs for protected media if required

## Local + Cloud Flexibility Strategy
- **Stable REST contract**: Keep same endpoints in all environments:
	- `POST /api/media/upload-signature`
	- `POST /api/media/webhook`
	- `GET /api/media/:id/status`
- **Provider abstraction**:
	- Create a `MediaProvider` interface (`signUpload()`, `normalizeWebhook()`, `getAssetStatus()`)
	- Implement providers: `CloudinaryProvider` (cloud), `MinioProvider` or local filesystem adapter (local dev)
- **Runtime switch**:
	- Use env var `MEDIA_PROVIDER=cloudinary|minio|local`
	- Business logic should not depend on provider-specific SDK details
- **Queue abstraction**:
	- `JOB_DRIVER=redis|inmemory` to run without Redis locally if needed
- **Result**:
	- Same API behavior locally and in production, only infra/provider config changes

## Modules
1. Auth Module
2. Users & Roles Module
3. Properties Module
4. Search Module
5. Favorites Module
6. Inquiries Module
7. Admin Module

## Data Entities (initial)
- User(id, name, email, passwordHash, role, createdAt)
- Property(id, agentId, title, description, price, city, address, beds, baths, areaSqft, status, createdAt)
- PropertyImage(id, propertyId, url, order)
- Favorite(id, userId, propertyId)
- Inquiry(id, propertyId, userId, message, contactPhone, createdAt)

## Data Entities (media extension)
- PropertyVideo(id, propertyId, assetId, playbackUrl, posterUrl, durationSec, status, createdAt)
- MediaAsset(id, ownerId, kind, provider, publicId, originalUrl, bytes, mimeType, status, createdAt)

## Deployment (target)
- Web/API: Vercel or VPS
- DB: Neon/Supabase PostgreSQL or self-hosted PostgreSQL
- Media: Cloudinary

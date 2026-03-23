# Implementation Tasks

Tracking history is maintained in `docs/WORK_TRACK.md`.

## Phase 0 - Setup
- [x] Initialize Next.js app with TypeScript and Tailwind
- [x] Install Prisma and configure PostgreSQL connection
- [x] Add ESLint/Prettier and commit hooks
- [x] Create environment files and validation

## Phase 1 - Authentication
- [x] Implement register/login/logout
- [ ] Add role-based middleware/guards
- [ ] Create profile page and session UI state

## Phase 2 - Property Management
- [x] Create DB schema for properties and images
- [ ] Build agent dashboard for CRUD listings
- [ ] Add upload flow for property images
- [x] Add DB schema for videos and media status
- [ ] Implement direct-to-cloud signed upload flow
- [ ] Add async media processing webhook handlers
- [x] Add property type master catalog (building/plot/flat/etc.)
- [x] Add API for agent property posting (buy/rent)

## Phase 3 - Search & Discovery
- [ ] Build listing page with filters and pagination
- [ ] Implement server-side filter APIs
- [ ] Add map/location visualization
- [x] Add location-based nearby REST endpoint foundation
- [ ] Add geocoding/reverse-geocoding integration
- [ ] Add buy/rent mode switch tied to location search
- [ ] Add agent location input (pin + lat/lng validation)

## Phase 4 - Buyer Features
- [ ] Favorites save/remove flows
- [ ] Inquiry/contact message flow

## Phase 5 - Admin
- [ ] Admin dashboard
- [ ] Listing moderation actions
- [ ] User management basics

## Phase 6 - Production Readiness
- [ ] Logging + error handling
- [ ] Security checks and rate limiting
- [ ] SEO metadata and sitemap
- [ ] Deployment pipeline

## Phase 7 - Media Processing
- [ ] Image transformation presets (thumb/card/detail/original)
- [ ] Video transcoding presets (360p/720p/1080p)
- [ ] Generate video posters and preview frames
- [ ] Add media moderation/validation rules
- [ ] Add retry strategy for failed processing jobs

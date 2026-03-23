# Work Track Log

This file keeps execution history for implementation.

## Status Legend
- TODO = not started
- IN_PROGRESS = currently being worked
- DONE = completed
- BLOCKED = needs dependency/decision

## Timeline

### 2026-03-11
1. **TASK-0001** — Setup Next.js app bootstrap — **DONE**
   - Created Next.js app in [web](../web)
   - Stack: TypeScript, Tailwind CSS, App Router, ESLint
2. **TASK-0002** — Create initial beautiful landing layout — **DONE**
   - Updated hero and dashboard-style metrics UI
   - Updated metadata and global base styles
3. **TASK-0003** — Create historical task tracking document — **DONE**
   - Added this file for ongoing progress history
4. **TASK-0004** — Install Prisma and configure PostgreSQL — **DONE**
   - Installed `prisma` + `@prisma/client`
   - Initialized Prisma config and created starter schema models
   - Added Prisma client helper in `web/src/lib/prisma.ts`
5. **TASK-0005** — Add environment validation and base `.env.example` — **DONE**
   - Added `zod`-based env validation utility in `web/src/lib/env.ts`
   - Added `web/.env.example` with local/cloud media variables
6. **TASK-0006** — Add Prettier + commit hooks — **DONE**
   - Installed `prettier`, `husky`, `lint-staged`
   - Added `.prettierrc`, `.prettierignore`
   - Configured pre-commit hook and lint-staged rules
7. **TASK-0010** — Location-based service foundation (buy/rent) — **DONE**
   - Extended Prisma `Property` model with `listingType`, `latitude`, `longitude`
   - Added nearby search API at `web/src/app/api/properties/nearby/route.ts`
   - Added geo helper utility `web/src/lib/geo.ts` (Haversine distance)
   - Updated PRD/API/TASKS docs for location-service scope
8. **TASK-0011** — Authentication DB + API foundation — **DONE**
   - Added auth helpers (`bcryptjs` + JWT) and cookie session token
   - Added APIs: signup, login, me, logout
   - Extended user schema with phone and agent profile
9. **TASK-0012** — Property type master + posting API foundation — **DONE**
   - Added `PropertyType` model and relation on `Property`
   - Added type list API: `GET /api/property-types`
   - Added posting/listing API: `GET/POST /api/properties` with BUY/RENT + type filters
   - Added seed script for property types (building/plot/flat/etc.)
10. **TASK-0016** — Local DB push attempt — **BLOCKED**
   - Ran `db:push` and Prisma could not reach DB host from current `.env` URL
   - Requires local PostgreSQL running and correct `DATABASE_URL`

### 2026-03-12
11. **TASK-0018** — Switch database from PostgreSQL to MariaDB (XAMPP) — **DONE**
    - Updated `DATABASE_URL` to `mysql://root:@localhost:3306/real_estate_service`
    - Installed `@prisma/adapter-mariadb` and updated `prisma.config.ts`
    - Ran `db:push` + `db:seed` successfully against MariaDB 10.4
    - Removed all `mode: "insensitive"` from Prisma `contains` filters (not supported on MySQL)
12. **TASK-0019** — Agent property detail page — section inline edit — **DONE**
    - Added section-wise inline edit for: Overview, Pricing & Status, Location, Contact
    - Each section has independent Save / Cancel buttons
    - Fixed media disappearing after section save: PATCH response now includes `images` + `videos`
    - Implemented in: `web/src/app/agent/properties/[id]/page.tsx`, `web/src/app/api/properties/[id]/route.ts`
13. **TASK-0020** — Agent property detail page — beds/baths/areaSqft + type display — **DONE**
    - Added `beds`, `baths`, `areaSqft` to `PropertyDetails` type and `SectionDraft` type
    - Inline edit for Pricing & Status section now includes beds, baths, area (sqft) inputs
    - View mode conditionally shows beds, baths, area when not null
    - Property `type.name` now shown in the Overview section view
    - Implemented in: `web/src/app/agent/properties/[id]/page.tsx`
14. **TASK-0021** — Agent property edit page — beds/baths/areaSqft fields — **DONE**
    - Added `beds`, `baths`, `areaSqft` to `FormState`, initial state, API load, and `onSubmit` payload
    - Added Beds / Baths / Area (sqft) input fields to the edit form JSX
    - Implemented in: `web/src/app/agent/properties/[id]/edit/page.tsx`
15. **TASK-0022** — Listings page — smart card navigation — **DONE**
    - Property cards clickable; navigates to view page
    - Owners/admins route to `/agent/properties/{id}`, others to `/properties/{id}`
    - Action buttons (View/Edit/Delete/Reveal) use `stopPropagation`
    - Implemented in: `web/src/app/properties/page.tsx`
16. **TASK-0023** — Buyer property detail page — **DONE**
    - Created `/properties/[id]/page.tsx` (buyer-facing, read-only)
    - Unauthenticated users redirected to `/login?next=...`
    - Media gallery with zoom, prev/next arrows, thumbnail strip
    - Shows Overview, Pricing & Status, Location, Contact sections (read-only)
    - Implemented in: `web/src/app/properties/[id]/page.tsx`
17. **TASK-0024** — Global keyword search + infinite scroll — **DONE**
    - Added `q` param to `GET /api/properties` (search across title/description/city/address)
    - Replaced classic pagination with `IntersectionObserver` infinite scroll
    - Minimum 3-character guard added in both UI and API
    - Implemented in: `web/src/app/properties/page.tsx`, `web/src/app/api/properties/route.ts`
18. **TASK-0025** — Semantic search mode (heuristic) — **DONE**
    - `TOKEN_EXPANSION` dictionary + `expandedTokens()` for token expansion
    - `semanticScore()` heuristic relevance scoring on up to 300 candidates
    - UI mode selector dropdown + badge indicator added
    - No external LLM used; entirely in-app heuristic scoring
    - Implemented in: `web/src/app/api/properties/route.ts`, `web/src/app/properties/page.tsx`
19. **TASK-0029** — Buyer property contact reveal enforcement — **DONE**
   - Buyer property detail page now hides contact details by default
   - Added reveal flow via `POST /api/properties/[id]/reveal-contact`
   - Shows remaining lead credits after reveal
   - Implemented in: `web/src/app/properties/[id]/page.tsx`
20. **TASK-0030** — Featured listing UX completion — **DONE**
   - Added `isFeatured` usage in listings cards and visible ⭐ Featured badge
   - Listings API already sorted featured-first (`isFeatured desc`) and is now reflected in UI
   - Implemented in: `web/src/app/properties/page.tsx`, `web/src/app/api/properties/route.ts`
21. **TASK-0031** — Admin monetization controls (plan + credits) — **DONE**
   - Admin users page now supports changing `subscriptionPlan` (FREE/PRO/PREMIUM)
   - Admin can increment/decrement user lead credits directly
   - Added PATCH support for `subscriptionPlan`, `subscriptionDays`, `leadCredits`, `leadCreditsDelta`
   - Implemented in: `web/src/app/admin/users/page.tsx`, `web/src/app/api/admin/users/[id]/route.ts`
22. **TASK-0032** — Admin users API MariaDB compatibility fix — **DONE**
   - Removed Prisma `mode: "insensitive"` usage from admin user search filters
   - Expanded list API response with subscription and lead credit fields for admin UI
   - Implemented in: `web/src/app/api/admin/users/route.ts`
23. **TASK-0034** — Internal company users: permanent free full-access exemption — **DONE**
   - Added `User.isInternal` flag for billing/subscription exemption
   - Featured-listing plan gate now bypasses subscription check for internal users
   - Contact reveal no longer deducts lead credits for internal users
   - Admin users page now includes Internal toggle for per-user approval
   - Implemented in: `web/prisma/schema.prisma`, `web/src/app/api/properties/[id]/route.ts`, `web/src/app/api/properties/[id]/reveal-contact/route.ts`, `web/src/app/admin/users/page.tsx`, `web/src/app/api/admin/users/[id]/route.ts`

### 2026-03-13
24. **TASK-0035** — Filter reset/refresh controls across pages — **DONE**
   - Added reset (`⟲`) and refresh (`↻`) actions with `reloadKey` pattern in public and admin filter forms
   - Implemented in: `web/src/app/properties/page.tsx`, `web/src/app/admin/users/page.tsx`, `web/src/app/admin/roles/page.tsx`, `web/src/app/admin/property-types/page.tsx`, `web/src/app/admin/menus/page.tsx`, `web/src/app/admin/permissions/page.tsx`
25. **TASK-0036** — Admin properties page and API restoration — **DONE**
   - Fixed missing `/admin/properties` page (404)
   - Added admin properties list API with search/city/status/listingType filters
   - Implemented in: `web/src/app/admin/properties/page.tsx`, `web/src/app/api/admin/properties/route.ts`
26. **TASK-0037** — Global UI motion system (buttons, menu, page transitions, loader) — **DONE**
   - Added global animation keyframes and button hover effects
   - Added animated menu links and route-level page transition wrapper
   - Added branded real-estate loader + route `loading.tsx`
   - Implemented in: `web/src/app/globals.css`, `web/src/components/Navbar.tsx`, `web/src/components/PageTransition.tsx`, `web/src/components/RealEstateLoader.tsx`, `web/src/app/loading.tsx`, `web/src/app/layout.tsx`, `web/src/app/admin/layout.tsx`
27. **TASK-0038** — Property view section animations + media popup alignment — **DONE**
   - Added staggered section entrance + hover in/out effects on buyer/agent property detail pages
   - Updated zoom modal alignment to top-center with scroll support
   - Implemented in: `web/src/app/globals.css`, `web/src/app/properties/[id]/page.tsx`, `web/src/app/agent/properties/[id]/page.tsx`
28. **TASK-0039** — Featured discovery and admin featured control enhancements — **DONE**
   - Added Featured section on home page and Featured navigation tab
   - Added `featured=true` API/listing filter support
   - Added admin toggle action to feature/unfeature from admin properties table
   - Implemented in: `web/src/app/page.tsx`, `web/src/components/Navbar.tsx`, `web/src/app/api/properties/route.ts`, `web/src/app/properties/page.tsx`, `web/src/app/admin/properties/page.tsx`
29. **TASK-0040** — Admin filter UI redesign consistency pass — **DONE**
   - Refined filter/search/create layouts into labeled card-style sections across admin pages
   - Implemented in: `web/src/app/admin/property-types/page.tsx`, `web/src/app/admin/users/page.tsx`, `web/src/app/admin/roles/page.tsx`, `web/src/app/admin/menus/page.tsx`, `web/src/app/admin/permissions/page.tsx`, `web/src/app/admin/properties/page.tsx`
30. **TASK-0041** — GCP GitHub CI/CD documentation + deployment scaffolding — **DONE**
   - Added complete step-by-step serverless deployment guide for Cloud Run + Cloud Build + GitHub trigger
   - Added deployment files: `web/Dockerfile` and root `cloudbuild.yaml`
   - Implemented in: `docs/GCP_GITHUB_CICD_DEPLOYMENT.md`, `web/Dockerfile`, `cloudbuild.yaml`
31. **TASK-0042** — Test coverage baseline setup and CI quality gate — **DONE**
   - Added Vitest + V8 coverage tooling and scripts (`test`, `test:watch`, `coverage`)
   - Added baseline unit tests for auth, property ID token, and geo utilities
   - Added lint/typecheck/test/coverage checks to Cloud Build pipeline before deploy
   - Implemented in: `web/package.json`, `web/vitest.config.ts`, `web/src/lib/auth.test.ts`, `web/src/lib/property-id-token.test.ts`, `web/src/lib/geo.test.ts`, `cloudbuild.yaml`
32. **TASK-0043** — Admin properties filter/action UI polish — **DONE**
   - Improved admin properties filter button spacing and grouped reset/refresh controls for cleaner layout
   - Added animated row action buttons for View, Edit, and Delete in the admin properties listing
   - Implemented in: `web/src/app/admin/properties/page.tsx`
33. **TASK-0044** — YouTube-backed property video integration scaffold — **DONE**
   - Added provider-aware property video support with `local` and `youtube` modes
   - Added YouTube upload/delete helper module, env placeholders, and provider-aware video rendering with iframe embeds
   - Updated property video upload API and buyer/agent property pages to support YouTube-hosted videos while preserving local fallback
   - Added integration guide documentation for setup and rollout
   - Implemented in: `web/prisma/schema.prisma`, `web/.env.example`, `web/src/lib/env.ts`, `web/src/lib/youtube.ts`, `web/src/lib/property-video.ts`, `web/src/app/api/properties/[id]/videos/route.ts`, `web/src/app/properties/[id]/page.tsx`, `web/src/app/agent/properties/[id]/page.tsx`, `web/src/app/agent/properties/[id]/edit/page.tsx`, `docs/YOUTUBE_PROPERTY_VIDEO_INTEGRATION.md`

### 2026-03-13 (continued)
35. **TASK-0045** — Contact Us page + Admin enquiry management — **DONE**
   - Added `ContactEnquiry` Prisma model (name, email, phone, subject, message, isRead, status)
   - Created public `/contact` page with enquiry form and customer care info (toll-free, mobile numbers, support emails)
   - Created `POST /api/contact` public API route for form submissions
   - Created `GET /api/admin/enquiries` + `PATCH /api/admin/enquiries/[id]` + `DELETE /api/admin/enquiries/[id]` admin-protected API routes
   - Created `/admin/enquiries` page with unread badge, status filter tabs (all/new/read/resolved), expandable rows, mark resolved, reopen, reply-by-email, call link, archive actions
   - Added live unread count badge on "Enquiries" sidebar item in admin layout
   - Added "Contact Us" link to public Navbar
   - Implemented in: `web/prisma/schema.prisma`, `web/src/app/contact/page.tsx`, `web/src/app/api/contact/route.ts`, `web/src/app/api/admin/enquiries/route.ts`, `web/src/app/api/admin/enquiries/[id]/route.ts`, `web/src/app/admin/enquiries/page.tsx`, `web/src/components/Navbar.tsx`, `web/src/app/admin/layout.tsx`

## Active Work Queue
1. **TASK-0013** — Add map-based search UI (buy/rent toggle) — **TODO**
2. **TASK-0014** — Add geocoding provider integration — **TODO**
3. **TASK-0026** — Real LLM integration: vector semantic search (`searchMode=llm`) — **TODO**
4. **TASK-0027** — AI description writer for agent property post/edit — **TODO**
5. **TASK-0028** — Buyer lead credits policy decision (pricing policy only) — **TODO**
6. **TASK-0033** — Replace demo monetization checkout with real payment gateway flow — **TODO**

## How to Update
- Add new entries in **Timeline** with date.
- Move items in **Active Work Queue** through TODO → IN_PROGRESS → DONE.
- Keep item IDs stable for future references.

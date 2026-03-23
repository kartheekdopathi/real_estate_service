# 🏠 Real Estate Service — Application Overview

> **Last updated:** March 12, 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Modules & Features](#2-core-modules--features)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Customer Self-Service Support](#4-customer-self-service-support)
5. [Technological Infrastructure](#5-technological-infrastructure)
6. [Hosting Solutions](#6-hosting-solutions)
7. [Future Enhancements](#7-future-enhancements)
8. [Documentation](#8-documentation)
9. [Testing](#9-testing)
10. [Current Implementation & LLM Status](#10-current-implementation--llm-status)

---

## 1. Product Overview

**Real Estate Service** is a full-stack web platform that connects property buyers, renters, and agents. It enables agents to list residential and commercial properties with rich media (images, videos, GPS coordinates), and allows buyers to browse, favorite, and inquire about listings. A powerful back-office admin panel manages all platform data, users, roles, permissions, and navigation menus.

**Core purpose:**
- Agents list and manage properties for sale or rent
- Buyers discover properties and submit inquiries
- Admins govern the entire platform with fine-grained access control

**Repository layout:**
```
real_estate_service/
├── web/        → Next.js application (TypeScript + Tailwind + App Router)
└── docs/       → Planning, architecture, API, and execution tracking docs
```

---

## 2. Core Modules & Features

### 🔐 Authentication
- JWT-based authentication using the `jose` library
- Token stored as an `httpOnly` cookie (`res_token`) with a 7-day expiry
- Passwords hashed with `bcryptjs` (cost factor 12)
- Endpoints: `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/me`, `POST /api/auth/logout`

### 🏘️ Property Management
- Properties are listed with: title, description, price, city, address, GPS coordinates (latitude/longitude), beds, baths, area (sqft), listing type (`BUY` / `RENT`), status (`DRAFT` / `PUBLISHED` / `ARCHIVED`)
- Flexible type system: Apartment/Flat, House, Villa, Building, Plot/Land, Office, Shop, Warehouse, Farm Land
- Per-property-type dynamic extra fields stored as JSON in `metadataRaw`
- EXIF GPS auto-extraction from uploaded images to auto-fill coordinates
- Listings support global keyword search and semantic-like ranking mode (`searchMode=keyword|semantic`)
- Listings page uses infinite scroll auto-loading (replaces classic pagination UX)
- Performance guard: global search is applied only when query length is **3+ characters**
- Endpoints: `GET/POST /api/properties`, `GET /api/properties/nearby`

### 📸 Media Uploads
- **Images**: Up to 3 images per property, max 5 MB each, formats: JPEG / PNG / WebP
- **Videos**: 1 video per property, max 200 MB, max 120 seconds, formats: MP4 / WebM / MOV
- Files saved to `web/public/uploads/properties/{id}/`
- Endpoints: `POST /api/properties/[id]/images`, `POST /api/properties/[id]/videos`

### ⭐ Favorites & Inquiries
- Users can save favorite properties (`Favorite` model, unique per user+property)
- Users can send inquiry messages with optional contact phone (`Inquiry` model)

### 🛠️ Admin Panel
- Full CRUD for: Users, Roles, Property Types, Menus, Permissions
- Permission matrix management per role and per user (overrides)
- Menu access management per role and per user (overrides)
- Admin routes all require `ADMIN` role via `requireAdmin()` middleware

### 📍 Nearby Properties
- Query endpoint for geolocation-based property discovery: `GET /api/properties/nearby`

---

## 3. User Roles & Access Control

### Roles (seeded defaults)

| Role | Description |
|------|-------------|
| `ADMIN` | Full platform access — all resources, all actions, all menus |
| `AGENT` | VIEW/CREATE/EDIT own properties; VIEW property types; sees Dashboard, Properties, Property Types menus |
| `BUYER` | VIEW properties and property types; sees Dashboard and Properties menus |

### Permission System

Permissions are a **resource × action matrix**:

| Resource | VIEW | CREATE | EDIT | DELETE |
|----------|------|--------|------|--------|
| `users` | ADMIN | ADMIN | ADMIN | ADMIN |
| `roles` | ADMIN | ADMIN | ADMIN | ADMIN |
| `propertyTypes` | ADMIN/AGENT/BUYER | ADMIN | ADMIN | ADMIN |
| `properties` | ADMIN/AGENT/BUYER | ADMIN/AGENT | ADMIN/AGENT | ADMIN |
| `menus` | ADMIN | ADMIN | ADMIN | ADMIN |
| `permissions` | ADMIN | ADMIN | ADMIN | ADMIN |

- **Role-level** permissions set defaults for all users of that role (`RolePermission`)
- **User-level** permissions override role defaults for individuals (`UserPermission`)
- Access check priority: **user override → role permission → deny**

### Menu Access System
- Menus support **parent/child hierarchy** (`parentId` self-relation)
- Role-level grants (`RoleMenuAccess`) + per-user overrides (`UserMenuAccess`)
- Menus sorted by `sortOrder`

### Seeded Menus

| Key | Title | Path | ADMIN | AGENT | BUYER |
|-----|-------|------|-------|-------|-------|
| `dashboard` | Dashboard | `/admin` | ✅ | ✅ | ✅ |
| `users` | Users | `/admin/users` | ✅ | ❌ | ❌ |
| `roles` | Roles | `/admin/roles` | ✅ | ❌ | ❌ |
| `property-types` | Property Types | `/admin/property-types` | ✅ | ✅ | ❌ |
| `properties` | Properties | `/admin/properties` | ✅ | ✅ | ✅ |
| `menu-settings` | Menu Settings | `/admin/menu-settings` | ✅ | ❌ | ❌ |
| `permission-settings` | Permission Settings | `/admin/permission-settings` | ✅ | ❌ | ❌ |

### JWT Payload
```ts
type AuthTokenPayload = {
  userId: number;  // numeric autoincrement DB id
  role: string;    // "ADMIN" | "AGENT" | "BUYER"
}
```

---

## 4. Customer Self-Service Support

| Feature | Who | How |
|---------|-----|-----|
| Self-registration | Buyers, Agents | `POST /api/auth/signup` — assigned `BUYER` role by default |
| Role upgrade | Agents | Admin upgrades role from BUYER → AGENT |
| Property browsing | Buyers | `GET /api/properties` with filters |
| Favorites | Buyers | Save/unsave properties (unique per user+property) |
| Inquiries | Buyers | Contact agents via inquiry form with optional phone |
| Nearby search | Buyers | `GET /api/properties/nearby` using GPS coordinates |

---

## 5. Technological Infrastructure

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.1.6 |
| **Language** | TypeScript | ^5 |
| **UI Library** | React | 19.2.3 |
| **Styling** | Tailwind CSS + `@tailwindcss/postcss` | ^4 |
| **ORM** | Prisma with `@prisma/adapter-mariadb` | 7.4.2 |
| **Database** | MariaDB 10.4 (MySQL-compatible) | — |
| **Auth** | `jose` (JWT HS256) + `bcryptjs` | ^6 / ^3 |
| **Validation** | `zod` | ^4 |
| **Media/EXIF** | `exifr` | ^7 |
| **Code Quality** | ESLint 9, Prettier 3, Husky + lint-staged | — |

### Database Schema

All 13 models use:
- `id Int @id @default(autoincrement())` — numeric auto-increment PKs
- `active Boolean @default(true)` — soft-delete / disable flag
- `createdAt` / `updatedAt` timestamps

| Model | Purpose |
|-------|---------|
| `Role` | User roles (ADMIN, AGENT, BUYER) |
| `User` | Platform users |
| `AgentProfile` | Extended profile for agents |
| `PropertyType` | Property categories (Apartment, House, etc.) |
| `Property` | Property listings |
| `PropertyImage` | Images per property (max 3) |
| `PropertyVideo` | Video per property (max 1) |
| `Permission` | Resource×action permission definitions |
| `RolePermission` | Default permissions per role |
| `UserPermission` | Per-user permission overrides |
| `Menu` | Navigation menu items (hierarchical) |
| `RoleMenuAccess` | Default menu visibility per role |
| `UserMenuAccess` | Per-user menu visibility overrides |
| `Favorite` | User-saved properties |
| `Inquiry` | Buyer messages to agents |

### Project Structure (`web/`)

```
web/
├── prisma/
│   ├── schema.prisma        # 13-model DB schema
│   ├── prisma.config.ts     # MariaDB adapter config
│   └── seed.mjs             # Seed: roles, types, permissions, menus
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/       # Login page
│   │   │   └── signup/      # Signup page
│   │   ├── admin/           # Admin panel pages
│   │   ├── agent/           # Agent dashboard pages
│   │   ├── dashboard/       # General dashboard
│   │   ├── properties/      # Property listing pages
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── me/route.ts
│   │       │   └── signup/route.ts
│   │       ├── properties/
│   │       │   ├── route.ts
│   │       │   ├── nearby/route.ts
│   │       │   └── [id]/
│   │       │       ├── images/route.ts
│   │       │       └── videos/route.ts
│   │       ├── property-types/route.ts
│   │       ├── roles/route.ts
│   │       └── admin/
│   │           ├── users/route.ts
│   │           ├── users/[id]/route.ts
│   │           ├── roles/route.ts
│   │           ├── roles/[id]/route.ts
│   │           ├── property-types/route.ts
│   │           ├── property-types/[id]/route.ts
│   │           ├── menus/route.ts
│   │           ├── menus/[id]/route.ts
│   │           ├── permissions/route.ts
│   │           └── access/
│   │               ├── roles/[roleId]/permissions/route.ts
│   │               ├── roles/[roleId]/menus/route.ts
│   │               ├── users/[userId]/permissions/route.ts
│   │               └── users/[userId]/menus/route.ts
│   └── lib/
│       ├── auth.ts            # JWT sign/verify, bcrypt helpers
│       ├── server-auth.ts     # getAuthUser() for route handlers
│       ├── access-control.ts  # requireAdmin, hasPermission, getUserMenus
│       └── prisma.ts          # Prisma client singleton
├── public/
│   └── uploads/
│       └── properties/        # Uploaded images & videos per property id
├── sql/
│   └── check_innodb.sql       # DB utility scripts
├── schema.js                  # DB schema reference doc
├── .env                       # Environment variables
├── .env.example               # Environment variable template
├── next.config.ts
├── tailwind.config.*
├── tsconfig.json
└── package.json
```

---

## 6. Hosting Solutions

### Current (Development)

| Component | Setup |
|-----------|-------|
| Web server | XAMPP (Apache) on Windows |
| Database | MariaDB 10.4 via XAMPP |
| App server | Next.js Turbopack dev server |
| DB connection | `mysql://root:@localhost:3306/real_estate_service` |
| File storage | Local filesystem `public/uploads/` |

### Recommended Production Options

| Option | Best For | Notes |
|--------|----------|-------|
| **Vercel** | Next.js hosting | Zero-config, automatic CI/CD, edge functions, free tier |
| **DigitalOcean App Platform** | Full control | Managed Node.js + MariaDB droplet |
| **AWS EC2 + RDS** | Enterprise | Self-managed, scalable, full AWS ecosystem |
| **Railway** | Fast deployment | Managed MariaDB + Next.js in one platform |
| **AWS S3 / Cloudflare R2** | File storage | Replace `public/uploads/` with object storage in production |

---

## 7. Future Enhancements

> For Node.js AI stack options and usage details, see [NODE_AI_LIBRARIES.md](./NODE_AI_LIBRARIES.md).

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Search & Filters** | Full-text search, price range, bedroom count, area filters with pagination |
| 🔴 High | **Map Integration** | Interactive map (Leaflet / Google Maps) using stored GPS coordinates |
| 🔴 High | **Agent Property Management (View/Edit/Delete)** | From agent login, allow listing owner to view own listings, edit details/media, and safely delete or archive properties |
| 🟡 Medium | **Agent Dashboard Analytics** | Listing views, inquiry counts, favorites per property |
| 🟡 Medium | **Email Notifications** | Inquiry alerts to agents, welcome emails via Nodemailer / Resend |
| 🟡 Medium | **Advanced Media** | Video transcoding (FFmpeg), image thumbnails, CDN delivery |
| 🟡 Medium | **Per-Listing Contact Channels** | Add and validate `phone`, `whatsapp`, and `email` fields on each property post with role-based edit permissions |
| 🟡 Medium | **Messaging System** | Real-time chat between buyers and agents (Socket.io / Pusher) |
| 🟡 Medium | **Contact Reveal Monetization** | Hide contact numbers by default and unlock reveal based on plan/payment or lead credit rules |
| 🟡 Medium | **Lead & Revenue Analytics** | Track contact reveals, clicks, inquiry-to-lead conversion, and revenue KPIs per agent/property |
| 🟢 Low | **Property Comparison** | Side-by-side comparison tool for buyers |
| 🟢 Low | **Mortgage Calculator** | Built-in calculator widget on property detail pages |
| 🟢 Low | **Multi-language (i18n)** | `next-intl` for Arabic / English support |
| 🟢 Low | **PWA Support** | Service workers for mobile offline browsing |
| 🟢 Low | **OAuth Login** | Google / Facebook social sign-in via `next-auth` |
| 🟢 Low | **Audit Logs** | Track all admin actions in an audit trail table |
| 🟢 Low | **Report Generation** | PDF exports of property listings and agent reports |

### AI-Powered Enhancements

| Priority | AI Feature | Description |
|----------|------------|-------------|
| 🔴 High | **AI Listing Description Writer** | Auto-generate high-quality listing descriptions from form fields, amenities, and location data |
| 🔴 High | **Semantic Property Search** | Natural-language search like “2-bed near metro under budget” using embeddings + vector search |
| 🟡 Medium | **Buyer Assistant Chatbot** | RAG chatbot to answer buyer questions from listings, policies, and FAQs |
| 🟡 Medium | **Agent Reply Suggestions** | Draft inquiry replies with tone and context controls for faster response time |
| 🟡 Medium | **Image Quality & Caption AI** | Auto-caption images and flag low-quality or missing-angle media uploads |
| 🟢 Low | **Price Suggestion Engine** | Recommend price bands using comparable listings and local trends |
| 🟢 Low | **Auto Translation** | Generate multilingual listing content (EN/AR) while keeping source text |

### Recommended Implementation Order (Revenue-First)

#### Phase 1 — Fast Revenue (Launch first)
1. **Featured Listings (Pay-to-Boost)** ✅ Done
2. **Agent Subscription Plans** (Free / Pro / Premium) ✅ Done *(demo checkout mode currently)*
3. **Contact Reveal / Lead Credits** ✅ Done
4. **Agent Property Management (View/Edit/Delete)** ✅ Done

**Decision status (March 12, 2026):**
- Buyer-side lead credit policy is **deferred for later discussion**.
- Until finalized, keep current implementation as-is and revisit before production pricing launch.
- Decision options to evaluate later:
  1. Keep paid reveal credits for buyers
  2. Free monthly reveal quota, then credits
  3. Free reveal for standard listings, paid reveal only for premium listings

**Primary KPI targets:** paid agents, ARPU, contact reveal count, inquiry conversion.

#### Phase 2 — Growth & Retention
1. **Verified Agent Badge**
2. **Ad Slots / Partner Promotions**
3. **Agent Dashboard + Lead & Revenue Analytics**
4. **Per-Listing Contact Channels** (`phone`, `whatsapp`, `email`)

**Primary KPI targets:** retention rate, repeat purchase rate, lead-to-deal quality.

#### Phase 3 — Advanced Monetization
1. **Commission on Closed Deals**
2. **Background Check / Tenant Verification Integrations**
3. **Agency SaaS / White-label Offering**
4. **Transaction Services** (legal docs, e-sign, escrow)

**Primary KPI targets:** take-rate, enterprise MRR, partner revenue share.

---

## 8. Documentation

### Environment Variables

```env
# web/.env
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service
AUTH_JWT_SECRET=your_strong_secret_here_min_32_chars
NODE_ENV=development
```

### NPM Scripts

```bash
# From web/ directory
npm run dev           # Start dev server (Turbopack) on http://localhost:3000
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint check (fails on warnings)
npm run typecheck     # TypeScript type check (tsc --noEmit)
npm run format        # Prettier format all files
npm run format:check  # Prettier check without writing

# Database
npm run db:push       # Push schema to DB (drops & recreates in dev)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed: 3 roles, 9 types, 24 permissions, 7 menus
npm run db:migrate    # Create migration file (use for production)

# From root / directory
npm --prefix web run db:push
npm --prefix web run db:seed
```

### API Reference

#### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/api/auth/signup` | ❌ | Register — body: `{ email, password, name? }` |
| `POST` | `/api/auth/login` | ❌ | Login — body: `{ email, password }` → sets `res_token` cookie |
| `GET` | `/api/auth/me` | ✅ | Returns current authenticated user + role |
| `POST` | `/api/auth/logout` | ✅ | Clears `res_token` cookie |

#### Properties

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/api/properties` | Optional* | List / search properties |
| `POST` | `/api/properties` | AGENT/ADMIN | Create new property |
| `GET` | `/api/properties/nearby` | ✅ | Find nearby properties by lat/lng |
| `POST` | `/api/properties/[id]/images` | AGENT/ADMIN | Upload images (max 3, 5 MB each, jpg/png/webp) |
| `POST` | `/api/properties/[id]/videos` | AGENT/ADMIN | Upload video (max 200 MB, 120 s, mp4/webm/mov) |

\* `GET /api/properties` is public for normal listing browse; auth is required when using role-specific behavior like `mine=true`.

`GET /api/properties` key query params:
- `q`: global search text (search runs when length is 3+)
- `searchMode`: `keyword` or `semantic`
- `listingType`, `city`, `type`, `minPrice`, `maxPrice`, `beds`, `baths`, `page`, `limit`

#### Public Lookups

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/api/property-types` | ✅ | List all active property types |
| `GET` | `/api/roles` | ✅ | List all active roles |

#### Admin (ADMIN role required for all)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` / `POST` | `/api/admin/users` | List / create users |
| `GET` / `PATCH` / `DELETE` | `/api/admin/users/[id]` | Get / update / delete user |
| `GET` / `POST` | `/api/admin/roles` | List / create roles |
| `GET` / `PATCH` / `DELETE` | `/api/admin/roles/[id]` | Get / update / delete role |
| `GET` / `POST` | `/api/admin/property-types` | List / create property types |
| `GET` / `PATCH` / `DELETE` | `/api/admin/property-types/[id]` | Get / update / delete type |
| `GET` / `POST` | `/api/admin/menus` | List / create menus |
| `GET` / `PATCH` / `DELETE` | `/api/admin/menus/[id]` | Get / update / delete menu |
| `GET` | `/api/admin/permissions` | List all permissions |
| `GET` / `PUT` | `/api/admin/access/roles/[roleId]/permissions` | Get / set role permission matrix |
| `GET` / `PUT` | `/api/admin/access/roles/[roleId]/menus` | Get / set role menu access |
| `GET` / `PUT` | `/api/admin/access/users/[userId]/permissions` | Get / set user permission overrides |
| `GET` / `PUT` | `/api/admin/access/users/[userId]/menus` | Get / set user menu overrides |

### Related Docs in this Folder

| File | Description |
|------|-------------|
| [PRD.md](./PRD.md) | Product Requirements Document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture decisions |
| [API_SPEC.md](./API_SPEC.md) | Detailed API specification |
| [SETUP.md](./SETUP.md) | Local development setup guide |
| [TASKS.md](./TASKS.md) | Feature task board |
| [NODE_AI_LIBRARIES.md](./NODE_AI_LIBRARIES.md) | Node.js AI libraries and integration plan |
| [IMPLEMENTATION_AND_LLM_STATUS.md](./IMPLEMENTATION_AND_LLM_STATUS.md) | Latest implemented features and exact LLM integration status |
| [DECISIONS.md](./DECISIONS.md) | Technical decision log |
| [WORK_TRACK.md](./WORK_TRACK.md) | Work history tracker |

---

## 9. Testing

### Current State
- No automated test suite is implemented yet
- Manual testing performed via browser and PowerShell `Invoke-WebRequest` against the running dev server

### Recommended Testing Strategy

#### Unit Tests — `Vitest` + `@testing-library/react`
- Auth utilities: `hashPassword`, `verifyPassword`, `signAuthToken`, `verifyAuthToken`
- Access control logic: `hasPermission`, `getUserMenus`
- Zod schema validations for all API route inputs

#### Integration / API Tests — `Vitest` + `supertest`
- Auth flow: signup → login → me → logout
- Property CRUD lifecycle: create → update → publish → archive
- Permission enforcement: verify `403` responses for unauthorized role attempts
- Image/video upload validation: file size, type, count limits

#### End-to-End Tests — `Playwright`

| Scenario | Role | Steps |
|----------|------|-------|
| Browse & inquire | BUYER | Browse listings → open detail → submit inquiry |
| Save favorites | BUYER | Browse → favorite → view favorites list |
| Create listing | AGENT | Login → create property → upload images → publish |
| Manage users | ADMIN | Login → users list → change role → verify access |
| Configure permissions | ADMIN | Roles → edit permissions matrix → verify enforcement |

#### Test Database Setup
```bash
# 1. Create a separate test database
mysql -u root -e "CREATE DATABASE real_estate_service_test;"

# 2. Push schema to test DB
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service_test npx prisma db push

# 3. Seed test fixtures
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service_test node prisma/seed.mjs
```

#### Suggested Test Setup Commands
```bash
# Install testing dependencies
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react playwright

# Run unit tests
npx vitest run

# Run E2E tests
npx playwright test
```

---

## 10. Current Implementation & LLM Status

> Snapshot updated: March 12, 2026

### Recently Implemented (Production Code)

| Area | Status | Where Implemented |
|------|--------|-------------------|
| Global keyword search in listings | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx), [web/src/app/api/properties/route.ts](../web/src/app/api/properties/route.ts) |
| Infinite scroll auto-load on listings page | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx) |
| Semantic search mode toggle (`keyword` / `semantic`) | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx), [web/src/app/api/properties/route.ts](../web/src/app/api/properties/route.ts) |
| Search performance guard (min 3 chars) | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx), [web/src/app/api/properties/route.ts](../web/src/app/api/properties/route.ts) |
| Buyer property detail view route | ✅ Implemented | [web/src/app/properties/[id]/page.tsx](../web/src/app/properties/%5Bid%5D/page.tsx) |
| Unauthenticated user redirect to login for buyer property view | ✅ Implemented | [web/src/app/properties/[id]/page.tsx](../web/src/app/properties/%5Bid%5D/page.tsx) |
| Card-click navigation from listings to property view | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx) |
| Featured badge in listings cards (⭐ Featured) | ✅ Implemented | [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx) |
| Buyer property detail contact reveal gating | ✅ Implemented | [web/src/app/properties/[id]/page.tsx](../web/src/app/properties/%5Bid%5D/page.tsx), [web/src/app/api/properties/[id]/reveal-contact/route.ts](../web/src/app/api/properties/%5Bid%5D/reveal-contact/route.ts) |
| Agent property detail — section inline edit (Overview/Pricing/Location/Contact) | ✅ Implemented | [web/src/app/agent/properties/[id]/page.tsx](../web/src/app/agent/properties/%5Bid%5D/page.tsx) |
| Agent property detail — beds, baths, area (sqft) inline edit + view | ✅ Implemented | [web/src/app/agent/properties/[id]/page.tsx](../web/src/app/agent/properties/%5Bid%5D/page.tsx) |
| Agent property detail — property type display in Overview | ✅ Implemented | [web/src/app/agent/properties/[id]/page.tsx](../web/src/app/agent/properties/%5Bid%5D/page.tsx) |
| Agent property edit page — beds, baths, area (sqft) fields | ✅ Implemented | [web/src/app/agent/properties/[id]/edit/page.tsx](../web/src/app/agent/properties/%5Bid%5D/edit/page.tsx) |
| Admin controls for subscription plan + lead credits | ✅ Implemented | [web/src/app/admin/users/page.tsx](../web/src/app/admin/users/page.tsx), [web/src/app/api/admin/users/[id]/route.ts](../web/src/app/api/admin/users/%5Bid%5D/route.ts) |

### LLM Integration Matrix (Current Reality)

| Page / Functionality | Uses External LLM? | Notes |
|----------------------|--------------------|-------|
| Listings global search (`/properties`) | ❌ No | Uses DB filter + token-based semantic scoring, not OpenAI/Gemini/Claude API |
| Semantic search mode (`searchMode=semantic`) | ❌ No | Semantic-like relevance ranking is implemented in application code |
| Property detail pages (`/properties/[id]`, `/agent/properties/[id]`) | ❌ No | Standard data retrieval + UI rendering |
| Contact reveal / lead credits | ❌ No | Rule-based monetization flow |

### Which LLM is Integrated Today?

- **No external LLM provider is integrated yet** in runtime code.
- Current semantic mode is a **non-LLM heuristic relevance engine**.

### Recommended First LLM Integration (Next Step)

1. Add embedding generation for property text (`title`, `description`, `city`, `address`, `type`) at create/update time.
2. Store vectors in a vector store (pgvector / Qdrant / Pinecone).
3. Add `searchMode=llm` endpoint path for vector similarity retrieval + reranking.
4. Keep existing `keyword` and current `semantic` as fallback modes.

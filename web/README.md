# 🏠 Real Estate Service — Application Documentation

---

## 1. Product Overview

**Real Estate Service** is a full-stack web platform that connects property buyers, renters, and agents. It enables agents to list residential and commercial properties with rich media (images, videos, GPS coordinates), and allows buyers to browse, favorite, and inquire about listings. A powerful back-office admin panel manages all platform data, users, roles, permissions, and navigation menus.

**Core purpose:**
- Agents list and manage properties for sale or rent
- Buyers discover properties and submit inquiries
- Admins govern the entire platform with fine-grained access control

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
- Endpoints: `GET/POST /api/properties`, `GET /api/properties/nearby`

### 📸 Media Uploads
- **Images**: Up to 3 images per property, max 5 MB each, formats: JPEG / PNG / WebP
- **Videos**: 1 video per property, max 200 MB, max 120 seconds, formats: MP4 / WebM / MOV
- Files saved to `public/uploads/properties/{id}/`
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
| `AGENT` | Can VIEW/CREATE/EDIT own properties; VIEW property types; sees Dashboard, Properties, Property Types menus |
| `BUYER` | Can VIEW properties and property types; sees Dashboard and Properties menus |

### Permission System
- Permissions are a **resource × action matrix** with resources: `users`, `roles`, `propertyTypes`, `properties`, `menus`, `permissions` and actions: `VIEW`, `CREATE`, `EDIT`, `DELETE`
- **Role-level** permissions set defaults for all users of that role (`RolePermission`)
- **User-level** permissions override role defaults for individuals (`UserPermission`)
- Access check: user override → role permission → deny

### Menu Access System
- Menus support **parent/child hierarchy** (`parentId` self-relation)
- Menu visibility follows the same two-tier override pattern: role-level (`RoleMenuAccess`) + user-level override (`UserMenuAccess`)
- Menus are sorted by `sortOrder`

### JWT Payload
```ts
type AuthTokenPayload = { userId: number; role: string; }
```

---

## 4. Customer Self-Service Support

- **Buyer self-registration** via `POST /api/auth/signup` (assigned `BUYER` role by default)
- **Agent registration** available through signup with role upgrade by admin
- **Property browsing** is available to authenticated buyers
- **Favorites management**: buyers can save and unsave properties
- **Inquiries**: buyers can contact agents directly through the property inquiry form
- **Nearby discovery**: location-aware property search for buyers

---

## 5. Technological Infrastructure

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5, React 19 |
| **ORM** | Prisma 7.4.2 with `@prisma/adapter-mariadb` (binary engine) |
| **Database** | MariaDB 10.4 (MySQL-compatible) |
| **Auth** | `jose` (JWT HS256), `bcryptjs` (password hashing) |
| **Validation** | `zod` ^4 (request body parsing & schema validation) |
| **Styling** | Tailwind CSS v4 with `@tailwindcss/postcss` |
| **Media/EXIF** | `exifr` for GPS coordinate extraction from image EXIF metadata |
| **Code Quality** | ESLint 9, Prettier 3, Husky + lint-staged (pre-commit hooks) |

### Database Schema — Models
`Role` · `User` · `AgentProfile` · `PropertyType` · `Property` · `PropertyImage` · `PropertyVideo` · `Permission` · `RolePermission` · `UserPermission` · `Menu` · `RoleMenuAccess` · `UserMenuAccess` · `Favorite` · `Inquiry`

All models use:
- `id Int @id @default(autoincrement())` — numeric auto-increment primary keys
- `active Boolean @default(true)` — soft-delete / disable flag
- `createdAt` / `updatedAt` timestamps

### Project Structure
```
web/
├── prisma/
│   ├── schema.prisma       # Database schema (13 models)
│   ├── prisma.config.ts    # Prisma config (MariaDB adapter)
│   └── seed.mjs            # Seed: roles, types, permissions, menus
├── src/
│   ├── app/
│   │   ├── (auth)/         # login & signup pages
│   │   ├── admin/          # Admin panel pages
│   │   ├── agent/          # Agent dashboard pages
│   │   ├── dashboard/      # General dashboard
│   │   ├── properties/     # Property listing pages
│   │   └── api/
│   │       ├── auth/       # login, signup, me, logout
│   │       ├── properties/ # CRUD + nearby + images + videos
│   │       ├── property-types/
│   │       └── admin/      # users, roles, menus, permissions, access
│   └── lib/
│       ├── auth.ts          # JWT helpers, bcrypt
│       ├── server-auth.ts   # getAuthUser()
│       ├── access-control.ts # requireAdmin, hasPermission, getUserMenus
│       └── prisma.ts        # Prisma client singleton
├── public/
│   └── uploads/properties/ # Uploaded property images & videos
├── sql/                    # Utility SQL scripts
├── schema.js               # DB schema reference documentation
└── .env                    # Environment variables
```

---

## 6. Hosting Solutions

### Current (Development)
- **XAMPP** (Windows) — Apache + MariaDB 10.4 running locally
- Next.js dev server via `npm run dev` (Turbopack)
- Database: `mysql://root:@localhost:3306/real_estate_service`
- Uploads stored locally in `public/uploads/`

### Recommended Production Options

| Option | Description |
|--------|-------------|
| **Vercel** | Ideal for Next.js — zero-config deployments, edge functions, automatic CI/CD |
| **VPS (DigitalOcean / AWS EC2)** | Self-managed Node.js + MariaDB, full control over environment |
| **Railway / PlanetScale** | Managed MariaDB / MySQL cloud database with Next.js hosting |
| **File Storage** | Replace local `public/uploads/` with AWS S3 / Cloudflare R2 for production media storage |

---

## 7. Future Enhancements

- **Search & Filters** — Full-text search, price range, bedroom count, area filters with pagination
- **Map Integration** — Interactive map view (Leaflet / Google Maps) using stored GPS coordinates
- **Agent Dashboard** — Analytics: listing views, inquiry counts, favorites per property
- **Email Notifications** — Inquiry alerts to agents, welcome emails via Nodemailer / Resend
- **Advanced Media** — Video transcoding pipeline (FFmpeg), image thumbnail generation, CDN delivery
- **Messaging System** — Real-time chat between buyers and agents (Socket.io / Pusher)
- **Property Comparison** — Side-by-side comparison tool for buyers
- **Mortgage Calculator** — Built-in calculator widget on property detail pages
- **Multi-language (i18n)** — `next-intl` for Arabic / English support
- **PWA Support** — Service workers for mobile offline browsing
- **OAuth Login** — Google / Facebook social sign-in via `next-auth`
- **Audit Logs** — Track all admin actions in an audit trail table
- **Report Generation** — PDF exports of property listings and agent reports

---

## 8. Documentation

### Environment Variables

```env
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service
AUTH_JWT_SECRET=your_strong_secret_here
NODE_ENV=development
```

### NPM Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm run format       # Prettier format all files
npm run db:push      # Push schema to DB (no migration history)
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed roles, types, permissions, menus
npm run db:migrate   # Create migration (use for production)
```

### API Endpoints Reference

#### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT cookie |
| GET | `/api/auth/me` | ✅ | Get current authenticated user |
| POST | `/api/auth/logout` | ✅ | Clear auth cookie |

#### Properties

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | ✅ | List / search properties |
| POST | `/api/properties` | AGENT/ADMIN | Create new property |
| GET | `/api/properties/nearby` | ✅ | Find nearby properties by GPS |
| POST | `/api/properties/[id]/images` | AGENT/ADMIN | Upload images (max 3, 5 MB each) |
| POST | `/api/properties/[id]/videos` | AGENT/ADMIN | Upload video (max 200 MB, 120 s) |

#### Admin (ADMIN role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET / POST | `/api/admin/users` | List / create users |
| GET / PATCH / DELETE | `/api/admin/users/[id]` | Manage single user |
| GET / POST | `/api/admin/roles` | List / create roles |
| GET / PATCH / DELETE | `/api/admin/roles/[id]` | Manage single role |
| GET / POST | `/api/admin/property-types` | List / create property types |
| GET / PATCH / DELETE | `/api/admin/property-types/[id]` | Manage single type |
| GET / POST | `/api/admin/menus` | List / create menus |
| GET / PATCH / DELETE | `/api/admin/menus/[id]` | Manage single menu |
| GET | `/api/admin/permissions` | List all permissions |
| GET / PUT | `/api/admin/access/roles/[roleId]/permissions` | Role permission matrix |
| GET / PUT | `/api/admin/access/roles/[roleId]/menus` | Role menu access |
| GET / PUT | `/api/admin/access/users/[userId]/permissions` | User permission overrides |
| GET / PUT | `/api/admin/access/users/[userId]/menus` | User menu overrides |

---

## 9. Testing

### Current State
- No automated test suite is implemented yet
- Manual testing is performed via browser and PowerShell `Invoke-WebRequest` against the running dev server

### Recommended Testing Strategy

#### Unit Tests — `Vitest` + `@testing-library/react`
- Auth utilities: `hashPassword`, `verifyPassword`, `signAuthToken`, `verifyAuthToken`
- Access control logic: `hasPermission`, `getUserMenus`
- Zod schema validations for all API route inputs

#### Integration / API Tests — `Vitest` + `supertest`
- Auth flow: signup → login → me → logout
- Property CRUD lifecycle: create → update → publish → archive
- Permission enforcement: verify 403 responses for unauthorized role attempts
- Image/video upload validation: file size, type, count limits

#### End-to-End Tests — `Playwright`
- **Buyer**: browse properties, add to favorites, submit inquiry
- **Agent**: login, create property, upload images, publish listing
- **Admin**: manage users, assign roles, configure permissions and menus

#### Test Database Setup
```bash
# Create a separate test database
mysql -u root -e "CREATE DATABASE real_estate_service_test;"

# Push schema to test DB
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service_test npx prisma db push

# Seed test fixtures
DATABASE_URL=mysql://root:@localhost:3306/real_estate_service_test node prisma/seed.mjs
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

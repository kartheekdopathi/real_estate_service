# Master Tables Refactoring - Summary

## What Changed

### 1. Database Schema (`prisma/schema.prisma`)

#### Removed
- ❌ `enum Role { BUYER, AGENT, ADMIN }`

#### Added
- ✅ `model Role` - Master table with fields: id, roleName, active, createdAt, updatedAt
- ✅ `User.roleId` - Foreign key to Role table
- ✅ `User.role` - Relationship to Role model
- ✅ `PropertyType.active` - Changed from `isActive` to `active` for consistency

#### Key Changes
```prisma
// BEFORE
model User {
  role: Role @default(BUYER)  // enum
}

// AFTER
model User {
  roleId: String
  role: Role @relation(fields: [roleId], references: [id], onDelete: Restrict)
}
```

---

## 2. Seed File (`prisma/seed.mjs`)

#### Changes
- ✅ Added ROLES array with 3 master roles (BUYER, AGENT, ADMIN)
- ✅ Seeds both roles and property types (idempotent upsert)
- ✅ Updated PropertyType field: `isActive` → `active`

```javascript
const ROLES = [
  { roleName: "BUYER" },
  { roleName: "AGENT" },
  { roleName: "ADMIN" },
];
```

---

## 3. API Endpoints

### Updated: `/api/auth/signup`
```typescript
// BEFORE
const user = await db.user.create({
  data: {
    role: role as Role  // direct enum
  }
});

// AFTER
const roleRecord = await db.role.findUnique({ where: { roleName: role } });
const user = await db.user.create({
  data: {
    roleId: roleRecord.id,  // master table reference
    ...
  },
  include: { role: { select: { roleName } } }
});
```

### Updated: `/api/auth/login`
```typescript
// Includes role relationship to return role.roleName
include: {
  role: { select: { id: true, roleName: true } }
}
```

### Updated: `/api/property-types`
```typescript
// Changed where clause
where: { active: true }  // was isActive: true
```

### New: `/api/roles`
```typescript
// Fetch available roles for signup form
GET /api/roles
// Response: { total: 3, roles: [...] }
```

---

## 4. Utility Functions

### Updated: `src/lib/server-auth.ts`
```typescript
// BEFORE
select: { role: true }  // returned enum string

// AFTER
include: { role: { select: { roleName: true } } }  // returns relationship
```

Returns: `{ id, name, email, role: "BUYER" }` (extracts roleName from relationship)

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Role Management** | Hard-coded enum | Master table - add roles without code changes |
| **Audit Trail** | None | createdAt/updatedAt on role records |
| **Deactivation** | Requires migration | Simple UPDATE query |
| **Performance** | Enum overhead | Indexed lookup on roleName |
| **Scalability** | Cannot add role metadata | Can add permissions, icon URLs, etc. |
| **Admin Control** | No admin UI possible | Can build admin panel for role management |

---

## Migration Steps for Local Database

### Step 1: Backup Current Database
```bash
# Optional but recommended
pg_dump -U postgres real_estate_service > backup.sql
```

### Step 2: Apply New Schema
```bash
npm run db:push
```

This will:
- Create `Role` table
- Alter `User` table to add `roleId` foreign key
- Update `PropertyType` table field name

### Step 3: Seed Master Data
```bash
npm run db:seed
```

This will:
- Insert 3 roles (BUYER, AGENT, ADMIN)
- Insert 9 property types
- Output: "Seeded 3 roles. Seeded 9 property types."

### Step 4: Verify Changes
```bash
npm run lint      # Should pass
npm run typecheck # Should pass
```

---

## Testing the Changes

### Test 1: Signup with New Schema
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "email": "test@example.com",
    "password": "password123",
    "role": "AGENT"
  }'
```

Expected Response:
```json
{
  "user": {
    "id": "...",
    "name": "Test Agent",
    "email": "test@example.com",
    "role": "AGENT",
    "phone": null
  }
}
```

### Test 2: Fetch Available Roles
```bash
curl http://localhost:3000/api/roles
```

Expected Response:
```json
{
  "total": 3,
  "roles": [
    { "id": "...", "roleName": "ADMIN" },
    { "id": "...", "roleName": "AGENT" },
    { "id": "...", "roleName": "BUYER" }
  ]
}
```

### Test 3: Fetch Property Types
```bash
curl http://localhost:3000/api/property-types
```

All 9 property types returned with `active: true`

---

## Code Locations

### Files Modified
1. [web/prisma/schema.prisma](../web/prisma/schema.prisma) - Added Role model, updated User/PropertyType
2. [web/prisma/seed.mjs](../web/prisma/seed.mjs) - Added ROLES seeding
3. [web/src/app/api/auth/signup/route.ts](../web/src/app/api/auth/signup/route.ts) - Use Role lookup
4. [web/src/app/api/auth/login/route.ts](../web/src/app/api/auth/login/route.ts) - Include role relationship
5. [web/src/lib/server-auth.ts](../web/src/lib/server-auth.ts) - Extract role from relationship
6. [web/src/app/api/property-types/route.ts](../web/src/app/api/property-types/route.ts) - Changed `isActive` to `active`

### Files Created
1. [web/src/app/api/roles/route.ts](../web/src/app/api/roles/route.ts) - New endpoint to fetch roles

### Files Documented
1. [docs/MASTER_TABLES.md](./MASTER_TABLES.md) - Comprehensive master table design guide

---

## Next Steps

1. **Configure DATABASE_URL** in `web/.env`
2. **Run** `npm run db:push` to apply schema migration
3. **Run** `npm run db:seed` to populate master data
4. **Test** signup and property posting with master table references
5. **Build UI** forms that fetch from `/api/roles` and `/api/property-types` endpoints

---

## Rollback (If Needed)

If you need to revert to enum-based design:

```bash
# Restore from backup
psql -U postgres real_estate_service < backup.sql

# Or recreate from scratch
npm run db:reset
```

This is why we maintain documentation and keep backups!

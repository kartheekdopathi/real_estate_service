# Master Tables Design

## Overview

The database uses master tables for managing roles and property types. This design provides flexibility, auditability, and makes it easy to manage configuration data without code changes.

## Master Tables

### 1. Role Master Table

**Purpose:** Centralized management of user roles in the system.

**Schema:**
```sql
CREATE TABLE "Role" (
  id        String   @id @default(cuid())
  roleName  String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
)
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Unique primary key |
| roleName | String | Unique role name (e.g., BUYER, AGENT, ADMIN) |
| active | Boolean | Activation flag - only active roles available for signup |
| createdAt | DateTime | Record creation timestamp (automatic) |
| updatedAt | DateTime | Last update timestamp (automatic) |

**Master Data:**
- BUYER
- AGENT
- ADMIN

**Relationships:**
- User.roleId → Role.id (Many-to-One)

**Usage:**
- When creating a user, lookup the role by `roleName` and use `roleId` as foreign key
- When authenticating, return `role.roleName` from role relationship
- Enable/disable roles globally by setting `active = false`

---

### 2. PropertyType Master Table

**Purpose:** Centralized management of property classification categories.

**Schema:**
```sql
CREATE TABLE "PropertyType" (
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
)
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Unique primary key |
| name | String | Display name (e.g., "Apartment / Flat") |
| slug | String | URL-friendly identifier (e.g., "apartment-flat") |
| active | Boolean | Activation flag - only active types shown in UI |
| createdAt | DateTime | Record creation timestamp (automatic) |
| updatedAt | DateTime | Last update timestamp (automatic) |

**Master Data:**
- Apartment / Flat (apartment-flat)
- House (house)
- Villa (villa)
- Building (building)
- Plot / Land (plot-land)
- Office (office)
- Shop (shop)
- Warehouse (warehouse)
- Farm Land (farm-land)

**Relationships:**
- Property.typeId → PropertyType.id (Many-to-One)

**Usage:**
- When posting a property, lookup property type by slug and use `typeId`
- When listing properties, fetch from active property types only
- Show property type name/slug in property detail view
- Admin can manage available types without code changes

---

## API Endpoints

### Fetch Available Roles

**GET** `/api/roles`

**Response:**
```json
{
  "total": 3,
  "roles": [
    { "id": "role_001", "roleName": "ADMIN" },
    { "id": "role_002", "roleName": "AGENT" },
    { "id": "role_003", "roleName": "BUYER" }
  ]
}
```

**Usage:** Display role options in signup form (usually just BUYER and AGENT)

---

### Fetch Available Property Types

**GET** `/api/property-types`

**Response:**
```json
{
  "total": 9,
  "types": [
    { "id": "type_001", "name": "Apartment / Flat", "slug": "apartment-flat" },
    { "id": "type_002", "name": "Building", "slug": "building" },
    { "id": "type_003", "name": "Farm Land", "slug": "farm-land" },
    { "id": "type_004", "name": "House", "slug": "house" },
    { "id": "type_005", "name": "Office", "slug": "office" },
    { "id": "type_006", "name": "Plot / Land", "slug": "plot-land" },
    { "id": "type_007", "name": "Shop", "slug": "shop" },
    { "id": "type_008", "name": "Villa", "slug": "villa" },
    { "id": "type_009", "name": "Warehouse", "slug": "warehouse" }
  ]
}
```

**Usage:** Populate dropdown in property posting form

---

## Data Flow

### User Signup

```
1. User submits signup form with role: "AGENT"
2. API validation checks role is BUYER or AGENT
3. Query: SELECT * FROM Role WHERE roleName = 'AGENT' AND active = true
4. Insert into User with roleId = <role_id>
5. Return user data with role.roleName in response
```

### Property Posting

```
1. Agent submits property form with typeSlug: "apartment-flat"
2. API validation checks typeSlug is valid
3. Query: SELECT * FROM PropertyType WHERE slug = 'apartment-flat' AND active = true
4. Insert into Property with typeId = <type_id>
5. Property automatically inherits type.name in relationship
```

### Fetching Resources

```
When fetching properties:
- Include role information: include: { role: select { roleName } }
- Include type information: include: { type: select { name, slug } }
- Both relationships resolved at query time, no N+1 queries
```

---

## Seeding Master Data

The seed script (`prisma/seed.mjs`) initializes both master tables:

```javascript
// Seed roles
const ROLES = [
  { roleName: "BUYER" },
  { roleName: "AGENT" },
  { roleName: "ADMIN" }
];

// Seed property types
const PROPERTY_TYPES = [
  { name: "Apartment / Flat", slug: "apartment-flat" },
  { name: "House", slug: "house" },
  // ... 7 more types
];
```

**To seed the database:**
```bash
npm run db:seed
```

This will:
1. Upsert all roles (idempotent - safe to run multiple times)
2. Upsert all property types with active = true
3. Log "Seeded X roles" and "Seeded Y property types"

---

## Managing Master Data

### Add a New Property Type

1. Add entry to `PROPERTY_TYPES` array in `prisma/seed.mjs`
2. Run `npm run db:seed`

Example:
```javascript
{ name: "Commercial Space", slug: "commercial-space" },
```

### Deactivate a Role

```sql
UPDATE "Role" SET active = false WHERE "roleName" = 'ADMIN';
```

Admin users stay in system but new signups cannot choose this role.

### Deactivate a Property Type

```sql
UPDATE "PropertyType" SET active = false WHERE slug = 'farm-land';
```

Existing properties keep their type, but new properties cannot use this type.

### Adding a New Role (Advanced)

1. Add to `ROLES` array in seed:
```javascript
{ roleName: "PROPERTY_MANAGER" }
```

2. Run `npm run db:seed`

3. Update signup schema if needed:
```typescript
role: z.enum(["BUYER", "AGENT", "PROPERTY_MANAGER"])
```

---

## Benefits of Master Table Approach

✅ **Flexibility** - Add/deactivate roles and types without code changes or migrations  
✅ **Audit Trail** - createdAt/updatedAt track all changes  
✅ **Performance** - No enum re-deployments, queries are indexed on `active` and `slug`  
✅ **Consistency** - Single source of truth for valid roles and property types  
✅ **Scalability** - Easy to add metadata (e.g., role permissions, type icon URLs) later  
✅ **Admin Control** - Super users can manage master data via future admin panel  

---

## Migration Notes

When migrating from enum-based design:

```bash
# 1. Create migration
npm run db:migrate -- --name convert_roles_to_master_table

# 2. Prisma generates migration file - run it
npm run db:push

# 3. Seed master data
npm run db:seed

# 4. Code updates (already done):
#    - Import from '.prisma/client' not '@prisma/client'
#    - Query include: { role: select { roleName } }
#    - Use role.roleName in templates/responses
```

---

## API Integration Examples

### Signup with Master Table

**Request:**
```json
{
  "name": "John Agent",
  "email": "john@example.com",
  "password": "secure123",
  "role": "AGENT"
}
```

**Backend Processing:**
```typescript
const roleRecord = await db.role.findUnique({ 
  where: { roleName: "AGENT" } 
});
const user = await db.user.create({
  data: {
    name, email, passwordHash,
    roleId: roleRecord.id  // Use master table ID
  },
  include: { role: select { roleName } }
});
// Returns: { id, name, email, role: { roleName: "AGENT" } }
```

### Post Property with Master Table

**Request:**
```json
{
  "typeSlug": "apartment-flat",
  "title": "Modern Apartment",
  "price": 50000,
  ...
}
```

**Backend Processing:**
```typescript
const propertyType = await db.propertyType.findUnique({ 
  where: { slug: "apartment-flat" } 
});
const property = await db.property.create({
  data: {
    title, price, ...,
    typeId: propertyType.id  // Use master table ID
  },
  include: { type: select { name, slug } }
});
// Returns: { id, title, price, type: { name: "Apartment / Flat", slug: "apartment-flat" } }
```

# Functionality and URL Reference

Full reference of all application URLs with request/response samples.

---

## 1) Frontend URLs

### Public
| URL | Description |
|-----|-------------|
| `/` | Landing page with metrics dashboard |

### Admin Dashboard (separate backend section)
| URL | Description |
|-----|-------------|
| `/admin` | Admin dashboard home — summary cards |
| `/admin/users` | User listing, search/filter by role, pagination, change role, delete |
| `/admin/roles` | Role listing, search, pagination, add role, enable/disable, delete |
| `/admin/property-types` | Property type listing, search, pagination, add type, enable/disable, delete |
| `/admin/menus` | Dynamic menu listing, search, pagination, add menu item, enable/disable, delete |
| `/admin/permissions` | Permission catalog with resource/action filter and pagination |
| `/admin/menu-settings` | Assign which menus a role or specific user can see |
| `/admin/permission-settings` | Assign VIEW/CREATE/EDIT/DELETE per role or per user |

---

## 2) Auth API

### POST `/api/auth/signup`
Register a new user (BUYER or AGENT).

**Request**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "+1234567890",
  "role": "AGENT"
}
```

**Response 201**
```json
{
  "user": {
    "id": "clxabc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT",
    "phone": "+1234567890"
  }
}
```

**Error 409** — email already in use
```json
{ "error": "Email already in use" }
```

**Error 400** — invalid role
```json
{ "error": "Invalid role" }
```

---

### POST `/api/auth/login`
Authenticate user and set session cookie.

**Request**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response 200**
```json
{
  "user": {
    "id": "clxabc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT"
  }
}
```

**Error 401**
```json
{ "error": "Invalid credentials" }
```

---

### GET `/api/auth/me`
Return currently authenticated user from session cookie.

**Response 200**
```json
{
  "user": {
    "id": "clxabc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT"
  }
}
```

**Error 401**
```json
{ "error": "Unauthorized" }
```

---

### POST `/api/auth/logout`
Clear session cookie.

**Response 200**
```json
{ "ok": true }
```

---

## 3) Master Data API

### GET `/api/roles`
Returns all active roles for signup dropdown.

**Response 200**
```json
{
  "total": 3,
  "roles": [
    { "id": "role1", "roleName": "ADMIN" },
    { "id": "role2", "roleName": "AGENT" },
    { "id": "role3", "roleName": "BUYER" }
  ]
}
```

---

### GET `/api/property-types`
Returns all active property types for posting/search dropdowns.

**Response 200**
```json
{
  "total": 9,
  "types": [
    { "id": "type1", "name": "Apartment / Flat", "slug": "apartment-flat" },
    { "id": "type2", "name": "House", "slug": "house" },
    { "id": "type3", "name": "Villa", "slug": "villa" },
    { "id": "type4", "name": "Building", "slug": "building" },
    { "id": "type5", "name": "Plot / Land", "slug": "plot-land" },
    { "id": "type6", "name": "Office", "slug": "office" },
    { "id": "type7", "name": "Shop", "slug": "shop" },
    { "id": "type8", "name": "Warehouse", "slug": "warehouse" },
    { "id": "type9", "name": "Farm Land", "slug": "farm-land" }
  ]
}
```

---

## 4) Properties API

### GET `/api/properties`
Public listing with optional filters.

**Query Parameters**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| city | string | `Dubai` | Filter by city |
| listingType | string | `BUY` or `RENT` | Listing purpose |
| type | string | `apartment-flat` | Property type slug |
| minPrice | number | `50000` | Minimum price |
| maxPrice | number | `200000` | Maximum price |
| beds | number | `2` | Minimum bedrooms |
| baths | number | `1` | Minimum bathrooms |
| page | number | `1` | Page number |
| limit | number | `12` | Results per page (max 50) |

**Example Request**
```
GET /api/properties?city=Dubai&listingType=RENT&type=apartment-flat&page=1&limit=10
```

**Response 200**
```json
{
  "total": 45,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": "prop1",
      "title": "Modern Apartment in Dubai Marina",
      "price": "75000.00",
      "beds": 2,
      "baths": 2,
      "areaSqft": 1200,
      "city": "Dubai",
      "address": "Marina Walk, Dubai",
      "listingType": "RENT",
      "status": "PUBLISHED",
      "type": { "id": "type1", "name": "Apartment / Flat", "slug": "apartment-flat" },
      "agent": { "id": "agent1", "name": "John Doe" },
      "images": [{ "id": "img1", "url": "https://cdn.example.com/img.jpg" }]
    }
  ]
}
```

---

### POST `/api/properties`
Create new property listing. Requires AGENT or ADMIN session.

**Request**
```json
{
  "typeSlug": "apartment-flat",
  "listingType": "RENT",
  "title": "Modern Apartment in Dubai Marina",
  "description": "Beautifully furnished 2-bedroom apartment with sea view...",
  "price": 75000,
  "city": "Dubai",
  "address": "Marina Walk, Dubai",
  "latitude": 25.0819,
  "longitude": 55.1367,
  "beds": 2,
  "baths": 2,
  "areaSqft": 1200
}
```

**Response 201**
```json
{
  "property": {
    "id": "prop1",
    "title": "Modern Apartment in Dubai Marina",
    "status": "DRAFT",
    "type": { "id": "type1", "slug": "apartment-flat", "name": "Apartment / Flat" }
  }
}
```

**Error 403** — not AGENT or ADMIN
```json
{ "error": "Forbidden" }
```

---

### GET `/api/properties/nearby`
Find properties near a geographic coordinate.

**Query Parameters**
| Param | Required | Example | Description |
|-------|----------|---------|-------------|
| lat | Yes | `25.0819` | Latitude |
| lng | Yes | `55.1367` | Longitude |
| radiusKm | No | `5` | Search radius in km (default 10) |
| listingType | No | `BUY` | Filter by listing type |
| type | No | `villa` | Filter by property type slug |

**Example Request**
```
GET /api/properties/nearby?lat=25.0819&lng=55.1367&radiusKm=5&listingType=BUY
```

**Response 200**
```json
{
  "total": 8,
  "items": [
    {
      "id": "prop2",
      "title": "Sea View Villa",
      "distanceKm": 1.3,
      "price": "2500000.00",
      "beds": 4,
      "baths": 3,
      "city": "Dubai",
      "type": { "name": "Villa", "slug": "villa" }
    }
  ]
}
```

---

## 5) Admin: Roles API

### GET `/api/admin/roles`
List roles with search/filter/pagination. Admin only.

**Query Parameters**
| Param | Example | Description |
|-------|---------|-------------|
| search | `AGENT` | Filter by role name |
| active | `true` | Filter active/inactive |
| page | `1` | Page number |
| limit | `10` | Per page |

**Response 200**
```json
{
  "total": 3,
  "page": 1,
  "limit": 10,
  "items": [
    { "id": "role1", "roleName": "ADMIN", "active": true, "createdAt": "2026-01-01T00:00:00.000Z" },
    { "id": "role2", "roleName": "AGENT", "active": true, "createdAt": "2026-01-01T00:00:00.000Z" },
    { "id": "role3", "roleName": "BUYER", "active": true, "createdAt": "2026-01-01T00:00:00.000Z" }
  ]
}
```

---

### POST `/api/admin/roles`
Add a new role.

**Request**
```json
{ "roleName": "MANAGER", "active": true }
```

**Response 201**
```json
{
  "role": { "id": "role4", "roleName": "MANAGER", "active": true }
}
```

---

### GET `/api/admin/roles/:id`
View single role with its permissions.

**Response 200**
```json
{
  "role": {
    "id": "role2",
    "roleName": "AGENT",
    "active": true,
    "rolePermissions": [
      { "permissionId": "perm1", "canAccess": true, "permission": { "resource": "properties", "action": "VIEW" } },
      { "permissionId": "perm2", "canAccess": true, "permission": { "resource": "properties", "action": "CREATE" } },
      { "permissionId": "perm3", "canAccess": false, "permission": { "resource": "properties", "action": "DELETE" } }
    ]
  }
}
```

---

### PATCH `/api/admin/roles/:id`
Edit role name or active status.

**Request**
```json
{ "active": false }
```

**Response 200**
```json
{
  "role": { "id": "role4", "roleName": "MANAGER", "active": false }
}
```

---

### DELETE `/api/admin/roles/:id`
Delete role. Blocked if users are assigned to it.

**Response 200**
```json
{ "ok": true }
```

**Error 409** — role in use
```json
{ "error": "Role is assigned to users. Deactivate instead of delete." }
```

---

## 6) Admin: Property Types API

### GET `/api/admin/property-types`
List all property types with search/filter/pagination.

**Query Parameters**
| Param | Example | Description |
|-------|---------|-------------|
| search | `villa` | Filter by name or slug |
| active | `true` | Filter active/inactive |
| page | `1` | Page number |
| limit | `10` | Per page |

**Response 200**
```json
{
  "total": 9,
  "page": 1,
  "limit": 10,
  "items": [
    { "id": "type1", "name": "Apartment / Flat", "slug": "apartment-flat", "active": true },
    { "id": "type2", "name": "Villa", "slug": "villa", "active": true }
  ]
}
```

---

### POST `/api/admin/property-types`
Add a new property type.

**Request**
```json
{ "name": "Penthouse", "slug": "penthouse", "active": true }
```

**Response 201**
```json
{
  "propertyType": { "id": "type10", "name": "Penthouse", "slug": "penthouse", "active": true }
}
```

---

### PATCH `/api/admin/property-types/:id`
Edit property type.

**Request**
```json
{ "name": "Penthouse Suite", "active": false }
```

**Response 200**
```json
{
  "propertyType": { "id": "type10", "name": "Penthouse Suite", "slug": "penthouse", "active": false }
}
```

---

### DELETE `/api/admin/property-types/:id`
Delete property type. Blocked if properties are using it.

**Response 200**
```json
{ "ok": true }
```

**Error 409**
```json
{ "error": "Property type in use. Deactivate instead of delete." }
```

---

## 7) Admin: Users API

### GET `/api/admin/users`
List users with filter by role or search by name/email.

**Query Parameters**
| Param | Example | Description |
|-------|---------|-------------|
| search | `john` | Filter by name/email/phone |
| roleId | `role2` | Filter by role ID |
| page | `1` | Page number |
| limit | `10` | Per page |

**Response 200**
```json
{
  "total": 120,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": "user1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "roleId": "role2",
      "role": { "id": "role2", "roleName": "AGENT", "active": true }
    }
  ]
}
```

---

### GET `/api/admin/users/:id`
Full user detail including role, permission overrides, and menu overrides.

**Response 200**
```json
{
  "user": {
    "id": "user1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": { "id": "role2", "roleName": "AGENT" },
    "userPermissions": [
      { "permissionId": "perm5", "canAccess": false, "permission": { "resource": "properties", "action": "DELETE" } }
    ],
    "userMenus": [
      { "menuId": "menu3", "canView": false, "menu": { "key": "roles", "title": "Roles", "path": "/admin/roles" } }
    ]
  }
}
```

---

### PATCH `/api/admin/users/:id`
Edit user name, phone, or change role.

**Request**
```json
{ "roleId": "role3", "name": "John Smith" }
```

**Response 200**
```json
{
  "user": {
    "id": "user1",
    "name": "John Smith",
    "email": "john@example.com",
    "role": { "id": "role3", "roleName": "BUYER" }
  }
}
```

---

### DELETE `/api/admin/users/:id`
Delete user.

**Response 200**
```json
{ "ok": true }
```

---

## 8) Admin: Menus API

### GET `/api/admin/menus`
List menus with search/filter/pagination.

**Query Parameters**
| Param | Example | Description |
|-------|---------|-------------|
| search | `users` | Filter by key/title/path |
| active | `true` | Active filter |
| page | `1` | Page number |
| limit | `10` | Per page |

**Response 200**
```json
{
  "total": 8,
  "page": 1,
  "limit": 10,
  "items": [
    { "id": "menu1", "key": "dashboard", "title": "Dashboard", "path": "/admin", "active": true, "sortOrder": 1 },
    { "id": "menu2", "key": "users", "title": "Users", "path": "/admin/users", "active": true, "sortOrder": 2 }
  ]
}
```

---

### POST `/api/admin/menus`
Add a new menu item.

**Request**
```json
{
  "key": "reports",
  "title": "Reports",
  "path": "/admin/reports",
  "sortOrder": 9,
  "active": true
}
```

**Response 201**
```json
{
  "menu": { "id": "menu9", "key": "reports", "title": "Reports", "path": "/admin/reports", "active": true }
}
```

---

### PATCH `/api/admin/menus/:id`
Edit a menu item.

**Request**
```json
{ "title": "Analytics Reports", "active": false }
```

**Response 200**
```json
{
  "menu": { "id": "menu9", "key": "reports", "title": "Analytics Reports", "active": false }
}
```

---

### DELETE `/api/admin/menus/:id`
Delete a menu item.

**Response 200**
```json
{ "ok": true }
```

---

## 9) Admin: Permissions Catalog

### GET `/api/admin/permissions`
List all resource-action permissions with filter/pagination.

**Query Parameters**
| Param | Example | Description |
|-------|---------|-------------|
| resource | `properties` | Filter by resource |
| action | `DELETE` | Filter by action (VIEW/CREATE/EDIT/DELETE) |
| active | `true` | Active filter |
| page | `1` | Page number |
| limit | `20` | Per page |

**Response 200**
```json
{
  "total": 24,
  "page": 1,
  "limit": 20,
  "items": [
    { "id": "perm1", "resource": "properties", "action": "VIEW", "active": true },
    { "id": "perm2", "resource": "properties", "action": "CREATE", "active": true },
    { "id": "perm3", "resource": "properties", "action": "EDIT", "active": true },
    { "id": "perm4", "resource": "properties", "action": "DELETE", "active": true },
    { "id": "perm5", "resource": "users", "action": "VIEW", "active": true },
    { "id": "perm6", "resource": "roles", "action": "VIEW", "active": true }
  ]
}
```

---

## 10) Access-Control API

### GET `/api/admin/access/menus`
Fetch the dynamic menu list for the currently logged-in user. Merges role defaults with user overrides.

**Response 200**
```json
{
  "total": 5,
  "menus": [
    { "id": "menu1", "key": "dashboard", "title": "Dashboard", "path": "/admin", "sortOrder": 1 },
    { "id": "menu2", "key": "users", "title": "Users", "path": "/admin/users", "sortOrder": 2 },
    { "id": "menu5", "key": "properties", "title": "Properties", "path": "/admin/properties", "sortOrder": 5 }
  ]
}
```

---

### GET `/api/admin/access/roles/:roleId/permissions`
Get all permission assignments for a role.

**Response 200**
```json
{
  "roleId": "role2",
  "permissions": [
    { "permissionId": "perm1", "canAccess": true, "permission": { "resource": "properties", "action": "VIEW" } },
    { "permissionId": "perm2", "canAccess": true, "permission": { "resource": "properties", "action": "CREATE" } },
    { "permissionId": "perm3", "canAccess": true, "permission": { "resource": "properties", "action": "EDIT" } },
    { "permissionId": "perm4", "canAccess": false, "permission": { "resource": "properties", "action": "DELETE" } }
  ]
}
```

---

### PUT `/api/admin/access/roles/:roleId/permissions`
Bulk update permission assignments for a role.

**Request**
```json
{
  "permissions": [
    { "permissionId": "perm1", "canAccess": true },
    { "permissionId": "perm2", "canAccess": true },
    { "permissionId": "perm3", "canAccess": true },
    { "permissionId": "perm4", "canAccess": false }
  ]
}
```

**Response 200**
```json
{ "ok": true }
```

---

### GET `/api/admin/access/users/:userId/permissions`
Get individual user permission overrides (on top of role defaults).

**Response 200**
```json
{
  "userId": "user1",
  "permissions": [
    { "permissionId": "perm4", "canAccess": false, "permission": { "resource": "properties", "action": "DELETE" } }
  ]
}
```

---

### PUT `/api/admin/access/users/:userId/permissions`
Bulk update permission overrides for a specific user.

**Request**
```json
{
  "permissions": [
    { "permissionId": "perm3", "canAccess": true },
    { "permissionId": "perm4", "canAccess": false }
  ]
}
```
> This allows a user to VIEW + EDIT but not DELETE.

**Response 200**
```json
{ "ok": true }
```

---

### GET `/api/admin/access/roles/:roleId/menus`
Get menu access assignments for a role.

**Response 200**
```json
{
  "roleId": "role2",
  "menus": [
    { "menuId": "menu1", "canView": true, "menu": { "key": "dashboard", "title": "Dashboard" } },
    { "menuId": "menu2", "canView": true, "menu": { "key": "users", "title": "Users" } },
    { "menuId": "menu3", "canView": false, "menu": { "key": "roles", "title": "Roles" } }
  ]
}
```

---

### PUT `/api/admin/access/roles/:roleId/menus`
Bulk set menu visibility for a role.

**Request**
```json
{
  "menus": [
    { "menuId": "menu1", "canView": true },
    { "menuId": "menu2", "canView": true },
    { "menuId": "menu3", "canView": false }
  ]
}
```

**Response 200**
```json
{ "ok": true }
```

---

### GET `/api/admin/access/users/:userId/menus`
Get user-specific menu overrides.

**Response 200**
```json
{
  "userId": "user1",
  "menus": [
    { "menuId": "menu3", "canView": false, "menu": { "key": "roles", "title": "Roles" } }
  ]
}
```

---

### PUT `/api/admin/access/users/:userId/menus`
Override menu visibility for a specific user.

**Request**
```json
{
  "menus": [
    { "menuId": "menu3", "canView": false },
    { "menuId": "menu7", "canView": true }
  ]
}
```

**Response 200**
```json
{ "ok": true }
```

---

## 11) RBAC Resolution Logic

When checking access:

1. Check `UserPermission` table for the user+permission — if override exists, use it
2. If no override, fall back to `RolePermission` for the user's assigned role
3. If neither exists, access is **denied**

When building the menu sidebar:

1. Start with all menus where `RoleMenuAccess.canView = true` for the user's role
2. Apply `UserMenuAccess` overrides (grant or revoke specific menus)
3. Sort by `sortOrder`

---

## 12) Project Status

| Layer | Status |
|-------|--------|
| Auth API | ✅ Done |
| Master data API | ✅ Done |
| Properties API | ✅ Done |
| Nearby search API | ✅ Done |
| Admin CRUD APIs | ✅ Done |
| Access-control APIs | ✅ Done |
| Admin UI (layout + pages) | ✅ Done |
| Lint / TypeScript | ✅ Passing |
| Database push + seed | ⏳ Pending (needs `DATABASE_URL`) |
| Auth UI (signup/login forms) | ⏳ Pending |
| Property posting form | ⏳ Pending |
| Search/discovery UI | ⏳ Pending |

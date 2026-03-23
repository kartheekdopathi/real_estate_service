# Master Tables API Reference

## Role Master Table APIs

### GET /api/roles
Retrieve all available roles for user signup and administration.

**Response:**
```json
{
  "total": 3,
  "roles": [
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
      "roleName": "BUYER"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j2k",
      "roleName": "AGENT"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j3k",
      "roleName": "ADMIN"
    }
  ]
}
```

**Usage in Signup Form:**
```javascript
// Fetch available roles
const response = await fetch('/api/roles');
const { roles } = await response.json();

// Display in dropdown (typically only BUYER and AGENT)
const signupRoles = roles.filter(r => r.roleName !== 'ADMIN');
```

---

## PropertyType Master Table APIs

### GET /api/property-types
Retrieve all active property types for property posting and search filtering.

**Response:**
```json
{
  "total": 9,
  "types": [
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
      "name": "Apartment / Flat",
      "slug": "apartment-flat"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j2k",
      "name": "Building",
      "slug": "building"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j3k",
      "name": "Farm Land",
      "slug": "farm-land"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j4k",
      "name": "House",
      "slug": "house"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j5k",
      "name": "Office",
      "slug": "office"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j6k",
      "name": "Plot / Land",
      "slug": "plot-land"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j7k",
      "name": "Shop",
      "slug": "shop"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j8k",
      "name": "Villa",
      "slug": "villa"
    },
    {
      "id": "clx1a2b3c4d5e6f7g8h9i0j9k",
      "name": "Warehouse",
      "slug": "warehouse"
    }
  ]
}
```

**Usage in Property Posting Form:**
```javascript
// Fetch available property types
const response = await fetch('/api/property-types');
const { types } = await response.json();

// Display in dropdown - use slug for form submission
types.forEach(type => {
  console.log(`${type.name} (${type.slug})`);
});

// When submitting property:
const formData = {
  typeSlug: "apartment-flat",  // Use slug, not id
  title: "Beautiful Apartment",
  price: 50000,
  ...
};
```

---

## Related APIs That Use Master Tables

### POST /api/auth/signup
Create new user with master table role reference.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "AGENT"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT",
    "phone": "+1234567890"
  }
}
```

**Internal Flow:**
1. Validate `role` is BUYER or AGENT
2. Lookup `Role` where `roleName = 'AGENT'` and `active = true`
3. Create `User` with `roleId` from master table
4. If AGENT, create `AgentProfile`
5. Return user with role name extracted from relationship

---

### POST /api/auth/login
Authenticate user and return master table role reference.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT"
  }
}
```

**Internal Flow:**
1. Find user and include role relationship
2. Verify password
3. Return user with `role.roleName` from master table

---

### GET /api/auth/me
Get current authenticated user with master table role.

**Response:**
```json
{
  "user": {
    "id": "user_001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AGENT"
  }
}
```

**Internal Flow:**
1. Extract JWT token from cookie
2. Verify token
3. Fetch user and include role relationship
4. Return user with role name from master table

---

### POST /api/properties
Create property listing with master table type reference.

**Request:**
```json
{
  "typeSlug": "apartment-flat",
  "listingType": "RENT",
  "title": "Modern Apartment",
  "description": "Beautifully designed apartment in prime location",
  "price": 50000,
  "city": "New York",
  "address": "123 Main Street",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "beds": 2,
  "baths": 1,
  "areaSqft": 1200
}
```

**Response (201):**
```json
{
  "property": {
    "id": "prop_001",
    "title": "Modern Apartment",
    "price": 50000,
    "beds": 2,
    "baths": 1,
    "type": {
      "id": "type_001",
      "name": "Apartment / Flat",
      "slug": "apartment-flat"
    },
    "city": "New York",
    "address": "123 Main Street"
  }
}
```

**Internal Flow:**
1. Authenticate user (must be AGENT or ADMIN role from master table)
2. Validate `typeSlug` from request
3. Lookup `PropertyType` where `slug = 'apartment-flat'` and `active = true`
4. Create `Property` with `typeId` from master table
5. Return property with type name/slug from relationship

---

### GET /api/properties
List properties with master table type information.

**Query Parameters:**
- `city` - Filter by city
- `listingType` - BUY or RENT
- `type` - Filter by property type slug (uses master table)
- `minPrice`, `maxPrice` - Price range
- `beds`, `baths` - Minimum bedrooms/bathrooms
- `page` - Pagination (default: 1)
- `limit` - Results per page (default: 12, max: 50)

**Example:**
```
GET /api/properties?type=apartment-flat&listingType=RENT&minPrice=30000&maxPrice=60000&city=New%20York
```

**Response:**
```json
{
  "total": 25,
  "page": 1,
  "limit": 12,
  "items": [
    {
      "id": "prop_001",
      "title": "Modern Apartment",
      "price": 50000,
      "type": {
        "id": "type_001",
        "name": "Apartment / Flat",
        "slug": "apartment-flat"
      },
      "agent": {
        "id": "agent_001",
        "name": "John Doe"
      },
      "images": [
        { "id": "img_001", "url": "https://..." }
      ]
    }
  ]
}
```

**Internal Flow:**
1. Build query with property type join on master table
2. Filter by type.slug if provided (ensures only active types used)
3. Include type information from master table
4. Return paginated results with type name/slug

---

## Data Consistency

All APIs ensure:

✅ **Only Active Records** - Queries include `where: { active: true }`  
✅ **Master Table References** - IDs always stored in main tables, relationships resolve display values  
✅ **Audit Trail** - createdAt/updatedAt tracked on all master records  
✅ **Referential Integrity** - Foreign keys prevent orphaned records  
✅ **Idempotent Seeding** - Upsert operations safe to run multiple times  

---

## Frontend Integration Example

### Complete Signup Flow

```typescript
// 1. Fetch available roles at page load
const fetchRoles = async () => {
  const res = await fetch('/api/roles');
  const { roles } = await res.json();
  setAvailableRoles(roles);
};

// 2. In signup form, display roles (filter out ADMIN)
const displayRoles = availableRoles
  .filter(r => r.roleName !== 'ADMIN')
  .map(r => ({ label: r.roleName, value: r.roleName }));

// 3. On form submit, call signup API with selected role
const handleSignup = async (formData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role  // BUYER or AGENT from dropdown
    })
  });
  
  if (response.ok) {
    const { user } = await response.json();
    // User created successfully with master table role
    console.log(`Welcome ${user.name}! You are a ${user.role}`);
  }
};
```

### Complete Property Posting Flow

```typescript
// 1. Fetch available property types at page load
const fetchPropertyTypes = async () => {
  const res = await fetch('/api/property-types');
  const { types } = await res.json();
  setAvailableTypes(types);
};

// 2. In property form, display types
const displayTypes = availableTypes.map(t => ({
  label: t.name,
  value: t.slug  // Use slug for submission
}));

// 3. On form submit, call property API with type slug
const handlePostProperty = async (formData) => {
  const response = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      typeSlug: formData.typeSlug,  // apartment-flat, house, etc.
      title: formData.title,
      price: formData.price,
      // ... other fields
    })
  });
  
  if (response.ok) {
    const { property } = await response.json();
    console.log(`Property created: ${property.title} (${property.type.name})`);
  }
};
```

---

## Error Handling

### Invalid Role
```json
{
  "error": "Invalid role"
}
```
**Status:** 400  
**Cause:** Role doesn't exist or is inactive

### Invalid Property Type
```json
{
  "error": "Invalid property type"
}
```
**Status:** 400  
**Cause:** Property type slug doesn't exist or is inactive

### Email Already in Use
```json
{
  "error": "Email already in use"
}
```
**Status:** 409  
**Cause:** User with this email exists

### Forbidden (Not Agent/Admin)
```json
{
  "error": "Forbidden"
}
```
**Status:** 403  
**Cause:** User role from master table is BUYER, cannot post properties

---

## Performance Notes

- Role and PropertyType queries use indexed lookups on `roleName` and `slug`
- Relationships resolved at query time (no N+1 queries)
- Active flag filtering optimized with indexes
- Pagination on property list prevents excessive data transfer

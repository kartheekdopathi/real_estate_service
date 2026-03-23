# API Specification (Draft)

## Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Property Types
- GET /api/property-types

## Properties
- GET /api/properties
- GET /api/properties/nearby
- POST /api/properties (agent/admin)
- GET /api/properties/:id
- PATCH /api/properties/:id (owner/admin)
- DELETE /api/properties/:id (owner/admin)

### Query params for GET /api/properties
- city
- type (property type slug)
- listingType (BUY | RENT)
- minPrice
- maxPrice
- beds
- baths
- page
- limit
- sortBy

### Query params for GET /api/properties/nearby
- lat (required)
- lng (required)
- radiusKm (default: 10)
- listingType (BUY | RENT)
- minPrice
- maxPrice
- beds
- baths
- limit

### Payload for POST /api/properties
- typeSlug (required)
- listingType (BUY | RENT)
- title
- description
- price
- city
- address
- latitude (optional)
- longitude (optional)
- beds
- baths
- areaSqft
- status (optional, default DRAFT)

## Favorites
- GET /api/favorites
- POST /api/favorites/:propertyId
- DELETE /api/favorites/:propertyId

## Inquiries
- POST /api/inquiries
- GET /api/inquiries/my

## Admin
- GET /api/admin/users
- GET /api/admin/properties/pending
- PATCH /api/admin/properties/:id/moderate

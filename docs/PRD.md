# Product Requirements Document (PRD)

## 1) Product Goal
Build a real estate web application where buyers can search properties, agents can list/manage properties, and admins can moderate content.

## 2) User Roles
- Buyer
- Agent
- Admin

## 3) Core Features (MVP)
1. Authentication and role-based access
2. Property listing (create/read/update/delete for agents)
3. Property discovery with filters
4. Property details page with gallery and location
5. Favorites (buyer)
6. Inquiry/contact form for each property
7. Admin moderation dashboard

## 3.1) Location-Based Service Requirements
- Buyers can find properties near current location or selected map point
- Support `BUY` and `RENT` discovery modes with distance filters
- Agents can set exact property coordinates during listing creation/edit
- Search response includes distance from user in kilometers
- Future: polygon/bounds search for map viewport and commute-time filters

## 3.2) Property Taxonomy Requirements
- Support master property types (example: Apartment/Flat, House, Villa, Building, Plot/Land, Office, Shop)
- Agents must select a property type when posting buy/rent listings
- Buyers can filter search by property type

## 4) Non-Functional Requirements
- Fast first load and SEO-friendly pages
- Mobile responsive UI
- Secure authentication and validation
- Basic observability/logging

## 5) Success Criteria
- Users can sign up/sign in by role
- Agents can publish and manage listings
- Buyers can filter and contact agents
- Admin can hide/delete suspicious listings

# Real Estate Service — Implementation & LLM Status

> Last updated: March 12, 2026

## 1) What was completed (latest)

### Listings and Search
- Global search input added to listings page.
- Infinite scroll implemented (auto-load next page on scroll).
- Semantic search mode added (`keyword` / `semantic`).
- Minimum 3-character query rule added for performance.
- Query behavior is filter-aware while scrolling (listing type, city, type, price, etc.).
- Featured listings are visibly marked in cards (⭐ Featured), aligned with featured-first API ordering.

Implemented in:
- [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx)
- [web/src/app/api/properties/route.ts](../web/src/app/api/properties/route.ts)

### Property View Navigation
- Card/thumbnail click opens property view.
- Buyer/non-owner routes to buyer property view.
- Owner/admin routes to agent property view.

Implemented in:
- [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx)

### Buyer Property Detail Page
- Buyer-facing property detail page added with media gallery/zoom and section layout.
- Unauthenticated users are redirected to login with `next` return URL.
- Contact details are now reveal-gated on this page (lead credit flow via reveal API).

Implemented in:
- [web/src/app/properties/[id]/page.tsx](../web/src/app/properties/%5Bid%5D/page.tsx)

### Agent Property Detail Page Improvements
- Section-wise inline edit (Overview, Pricing & Status, Location, Contact).
- Save/cancel per section.
- Fixed media disappearing after section save by returning media in PATCH response.
- Property `type.name` now displayed in the Overview section view.
- `beds`, `baths`, `areaSqft` added to Pricing & Status section: shown in view mode and editable inline.

Implemented in:
- [web/src/app/agent/properties/[id]/page.tsx](../web/src/app/agent/properties/%5Bid%5D/page.tsx)
- [web/src/app/api/properties/[id]/route.ts](../web/src/app/api/properties/%5Bid%5D/route.ts)

### Agent Property Edit Page Improvements
- `beds`, `baths`, `areaSqft` added to `FormState`, initial state, and API load.
- Added Beds / Baths / Area (sqft) input fields to the full edit form.
- All three fields included in the `PATCH` payload on save.

Implemented in:
- [web/src/app/agent/properties/[id]/edit/page.tsx](../web/src/app/agent/properties/%5Bid%5D/edit/page.tsx)

### Admin Monetization Controls
- Admin users module now supports changing user `subscriptionPlan` (`FREE` / `PRO` / `PREMIUM`).
- Admin can add/remove lead credits from users directly.
- Admin users search API updated for MariaDB compatibility (removed Prisma `mode: "insensitive"`).
- Admin can mark approved company users as `isInternal` for permanent free full-access exemption.
- Internal users bypass Phase 1 billing gates (feature plan restriction and lead-credit deduction).

Implemented in:
- [web/src/app/admin/users/page.tsx](../web/src/app/admin/users/page.tsx)
- [web/src/app/api/admin/users/route.ts](../web/src/app/api/admin/users/route.ts)
- [web/src/app/api/admin/users/[id]/route.ts](../web/src/app/api/admin/users/%5Bid%5D/route.ts)

### Signed Property Route IDs
- Signed route IDs are used/canonicalized in property routes.
- Canonical replacement applied in agent/buyer property pages.

Implemented in:
- [web/src/lib/property-id-token.ts](../web/src/lib/property-id-token.ts)
- [web/src/app/api/properties/[id]/route.ts](../web/src/app/api/properties/%5Bid%5D/route.ts)
- [web/src/app/agent/properties/[id]/page.tsx](../web/src/app/agent/properties/%5Bid%5D/page.tsx)
- [web/src/app/agent/properties/[id]/edit/page.tsx](../web/src/app/agent/properties/%5Bid%5D/edit/page.tsx)

## 2) LLM integration status (exact)

### Which LLM is integrated now?
- No external LLM provider is integrated in runtime code yet.

### Current “semantic” mode in app
- Current semantic mode is heuristic/token-expansion relevance scoring implemented in app code.
- It is not OpenAI/Gemini/Claude API integration.

Relevant files:
- [web/src/app/api/properties/route.ts](../web/src/app/api/properties/route.ts)
- [web/src/app/properties/page.tsx](../web/src/app/properties/page.tsx)

## 3) LLM by page/functionality matrix

| Page / Functionality | External LLM integrated? | Current method |
|---|---|---|
| Listings global search (`/properties`) | No | DB filters + keyword match |
| Semantic search mode (`searchMode=semantic`) | No | Heuristic semantic-like scoring |
| Buyer property detail (`/properties/[id]`) | No | Standard API fetch/render |
| Agent property detail (`/agent/properties/[id]`) | No | Standard API fetch/render + inline section edit |
| Contact reveal/lead credits | No | Rule-based monetization logic |

## 4) If you want real LLM search next

Recommended path:
1. Generate embeddings for listing text (`title`, `description`, `city`, `address`, type).
2. Store vectors in a vector DB (pgvector/Qdrant/Pinecone).
3. Add `searchMode=llm` route path for vector similarity + rerank.
4. Keep `keyword` and current `semantic` as fallbacks.

## 5) Recommended LLM frameworks for this app

### A) Vercel AI SDK
- Best for: fast LLM integration in Next.js route handlers and streaming UI.
- Good fit here:
  - Buyer assistant chat on property pages
  - Agent reply suggestion panel for inquiries
  - AI description writer while posting/editing property

### B) LangChain.js
- Best for: multi-step LLM workflows, tool-calling, retrieval pipelines.
- Good fit here:
  - Search query rewriting and intent extraction
  - Hybrid search orchestration (`keyword + vector + rerank`)
  - Policy-aware assistant responses

### C) LlamaIndex TS
- Best for: RAG indexing/retrieval over domain content.
- Good fit here:
  - Property knowledge assistant over listings + policy docs
  - FAQ assistant with grounded answers

### D) Vector layer (required for true semantic search)
- Options: pgvector / Qdrant / Pinecone
- Use with embedding model provider (OpenAI/Cohere/Google/Anthropic-compatible)

## 6) Suggested LLM integration by page/functionality

| Page / Functionality | Suggested AI/LLM usage | Suggested stack |
|---|---|---|
| Listings search (`/properties`) | True semantic retrieval + rerank | Embeddings + Vector DB + LangChain/LlamaIndex |
| Property post/edit (`/agent/post-property`, `/agent/properties/[id]/edit`) | Title/description generation and quality suggestions | Vercel AI SDK (+ provider API) |
| Buyer property view (`/properties/[id]`) | Buyer Q&A assistant for listing details and locality context | Vercel AI SDK + Retrieval pipeline |
| Inquiry/reply workflow (agent side) | Response drafting and tone variations | Vercel AI SDK or LangChain.js |
| Admin insights | AI summary of lead trends and listing performance | LangChain.js + analytics tools |

## 7) Current decision status

- External LLM integration is **not enabled yet** in production code.
- Current `searchMode=semantic` remains heuristic and non-LLM.
- Recommended first production AI milestone:
  1. Add vector semantic search (`searchMode=llm`)
  2. Add AI description writer for agents

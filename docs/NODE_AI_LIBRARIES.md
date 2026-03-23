# 🤖 Node.js AI Libraries for Real Estate Service

> **Last updated:** March 12, 2026

This document lists practical AI libraries you can use in this project, why they fit, and where they can be integrated.

---

## 1) Primary LLM Integration Libraries

| Library | Why use it | Best use in this app |
|---|---|---|
| `openai` | Official SDK, stable APIs, supports chat/embeddings/vision | Property description generation, chatbot, semantic search embeddings |
| `@anthropic-ai/sdk` | Strong long-context reasoning | Contract/explanation assistant, inquiry auto-drafting |
| `@google/genai` | Gemini models with multimodal strengths | Image-aware listing enhancement and summary generation |

### Recommendation
- Start with **one provider** (usually `openai`) for faster delivery.
- Keep provider usage behind one internal service so switching later is easy.

---

## 2) Framework Layer (Orchestration)

| Library | Why use it | Best use in this app |
|---|---|---|
| `ai` (Vercel AI SDK) | Clean streaming APIs for Next.js Route Handlers | Streaming chatbot responses in `/api/*` |
| `langchain` | Tool calling, retrieval chains, memory patterns | RAG chatbot over property data + docs |
| `llamaindex` (TypeScript) | Strong indexing/retrieval abstractions | Knowledge assistant over FAQs, policy docs, neighborhood guides |

### Recommendation
- For your stack (Next.js App Router), **Vercel AI SDK + one model SDK** is the quickest path.
- Add LangChain only when you need advanced multi-step chains/tools.

---

## 3) Embeddings + Vector Search

| Library | Why use it | Best use in this app |
|---|---|---|
| `openai` embeddings | High quality and simple to start | Semantic matching: “2 bed near school under budget” |
| `@pinecone-database/pinecone` | Managed vector DB | Production semantic search |
| `@qdrant/js-client-rest` | Good self-hosted/managed option | Cost-efficient vector search for listings |
| `weaviate-client` | Rich hybrid + vector search | Advanced search and recommendation |

### Recommendation
- MVP: keep normal Prisma filters + add embeddings for title/description/city.
- Store vectors in Pinecone/Qdrant; keep metadata in MariaDB.

---

## 4) AI Features You Can Build Quickly

| Feature | Suggested libraries |
|---|---|
| Auto-generate listing description from form fields | `openai` + `zod` for output validation |
| Smart property search by natural language | `openai` embeddings + Pinecone/Qdrant |
| Buyer/agent chatbot assistant | `ai` + `openai` (or Anthropic/Gemini) |
| Image caption + quality hints | `openai` vision (or Gemini vision) + `sharp` |
| Multi-language listing translation | `openai` / `@google/genai` |
| Inquiry response suggestions for agents | `openai` with role-specific prompts |

---

## 5) Safety, Cost, and Reliability Libraries

| Library | Purpose |
|---|---|
| `zod` | Strict schema validation for AI outputs |
| `pino` | Structured logging for prompts/responses/errors |
| `p-retry` | Retry transient provider failures |
| `bottleneck` | Rate limiting and queue control |
| `dotenv` | Secure env configuration |

### Recommended safeguards
- Never trust raw model output; validate with `zod`.
- Add usage limits per user role to control cost.
- Log token usage and latency per endpoint.

---

## 6) Suggested Installation (MVP)

```bash
# Core
npm --prefix web install openai ai zod

# Optional retrieval layer
npm --prefix web install langchain

# Optional vector database client (pick one)
npm --prefix web install @pinecone-database/pinecone
# or
npm --prefix web install @qdrant/js-client-rest
```

---

## 7) Integration Points in Current Project

| Area | Where to integrate |
|---|---|
| Property creation flow | `web/src/app/api/properties/route.ts` |
| Image processing flow | `web/src/app/api/properties/[id]/images/route.ts` |
| Inquiry handling | `web/src/app/api/*` inquiry-related endpoints |
| Admin analytics | `web/src/app/admin/*` pages and API |
| Shared AI service | Create `web/src/lib/ai/` for provider clients + prompts |

---

## 8) Recommended Rollout Plan

1. **Phase 1:** AI description generator on property create/edit.
2. **Phase 2:** Semantic property search (embeddings + vector DB).
3. **Phase 3:** Buyer chatbot (RAG over listings + FAQs).
4. **Phase 4:** Agent productivity tools (reply drafts, lead scoring).

This phased approach minimizes risk and keeps implementation measurable.

# Architecture Decision Log

## ADR-001: Use Next.js + Node.js in one app
- **Status**: Accepted
- **Reason**: Faster MVP with unified frontend and backend using Node runtime.

## ADR-002: Use PostgreSQL + Prisma
- **Status**: Accepted
- **Reason**: Reliable relational model for users/properties/inquiries.

## ADR-003: Start with monolith, split later if needed
- **Status**: Accepted
- **Reason**: Lower operational complexity in early stage.

## ADR-004: Use cloud media storage
- **Status**: Accepted
- **Reason**: Offloads file handling and supports CDN delivery.

## ADR-005: Use direct upload + async media processing
- **Status**: Accepted
- **Reason**: Scales better for large image/video uploads, reduces app server load, and supports reliable processing lifecycle.

## ADR-006: Use provider abstraction for media and jobs
- **Status**: Accepted
- **Reason**: Keeps API contract stable across local and cloud environments while allowing infrastructure swaps through configuration.

# Architecture & Technical Decisions

## Clean Architecture Principles
The QueueOS backend is structured into distinct layers to separate concerns:
1. **Routes:** Defines API endpoints and attaches middleware.
2. **Controllers:** Handles HTTP requests, validation, and sending responses.
3. **Services/Utils:** Core business logic and database interactions (e.g., `socket.service.ts`, `db.ts`).

## Technical Decisions

### 1. TanStack Query + Zustand
Instead of relying purely on React Context or Redux, we opted for **TanStack Query** for server-state management (caching, deduping, loading states, error handling) and **Zustand** for client-state management (authentication session). This separation prevents unnecessary re-renders and creates a snappier user experience.

### 2. Prisma ORM
Prisma provides type-safe database queries. When the schema changes, TypeScript compiler errors instantly flag where queries need updating. It also provides automatic migrations which speeds up the development lifecycle.

### 3. Socket.IO vs Server-Sent Events (SSE)
We used Socket.IO over SSE or pure WebSockets because Socket.IO provides built-in fallback mechanisms, auto-reconnection, and "rooms". Rooms (`join-queue`, `leave-queue`) allow us to broadcast events *only* to users viewing a specific queue, saving bandwidth and client-side processing.

### 4. Zod for Validation
Zod is used across both the frontend (with `react-hook-form`) and the backend (in controllers) to provide a single source of truth for validation schemas, ensuring type safety from the UI down to the database.

### 5. Optimistic UI & Framer Motion
To provide a premium feel (akin to Linear or Stripe), the UI implements Framer Motion for smooth layout transitions (`layoutId`, `AnimatePresence`). When a token is served or reordered, it glides into its new position instead of abruptly snapping.

# AI Takeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement provider management, tenant AI policy, durable AI invocations, conversation takeover/reclaim, realtime replies, and basic management UI.

**Architecture:** Add Prisma entities for global models, tenant policy and invocation history. A provider-neutral NestJS AI module encrypts credentials, validates permissions, dispatches OpenAI-compatible requests, and processes durable pending invocations. Existing conversation and admin UIs consume the new APIs.

**Tech Stack:** NestJS, Prisma/MySQL, Node crypto/fetch, React, Node test/Jest, Socket.IO

**Spec:** `docs/superpowers/specs/2026-08-28-ai-takeover-design.md`

## Global Constraints

- Preserve existing human conversation behavior and tenant isolation.
- Do not hard-code or log provider secrets.
- AI cannot execute sensitive business mutations.
- LongCat endpoint and model identifier remain administrator-configurable.

---

### Task 1: Persistence and provider core

**Files:**
- Modify: `.worktrees/backend-mvp/backend/prisma/schema.prisma`
- Create: `.worktrees/backend-mvp/backend/prisma/migrations/20260828150000_add_ai_takeover/migration.sql`
- Create: `.worktrees/backend-mvp/backend/src/ai/*`
- Test: `.worktrees/backend-mvp/backend/src/ai/*.spec.ts`

- [ ] Write failing tests for credential masking/encryption and OpenAI-compatible request normalization.
- [ ] Run focused Jest tests and confirm failures represent missing behavior.
- [ ] Add schema, migration, encryption service, provider adapter and DTO validation.
- [ ] Run focused tests and backend build.

### Task 2: Administration APIs

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/ai/ai-models.controller.ts`
- Create: `.worktrees/backend-mvp/backend/src/ai/tenant-ai.controller.ts`
- Create: `.worktrees/backend-mvp/backend/src/ai/ai-admin.service.ts`
- Modify: `.worktrees/backend-mvp/backend/src/app.module.ts`
- Test: `.worktrees/backend-mvp/backend/test/ai-management.e2e-spec.ts`

- [ ] Write failing role and tenant-scope tests for platform model and tenant policy APIs.
- [ ] Implement minimal CRUD, masked responses, connection test, usage summary and invocation listing.
- [ ] Run management tests and backend build.

### Task 3: Conversation AI lifecycle

**Files:**
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.controller.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversation-events.ts`
- Create: `.worktrees/backend-mvp/backend/src/ai/ai-invocation.service.ts`
- Test: `.worktrees/backend-mvp/backend/test/ai-takeover.e2e-spec.ts`

- [ ] Write failing tests for takeover, customer-triggered invocation, reclaim and failure handoff.
- [ ] Implement transactional status changes and durable invocation creation.
- [ ] Implement ordered worker processing, usage persistence and realtime publication.
- [ ] Run lifecycle tests and backend build.

### Task 4: Management and workbench UI

**Files:**
- Modify: `src/AdminConsole.jsx`
- Modify: `src/App.jsx`
- Modify: `src/admin.css`
- Create: `src/aiApi.js`
- Test: `src/aiApi.test.js`

- [ ] Write failing frontend API contract tests.
- [ ] Add platform and tenant management panels using real endpoints.
- [ ] Add AI takeover/reclaim controls and AI status rendering to the workbench.
- [ ] Run frontend tests and build.

### Task 5: End-to-end verification

**Files:**
- Modify only files required by observed defects.

- [ ] Deploy the migration to the local database and regenerate Prisma.
- [ ] Run all backend tests and build.
- [ ] Run all frontend tests and build.
- [ ] Verify the local Nginx UI and API without exposing credentials.

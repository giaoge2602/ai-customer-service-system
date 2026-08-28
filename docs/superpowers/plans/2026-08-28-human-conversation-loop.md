# Human Conversation Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persisted, permission-safe, real-time human customer-service loop from authenticated customer creation through queueing, agent handling, automatic closure, and evaluation.

**Architecture:** NestJS REST commands remain the source of truth, Prisma/MySQL persist every message and transition, and Socket.IO broadcasts committed changes. A database-backed NestJS scheduler processes the two-, three-, and five-minute deadlines; React clients reconnect through Socket.IO and reconcile through REST.

**Tech Stack:** React 19, Vite 7, NestJS 11, Prisma 6, MySQL 8, Socket.IO, `@nestjs/schedule`, Node test runner, Jest, Supertest.

**Spec:** `docs/superpowers/specs/2026-08-28-human-conversation-loop-design.md`

## Global Constraints

- First release supports authenticated customers only.
- One unfinished conversation per customer and tenant.
- Text and system messages only; text length is 1-5000 trimmed characters.
- REST is authoritative; Socket.IO events are hints and must be reconciled after reconnect.
- Customer inactivity is 5 minutes, closing-intent delay is 3 minutes, evaluation visibility delay is 2 minutes, and the timeout sweep runs every 15 seconds.
- Platform administrators are read-only; tenant administrators cannot impersonate agents by replying.
- Do not add AI, knowledge retrieval, anonymous visitors, attachments, external channels, Redis, BullMQ, or advanced routing.
- The frontend repository and `D:/ai-customer-service-system/.worktrees/backend-mvp` both contain pre-existing uncommitted work. Do not reset, overwrite, reformat, stage, or commit unrelated changes. Use scoped diffs and tests as task checkpoints; create commits only if the changed hunks can be isolated without including prior work.

---

## File Structure

### Backend worktree: `.worktrees/backend-mvp/backend`

- `prisma/schema.prisma`: customer-user binding, conversation deadlines, read cursors, indexes.
- `prisma/migrations/20260828090000_complete_human_conversation_loop/migration.sql`: forward-only schema and safe email-based backfill.
- `prisma/seed.ts`: bind the demo customer login to its customer profile.
- `src/conversations/conversation-policy.service.ts`: role and ownership visibility rules.
- `src/conversations/conversation-intent.ts`: pure closing-intent normalization and matching.
- `src/conversations/conversation-events.ts`: shared real-time event names and payload types.
- `src/conversations/conversation-realtime.publisher.ts`: publish committed domain events without coupling services to the gateway.
- `src/conversations/conversation.gateway.ts`: Socket.IO JWT authentication and authorized room joins.
- `src/conversations/conversation-timeout.service.ts`: idempotent deadline sweep.
- `src/conversations/conversations.service.ts`: transactional commands and queries.
- `src/conversations/conversations.controller.ts`: role-specific REST routes.
- `src/conversations/dto/*.ts`: send, read, assign, evaluation, end, and list inputs.
- `src/conversations/*.spec.ts`: pure logic and service unit tests.
- `test/conversations.e2e-spec.ts`: complete REST lifecycle and authorization tests.
- `test/conversation-realtime.e2e-spec.ts`: authenticated Socket.IO isolation and events.

### Frontend root

- `src/api.js`: REST conversation methods.
- `src/conversationApi.js`: DTO-to-view-model mapping and conversation-specific request helpers.
- `src/conversationRealtime.js`: one Socket.IO client, reconnect reconciliation, and event de-duplication.
- `src/conversationApi.test.js`: mapping and request construction tests.
- `src/App.jsx`: customer chat and agent workbench connection to persisted conversations.
- `src/ServiceWorkspace.jsx`: real queue and claim actions.
- `src/AdminConsole.jsx`: real tenant/platform conversation monitors and tenant assignment actions.
- Existing CSS files: only selectors required for connection state, evaluation dialog, and lifecycle actions.
- `D:/web/nginx/nginx-1.22.0-web/conf/nginx.conf`: `/socket.io/` Upgrade proxy.

---

### Task 1: Persist customer identity, deadlines, and read cursors

**Files:**
- Modify: `.worktrees/backend-mvp/backend/prisma/schema.prisma`
- Create: `.worktrees/backend-mvp/backend/prisma/migrations/20260828090000_complete_human_conversation_loop/migration.sql`
- Modify: `.worktrees/backend-mvp/backend/prisma/seed.ts`
- Modify: `.worktrees/backend-mvp/backend/test/seed.e2e-spec.ts`

**Interfaces:**
- Produces `Customer.userId: string | null`, `ConversationReadCursor`, and the eight timestamp/actor fields from the spec.
- Later tasks resolve the customer with `{ userId: authenticatedUser.id, tenantId }` and use deadline indexes for scans.

- [ ] **Step 1: Write the failing seed/database assertions**

Add assertions that `USR-CUSTOMER-001` is linked to `C-01842`, and that a cursor can be uniquely upserted by `conversationId_userId`:

```ts
const profile = await testPrisma.customer.findUnique({
  where: { userId: 'USR-CUSTOMER-001' },
});
expect(profile?.id).toBe('C-01842');

const conversationId = 'CS-240819-018';
await testPrisma.conversationReadCursor.upsert({
  where: { conversationId_userId: { conversationId, userId: 'USR-CUSTOMER-001' } },
  update: { lastReadSequence: 2 },
  create: { id: randomUUID(), tenantId, conversationId, userId: 'USR-CUSTOMER-001', lastReadSequence: 2 },
});
```

- [ ] **Step 2: Verify RED**

Run from `.worktrees/backend-mvp/backend`:

```powershell
npx prisma validate
npm run test:e2e -- --runInBand test/seed.e2e-spec.ts
```

Expected: Prisma/test compilation fails because `userId` and `conversationReadCursor` do not exist.

- [ ] **Step 3: Add the minimal schema and migration**

Add nullable unique `Customer.userId` with a `CustomerLogin` relation to `User`; add the reverse optional relation on `User`. Add to `Conversation`:

```prisma
lastCustomerMessageAt   DateTime?
lastAgentMessageAt      DateTime?
customerReplyDeadlineAt DateTime?
closingIntentDeadlineAt DateTime?
evaluationRequestedAt   DateTime?
evaluationVisibleAt     DateTime?
evaluationPresentedAt   DateTime?
endedByType             String? @db.VarChar(30)
readCursors             ConversationReadCursor[]
```

Create `ConversationReadCursor` with unique `(conversationId, userId)` and tenant/user index. The SQL migration must:

1. Add nullable columns and indexes.
2. Backfill `Customer.userId` by matching non-null normalized email and `tenantId` to customer-role users.
3. Add the unique index and foreign keys only after backfill.

Update the auth registration and seed creation paths to write `userId: user.id` directly.

- [ ] **Step 4: Verify GREEN**

```powershell
npx prisma format
npx prisma validate
npm run prisma:generate
npm run build
```

When the test database is available, deploy the migration and rerun `seed.e2e-spec.ts`. Expected: schema validation, generation, build, and the two assertions pass.

- [ ] **Step 5: Checkpoint the scoped diff**

```powershell
git diff --check -- prisma/schema.prisma prisma/seed.ts test/seed.e2e-spec.ts prisma/migrations/20260828090000_complete_human_conversation_loop/migration.sql
```

Confirm no unrelated schema or seed hunks were changed.

---

### Task 2: Add closing-intent and deadline policy primitives

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-intent.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-intent.spec.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-deadlines.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-deadlines.spec.ts`

**Interfaces:**
- Produces `isClosingIntent(content: string): boolean`.
- Produces `agentReplyDeadlines(now: Date)` and `evaluationDeadlines(now: Date)` with exact fields consumed by the service.

- [ ] **Step 1: Write failing pure tests**

```ts
expect(isClosingIntent('谢谢！')).toBe(true);
expect(isClosingIntent('好的，没问题')).toBe(true);
expect(isClosingIntent('谢谢，请问退款多久到账？')).toBe(false);
expect(isClosingIntent('这个问题还是没有解决')).toBe(false);

const now = new Date('2026-08-28T00:00:00.000Z');
expect(agentReplyDeadlines(now).customerReplyDeadlineAt.toISOString())
  .toBe('2026-08-28T00:05:00.000Z');
expect(evaluationDeadlines(now).evaluationVisibleAt.toISOString())
  .toBe('2026-08-28T00:02:00.000Z');
```

- [ ] **Step 2: Verify RED**

```powershell
npm test -- --runInBand src/conversations/conversation-intent.spec.ts src/conversations/conversation-deadlines.spec.ts
```

Expected: modules are missing.

- [ ] **Step 3: Implement minimal pure functions**

Normalize Unicode whitespace, trim common Chinese/ASCII punctuation, remove only trailing polite particles, and compare against the exact approved phrase set. Do not use substring matching. Return new `Date` values without mutating the supplied `now`.

- [ ] **Step 4: Verify GREEN**

Run the same focused command, then `npm test -- --runInBand`. Expected: all unit suites pass.

- [ ] **Step 5: Checkpoint**

```powershell
git diff --check -- src/conversations/conversation-intent.ts src/conversations/conversation-intent.spec.ts src/conversations/conversation-deadlines.ts src/conversations/conversation-deadlines.spec.ts
```

---

### Task 3: Enforce role visibility and customer-owned creation/resume

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-policy.service.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-policy.service.spec.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.controller.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/dto/conversation-query.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/dto/create-conversation.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/test/conversations.e2e-spec.ts`

**Interfaces:**
- Produces `visibleWhere(user, tenantId, query): Prisma.ConversationWhereInput`.
- Produces `assertCanView(conversation, user, customerId): void`.
- Changes `create(user, input)` so customer identity comes only from `Customer.userId`, `clientMessageId` protects the first message, and an unfinished conversation is resumed.

- [ ] **Step 1: Write failing authorization and resume E2E cases**

Add cases proving:

```ts
const first = await customerPost('/api/v1/conversations', { channel: 'web', clientMessageId: randomUUID(), firstMessage: '第一次咨询' });
const resumed = await customerPost('/api/v1/conversations', { channel: 'web', clientMessageId: randomUUID(), firstMessage: '不会重复创建会话' });
expect(resumed.body.data.id).toBe(first.body.data.id);
expect(await testPrisma.conversation.count({ where: { customerId: 'C-01842', status: { notIn: ['ended', 'evaluated'] } } })).toBe(1);
```

Also assert agents see `queued` plus their own `human` conversations, tenant admins see all tenant conversations, customers see only their own, and platform admins must provide `tenantId`.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:e2e -- --runInBand test/conversations.e2e-spec.ts
```

Expected: customer create/list/detail currently return `403`.

- [ ] **Step 3: Implement the policy and route roles**

Allow `customer` on list/create/detail. Replace client-supplied customer identity with lookup by `(user.id, tenantId)`. In a transaction, lock the matching `Customer` row with `SELECT ... FOR UPDATE`, find status in `queued|human`, and return it without adding the supplied first message. If none exists, create `queued`, the first customer message with `clientMessageId`, `created` event, and read cursor. The row lock makes concurrent create requests converge on one unfinished conversation even though MySQL has no partial unique index.

Agent list filtering must be:

```ts
{ tenantId, OR: [{ status: 'queued' }, { status: 'human', agentId: user.id }] }
```

- [ ] **Step 4: Verify GREEN**

Run focused E2E, unit tests, and `npm run build`. Expected: role visibility and one-active-conversation assertions pass.

- [ ] **Step 5: Checkpoint**

Review only the listed files and ensure tenant resolution still uses `TenantScopeService` for admins.

---

### Task 4: Implement bidirectional idempotent messages and read cursors

**Files:**
- Modify: `.worktrees/backend-mvp/backend/src/conversations/dto/send-message.dto.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/dto/mark-read.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.controller.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/test/conversations.e2e-spec.ts`

**Interfaces:**
- Produces `sendMessage(tenantId, id, user, { clientMessageId, content })`.
- Produces `markRead(tenantId, id, user, lastReadSequence)`.
- Message responses include stable `id`, `sequence`, `clientMessageId`, `senderType`, and `createdAt`.

- [ ] **Step 1: Write failing E2E cases**

Cover customer message before/after claim, assigned-agent reply, unassigned/other-agent rejection, 5001-character rejection, duplicate `clientMessageId`, read cursor monotonicity, and timer changes:

```ts
const retry = await agentPost(`/conversations/${id}/messages`, payload);
expect(retry.body.data.id).toBe(firstReply.body.data.id);
expect(await testPrisma.message.count({ where: { conversationId: id, clientMessageId: payload.clientMessageId } })).toBe(1);
```

- [ ] **Step 2: Verify RED**

Run focused E2E. Expected: customer send and `/read` are unavailable, and the DTO lacks `clientMessageId`.

- [ ] **Step 3: Implement transactional message commands**

Within one transaction:

1. Authorize the sender.
2. Return an existing message for duplicate `(conversationId, clientMessageId)`.
3. Reserve `sequence`.
4. Create the message and a `message_created` event.
5. For agent messages set `lastAgentMessageAt`, `customerReplyDeadlineAt = now + 5m`.
6. For ordinary customer messages set `lastCustomerMessageAt` and clear both customer reply and closing-intent deadlines.
7. For closing-intent customer messages set `closingIntentDeadlineAt = now + 3m` and clear the customer reply deadline.

`markRead` upserts the cursor with `max(existing, requested)` and rejects a sequence beyond `nextSequence - 1`.

- [ ] **Step 4: Verify GREEN**

Run focused E2E, all unit tests, and build.

- [ ] **Step 5: Checkpoint**

Confirm message, conversation update, event, and cursor changes are tenant-scoped and transactional.

---

### Task 5: Complete claim, release, assignment, and end commands

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/dto/assign-conversation.dto.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/dto/end-conversation.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.controller.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/test/conversations.e2e-spec.ts`

**Interfaces:**
- Produces `claim`, `release`, `assign`, and role-aware `end` commands.
- Every command creates one system message where user-visible, one `ConversationEvent`, and increments `version`.

- [ ] **Step 1: Write failing lifecycle tests**

Test atomic duplicate claim, agent release to queue, tenant-admin assignment to active same-tenant agent, rejection of disabled/cross-tenant agents, reassignment from one agent to another, customer ending own queued/human conversation, agent ending own, tenant-admin force end, platform-admin rejection, and audit-log creation for administrator assignment/force-end actions.

- [ ] **Step 2: Verify RED**

Run focused E2E. Expected: release/assign routes are missing and customer end is forbidden.

- [ ] **Step 3: Implement minimal lifecycle transitions**

- `claim`: conditional `queued -> human`, `agentId = user.id`.
- `release`: conditional own `human -> queued`, clear `agentId`, `assignedAt`, deadlines, and evaluation timestamps.
- `assign`: verify target is active same-tenant agent; set `human`, target agent, assigned timestamp; record `assigned` or `reassigned`; write an `AuditLog` for the administrator action.
- `end`: map actor to `customer`, `agent`, or `tenant_admin`; set `ended`, `endedAt`, `endedByType`, normalized reason, clear all deadlines; write an `AuditLog` for tenant-admin force end.

Use conditional updates containing current status and version before inserting related records.

- [ ] **Step 4: Verify GREEN**

Run focused E2E, all unit tests, and build.

- [ ] **Step 5: Checkpoint**

Confirm tenant administrators cannot call the message or evaluation-invite commands.

---

### Task 6: Implement evaluation invitation and submission

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/dto/submit-evaluation.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.controller.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/test/conversations.e2e-spec.ts`

**Interfaces:**
- Produces `requestEvaluation(tenantId, id, agentUser)`.
- Produces `submitEvaluation(tenantId, id, customerUser, input)` with enum-to-score mapping `5|4|3|2`.

- [ ] **Step 1: Write failing tests**

Assert only the assigned agent can invite, repeat invites return original timestamps, submission before `evaluationPresentedAt` is rejected, all four ratings map correctly, comment is capped at 200 characters, repeat submission returns the existing evaluation, and submission changes the conversation to `evaluated`.

- [ ] **Step 2: Verify RED**

Run focused E2E. Expected: both routes are missing.

- [ ] **Step 3: Implement evaluation transactions**

Invitation sets requested/visible timestamps and writes `evaluation_scheduled`. Submission verifies ownership and presentation, creates exactly one `Evaluation`, updates status/ended fields, clears deadlines, and writes `evaluation_submitted`.

- [ ] **Step 4: Verify GREEN**

Run focused E2E, all unit tests, and build.

- [ ] **Step 5: Checkpoint**

Confirm ended conversations remain evaluable only when an invitation was presented and no evaluation exists.

---

### Task 7: Add the persistent timeout sweep

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-timeout.service.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-timeout.service.spec.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.module.ts`
- Modify: `.worktrees/backend-mvp/backend/src/app.module.ts`
- Modify: `.worktrees/backend-mvp/backend/package.json`
- Modify: `.worktrees/backend-mvp/backend/package-lock.json`

**Interfaces:**
- Produces public `sweep(now = new Date()): Promise<SweepResult>` for deterministic tests.
- Scheduler calls `sweep()` every 15 seconds.

- [ ] **Step 1: Install schedule dependency and write failing service tests**

```powershell
npm install @nestjs/schedule
```

Test one due evaluation display, closing-intent end, customer-inactive end, non-due no-op, and two concurrent sweeps producing exactly one event.

- [ ] **Step 2: Verify RED**

Run the focused spec. Expected: timeout service is missing.

- [ ] **Step 3: Implement the batched idempotent sweep**

Process at most 100 rows per deadline type per sweep. For evaluation visibility, conditionally clear `evaluationVisibleAt`, set `evaluationPresentedAt`, and add one event. For automatic end, conditionally set `ended`, reason, actor `system`, clear all deadlines, add one system message and one event. Return processed IDs grouped by event type for the publisher.

- [ ] **Step 4: Verify GREEN**

Run focused tests, all backend unit tests, build, and lint.

- [ ] **Step 5: Checkpoint**

Confirm no `setTimeout` or in-memory timer stores were introduced.

---

### Task 8: Add authenticated Socket.IO rooms and committed event publishing

**Files:**
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-events.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation-realtime.publisher.ts`
- Create: `.worktrees/backend-mvp/backend/src/conversations/conversation.gateway.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.module.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversations.service.ts`
- Modify: `.worktrees/backend-mvp/backend/src/conversations/conversation-timeout.service.ts`
- Create: `.worktrees/backend-mvp/backend/test/conversation-realtime.e2e-spec.ts`
- Modify: `.worktrees/backend-mvp/backend/package.json`
- Modify: `.worktrees/backend-mvp/backend/package-lock.json`

**Interfaces:**
- Produces `publish(event: ConversationRealtimeEvent): void`.
- Produces client event `conversation:join` with acknowledgement `{ ok: true } | { ok: false, code }`.
- Emits the ten event names defined in the spec.

- [ ] **Step 1: Install WebSocket dependencies and write failing integration tests**

```powershell
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D socket.io-client
```

Tests connect with valid/invalid JWT, join authorized/unauthorized conversations, and assert that a message from tenant A is not received by tenant B.

- [ ] **Step 2: Verify RED**

Run `test/conversation-realtime.e2e-spec.ts`. Expected: gateway and namespace are unavailable.

- [ ] **Step 3: Implement gateway and publisher**

Authenticate during `handleConnection` using the same JWT secret and user lookup as HTTP. Join `user:{id}` and `tenant:{tenantId}` automatically. Authorize `conversation:join` through `ConversationPolicyService`. Publish only after Prisma transactions resolve successfully; use generated UUID event IDs.

- [ ] **Step 4: Verify GREEN**

Run realtime E2E, conversation E2E, all unit tests, build, and lint.

- [ ] **Step 5: Checkpoint**

Confirm event payloads contain no password hashes, private customer fields, or unrelated tenant data.

---

### Task 9: Add frontend REST and realtime infrastructure

**Files:**
- Modify: `src/api.js`
- Create: `src/conversationApi.js`
- Create: `src/conversationApi.test.js`
- Create: `src/conversationRealtime.js`
- Create: `src/conversationRealtime.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `listConversations`, `createOrResumeConversation`, `getConversation`, `sendConversationMessage`, `markConversationRead`, `claimConversation`, `releaseConversation`, `assignConversation`, `requestConversationEvaluation`, `submitConversationEvaluation`, and `endConversation`.
- Produces `createConversationRealtime({ token, onReconnect })` with `subscribe`, `join`, `leave`, and `close`.

- [ ] **Step 1: Install the client and write failing tests**

```powershell
npm install socket.io-client
```

Test URL/query construction, DTO mapping, generated/stable `clientMessageId`, event ID de-duplication, and one reconciliation callback per reconnect.

- [ ] **Step 2: Verify RED**

```powershell
node --test src/conversationApi.test.js src/conversationRealtime.test.js
```

Expected: modules are missing.

- [ ] **Step 3: Implement minimal clients**

Reuse `authRequest` by exporting it from `api.js`. Normalize backend messages to the existing UI shape in one mapper. Socket.IO uses same-origin `/socket.io`, `transports: ['websocket', 'polling']`, JWT in `auth`, and a bounded in-memory set of the latest 500 event IDs.

- [ ] **Step 4: Verify GREEN**

Run focused frontend tests, the full `npm test`, and `npm run build`.

- [ ] **Step 5: Checkpoint**

Confirm no token is placed in a URL or persisted outside the existing session storage contract.

---

### Task 10: Connect the authenticated customer chat

**Files:**
- Modify: `src/App.jsx`
- Modify: the existing customer-chat CSS file used by `CustomerChat`
- Create: `src/customerConversationState.js`
- Create: `src/customerConversationState.test.js`

**Interfaces:**
- Consumes Task 9 API/realtime clients.
- Produces a customer view that creates/resumes, sends, receives, reads, ends, and evaluates a real conversation.

- [ ] **Step 1: Write failing reducer/state tests**

Test loading, optimistic send replacement by server message, duplicate event suppression, ended input disabling, `evaluation.visible` opening the four-choice dialog, and submission closing it.

- [ ] **Step 2: Verify RED**

Run the focused Node test. Expected: state module is missing.

- [ ] **Step 3: Implement state and wire `CustomerChat`**

On mount list the customer's unfinished conversation and load its detail when present; do not create an empty conversation. If none exists, the first send calls create/resume with that text and one generated UUID. Later sends use the message endpoint with one stable UUID per user action. Join the room, mark the latest sequence read, and reload detail on reconnect. Render connection state and the four exact evaluation choices; do not expose the dialog before the server reports it visible.

- [ ] **Step 4: Verify GREEN**

Run focused tests, full frontend tests, and build.

- [ ] **Step 5: Checkpoint**

Search the customer runtime path and confirm it no longer imports or reads `conversationsSeed`.

---

### Task 11: Connect the agent workbench and team queue

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/ServiceWorkspace.jsx`
- Create: `src/agentConversationState.js`
- Create: `src/agentConversationState.test.js`
- Modify: existing workbench CSS only for new lifecycle controls and connection status.

**Interfaces:**
- Consumes Task 9 clients.
- Produces real queue listing, claim, reply, read, release, evaluation invite, and end behavior.

- [ ] **Step 1: Write failing agent state tests**

Test queued/owned filtering, claim transition, realtime message merge, release removal from owned list, reply eligibility, and evaluation invitation state.

- [ ] **Step 2: Verify RED**

Run focused Node tests. Expected: state module is missing.

- [ ] **Step 3: Replace seed-driven runtime operations**

Load queue and owned conversations from REST, keep existing visual mapping in the adapter, and route all mutations through the API. Subscribe to tenant events for queue refresh and conversation events for the open detail. Remove/disable AI takeover in the human-only flow without deleting unrelated AI code used elsewhere.

- [ ] **Step 4: Verify GREEN**

Run focused tests, full frontend tests, and build.

- [ ] **Step 5: Checkpoint**

Search `Workbench` and `TeamDashboard`; `conversationsSeed` must not determine live queue counts, messages, claims, or assignments.

---

### Task 12: Connect tenant and platform conversation monitoring

**Files:**
- Modify: `src/AdminConsole.jsx`
- Create: `src/adminConversationState.js`
- Create: `src/adminConversationState.test.js`
- Modify: `src/admin.css` only for assignment/force-end controls.

**Interfaces:**
- Tenant admins consume list/detail/assign/end.
- Platform admins consume list/detail with mandatory `tenantId` and receive no mutation callbacks.

- [ ] **Step 1: Write failing role-view tests**

Test that tenant mode exposes assign and force-end actions, platform mode requires tenant selection and exposes none, and realtime events cause a scoped list refresh.

- [ ] **Step 2: Verify RED**

Run the focused Node test. Expected: admin state module is missing.

- [ ] **Step 3: Replace static `ConversationMonitor` data**

Fetch list and details through Task 9. Tenant assignment selector uses the existing real agent list and submits `agentId`. Platform requests always send the selected tenant ID. Preserve current visual structure and empty/loading/error states.

- [ ] **Step 4: Verify GREEN**

Run focused tests, full frontend tests, and build.

- [ ] **Step 5: Checkpoint**

Confirm platform markup contains no mutation buttons and tenant actions do not appear for ended/evaluated rows.

---

### Task 13: Configure Nginx and perform end-to-end verification

**Files:**
- Modify: `D:/web/nginx/nginx-1.22.0-web/conf/nginx.conf`
- Modify: `.worktrees/backend-mvp/backend/README.md`
- Modify: `output/Nginx生产部署接入说明-2026-08-25.md`

**Interfaces:**
- `/api/` continues proxying REST to port 4000.
- `/socket.io/` proxies polling and WebSocket Upgrade to port 4000.

- [ ] **Step 1: Add the Nginx proxy block and validate configuration**

Use this exact behavior within the existing server block:

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_read_timeout 120s;
}
```

Run:

```powershell
D:\web\nginx\nginx-1.22.0-web\nginx.exe -t -p D:/web/nginx/nginx-1.22.0-web/
```

Expected: configuration syntax and test are successful.

- [ ] **Step 2: Run backend verification**

```powershell
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run lint
```

Expected: all commands exit 0. If Docker is unavailable, report the E2E environment blocker explicitly and do not claim the E2E suite passed.

- [ ] **Step 3: Run frontend verification and publish `dist`**

From the frontend root:

```powershell
npm test
npm run build
```

Expected: all tests pass and Nginx serves the new `dist` assets.

- [ ] **Step 4: Reload Nginx and verify health**

```powershell
D:\web\nginx\nginx-1.22.0-web\nginx.exe -p D:/web/nginx/nginx-1.22.0-web/ -s reload
Invoke-WebRequest http://localhost/api/v1/health -UseBasicParsing
```

Expected: health returns HTTP 200.

- [ ] **Step 5: Perform two-session acceptance**

Use separate authenticated browser sessions for `customer@xinghe.demo` and `lina@xinghe.demo`:

1. Customer creates and sends a message.
2. Agent sees it in the queue, claims, and replies.
3. Customer receives the reply without refresh and responds.
4. Agent invites evaluation; set a past deadline in the test database or use the real 2-minute interval for final manual acceptance.
5. Customer submits one of the four ratings and both sessions show the evaluated terminal state.
6. Verify the tenant admin can read/reassign/force-end and the platform admin remains read-only.

- [ ] **Step 6: Final scoped diff and status review**

Run `git diff --check` in both repositories, list all modified files, and verify no pre-existing unrelated changes were reformatted or removed. Do not create a broad commit from either dirty worktree.

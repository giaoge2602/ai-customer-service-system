# Dual Frontend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-role mixed authentication page with two independent frontend entry points that route four authenticated roles to four different business pages.

**Architecture:** Keep one React/Vite application and split authentication by route namespace: `/service/*` for agents and customers, `/admin/*` for platform and tenant administrators. The NestJS backend remains the authentication authority; customer registration gains password credentials and a `customer` user role so `/customer/chat` can be protected like the other role homes.

**Tech Stack:** React 19, React Router 7, Vite 7, Node test runner, NestJS 11, Prisma 6, MySQL 8, Jest/Supertest.

**Spec:** `docs/superpowers/specs/2026-08-25-dual-frontend-auth-design.md`

## Global Constraints

- Preserve existing platform, organization, workbench, and customer-chat page implementations.
- Preserve all pre-existing uncommitted user changes in both Git worktrees.
- Use `/service/*` for `agent` and `customer`; use `/admin/*` for `platform_admin` and `tenant_admin`.
- Customers must register and log in before accessing `/customer/chat`.
- Never trust the identity tab selected in the UI; the backend response role controls the session and redirect.
- Authentication rejection must never trigger the offline demo fallback.
- Do not add another frontend project or another build tool.

---

### Task 1: Define portal and role routing rules

**Files:**
- Modify: `src/auth.js`
- Modify: `src/auth.test.js`

**Interfaces:**
- Produces: `PORTAL_ROLES`, `resolvePortal(role)`, `roleMatchesPortal(role, portal)`, `resolveLoginPath(pathname)`, updated `resolveHome(role)` and `canAccessPath(role, pathname)`.
- Consumes: existing role strings and the existing `loginWithDemoFallback()` session shape.

- [ ] **Step 1: Write failing role-boundary tests**

Add tests equivalent to:

```js
assert.equal(resolvePortal('agent'), 'service')
assert.equal(resolvePortal('customer'), 'service')
assert.equal(resolvePortal('platform_admin'), 'admin')
assert.equal(roleMatchesPortal('tenant_admin', 'service'), false)
assert.equal(resolveHome('customer'), '/customer/chat')
assert.equal(resolveLoginPath('/platform/overview'), '/admin/login')
assert.equal(resolveLoginPath('/customer/chat'), '/service/login')
assert.equal(canAccessPath('agent', '/customer/chat'), false)
assert.equal(canAccessPath('customer', '/customer/chat'), true)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test src/auth.test.js
```

Expected: FAIL because portal helpers and the customer home do not exist.

- [ ] **Step 3: Implement the minimal routing helpers**

Implement the exact role sets:

```js
export const PORTAL_ROLES = {
  service: ['agent', 'customer'],
  admin: ['platform_admin', 'tenant_admin'],
}

export function resolvePortal(role) {
  return PORTAL_ROLES.admin.includes(role) ? 'admin' : 'service'
}

export function roleMatchesPortal(role, portal) {
  return PORTAL_ROLES[portal]?.includes(role) || false
}
```

Map `customer` to `/customer/chat`; require `customer` for `/customer/*`; map unauthenticated admin pages to `/admin/login` and service pages to `/service/login`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `node --test src/auth.test.js`.

Expected: all authentication utility tests pass.

- [ ] **Step 5: Commit only the reviewed task diff**

```powershell
git diff -- src/auth.js src/auth.test.js
git add src/auth.js src/auth.test.js
git commit -m "feat：增加双入口角色路由规则"
```

Do not commit if the diff includes unrelated pre-existing edits; defer the commit and record why.

---

### Task 2: Add real customer credentials to backend registration

**Files:**
- Modify: `.worktrees/backend-mvp/backend/prisma/schema.prisma`
- Create: `.worktrees/backend-mvp/backend/prisma/migrations/20260825090000_add_customer_role/migration.sql`
- Modify: `.worktrees/backend-mvp/backend/src/auth/dto/register-customer.dto.ts`
- Modify: `.worktrees/backend-mvp/backend/src/auth/auth.service.ts`
- Modify: `.worktrees/backend-mvp/backend/src/common/auth/authenticated-user.ts`
- Modify: `.worktrees/backend-mvp/backend/test/auth.e2e-spec.ts`
- Modify: `.worktrees/backend-mvp/backend/prisma/seed.ts`

**Interfaces:**
- Consumes: `POST /api/v1/auth/register/customer`.
- Produces: customer registration accepting `{ name, email, password, phone?, source, tenantId }`; login returns role `customer` and tenant context.

- [ ] **Step 1: Write the failing backend e2e test**

Add a test that registers a unique customer email with password, logs in with the same credentials, and asserts:

```ts
expect(login.body.data.user.role).toBe('customer');
expect(login.body.data.user.tenantId).toBe('TENANT-018');
```

Also assert that the customer row and user row are both created and duplicate registration returns HTTP 409.

- [ ] **Step 2: Run the backend test and verify RED**

Run from `.worktrees/backend-mvp/backend`:

```powershell
npm run test:e2e -- --runTestsByPath test/auth.e2e-spec.ts
```

Expected: FAIL because `UserRole.customer` and the customer password field do not exist.

- [ ] **Step 3: Extend the Prisma role enum and migration**

Add `customer` to `UserRole`. The migration must use:

```sql
ALTER TABLE `User`
  MODIFY `role` ENUM('platform_admin','tenant_admin','agent','customer') NOT NULL;
```

- [ ] **Step 4: Extend the DTO and service transaction**

Add a required password with `@MinLength(8)`. In one Prisma transaction:

1. Verify tenant is active.
2. Reject an existing `User.email` or same-tenant customer email.
3. Hash the password with bcrypt cost 10.
4. Create a `User` with role `customer`, tenant ID, active status, and password hash.
5. Create the matching `Customer` profile.
6. Return customer and user identifiers without returning the password hash.

- [ ] **Step 5: Seed one customer login account**

Seed `customer@xinghe.demo` with password `Demo@2026`, role `customer`, tenant `TENANT-018`, and a matching customer profile.

- [ ] **Step 6: Generate Prisma client, deploy migration, and verify GREEN**

Run:

```powershell
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run test:e2e -- --runTestsByPath test/auth.e2e-spec.ts
```

Expected: migration and seed succeed; customer register-login test passes.

- [ ] **Step 7: Commit only the backend task**

Review `git diff` in the backend worktree before staging. Do not include unrelated dirty backend files.

---

### Task 3: Split the authentication UI into two portal variants

**Files:**
- Create: `src/authPortal.js`
- Create: `src/authPortal.test.js`
- Modify: `src/AuthPage.jsx`
- Modify: `src/auth.css`
- Modify: `src/auth.js`

**Interfaces:**
- Consumes: `portal: 'service' | 'admin'`, `mode: 'login' | 'register' | 'recovery'`.
- Produces: `getPortalCategories(portal)`, `getPortalCopy(portal)`, and `AuthPage({ portal, mode, onAuthenticated })`.

- [ ] **Step 1: Write failing portal presentation tests**

Test exact identity sets:

```js
assert.deepEqual(getPortalCategories('service').map((item) => item.key), ['agent', 'customer'])
assert.deepEqual(getPortalCategories('admin').map((item) => item.key), ['platform', 'tenant'])
assert.equal(getPortalCopy('service').loginTitle, '登录服务中心')
assert.equal(getPortalCopy('admin').loginTitle, '登录管理中心')
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test src/authPortal.test.js`.

Expected: FAIL because `authPortal.js` does not exist.

- [ ] **Step 3: Implement portal metadata**

Keep presentation data out of `AuthPage.jsx`. Include system name, eyebrow, title, description, accent class, role cards, login/register/recovery routes, and cross-portal link.

- [ ] **Step 4: Refactor AuthPage to consume portal metadata**

Required behavior:

- Login identity tabs show only the portal's two identities.
- The selected identity affects copy only; the backend response role remains authoritative.
- Reject a successful login response whose role does not belong to the current portal; do not call `onAuthenticated`.
- Registration cards come from `getPortalCategories(portal)`.
- Customer registration includes password, confirmation, and agreement fields.
- All login/register/recovery and cross-portal links stay in the current portal namespace.
- Service and admin pages have distinct headings and accent classes while retaining the existing design language.

- [ ] **Step 5: Update customer registration payload and validation**

Send the customer password and require the same password rules used by agents. Add the customer demo session with role `customer` only if the API is explicitly unavailable.

- [ ] **Step 6: Run frontend tests and build**

Run:

```powershell
node --test src/authPortal.test.js src/auth.test.js
npm run build
```

Expected: tests pass and Vite builds without JSX errors.

- [ ] **Step 7: Commit the reviewed UI task**

Commit only after confirming the diff contains no unrelated formatting churn.

---

### Task 4: Install namespaced routes and protect customer chat

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/auth.test.js`
- Modify: `src/ServiceWorkspace.jsx`

**Interfaces:**
- Consumes: `resolveLoginPath()`, `roleMatchesPortal()`, and `AuthPage.portal`.
- Produces: new `/service/*`, `/admin/*`, and `/customer/chat` routes plus old-route redirects.

- [ ] **Step 1: Add failing route-policy tests**

Add these exact assertions to `src/auth.test.js`:

```js
assert.equal(resolveLoginPath('/platform/overview'), '/admin/login')
assert.equal(resolveLoginPath('/organization/overview'), '/admin/login')
assert.equal(resolveLoginPath('/workbench'), '/service/login')
assert.equal(resolveLoginPath('/customer/chat'), '/service/login')
assert.equal(canAccessPath('customer', '/customer/chat'), true)
assert.equal(canAccessPath('customer', '/workbench'), false)
assert.equal(canAccessPath('agent', '/customer/chat'), false)
```

- [ ] **Step 2: Verify RED**

Run `node --test src/auth.test.js`.

Expected: FAIL for new namespace paths.

- [ ] **Step 3: Implement routes**

Add:

```text
/service/login
/service/register
/service/forgot-password
/admin/login
/admin/register
/admin/forgot-password
/customer/chat
```

Redirect `/login`, `/register`, `/forgot-password`, and `/chat` to their new canonical paths. Update `ProtectedRoute` so an unauthenticated request uses the target page's portal login path. Wrap `CustomerChat` in `ProtectedRoute`.

- [ ] **Step 4: Ensure logout returns to the correct portal**

Admin roles return to `/admin/login`; agents and customers return to `/service/login`. Do not leave a protected page visible after session removal.

- [ ] **Step 5: Run all frontend tests and build**

Run:

```powershell
node --test
npm run build
```

Expected: all tests pass; build exits 0.

---

### Task 5: End-to-end browser verification

**Files:**
- Modify only if verification finds a reproducible defect.

**Interfaces:**
- Consumes: running frontend at `http://127.0.0.1:5173` and backend at `http://127.0.0.1:4000`.
- Produces: evidence that four roles reach four distinct pages through two independent frontend entry points.

- [ ] **Step 1: Start database, backend, and frontend**

Verify MySQL is running, backend health returns status `ok`, and Vite serves the app.

- [ ] **Step 2: Verify the service portal**

Check `/service/login` and `/service/register` visually. Confirm only agent and customer identities appear. Register or use seeded customer credentials, log in, and confirm `/customer/chat` is accessible only after authentication. Confirm agent login reaches `/workbench`.

- [ ] **Step 3: Verify the admin portal**

Check `/admin/login` and `/admin/register` visually. Confirm only platform administrator and tenant administrator identities appear. Confirm their logins reach `/platform/overview` and `/organization/overview` respectively.

- [ ] **Step 4: Verify negative paths**

Confirm an agent account entered on the admin portal is rejected with a link to `/service/login`; confirm an unauthenticated `/customer/chat` request redirects to `/service/login`; confirm old `/login` redirects to `/service/login`.

- [ ] **Step 5: Check responsive layout and console**

Inspect both authentication pages at desktop width and the service portal at a 390×844 viewport. Confirm no clipping, overlapping, or browser console errors.

- [ ] **Step 6: Run final verification**

Run fresh commands:

```powershell
node --test
npm run build
```

From the backend worktree run:

```powershell
npm test -- --runInBand
npm run build
```

Expected: all commands exit 0.

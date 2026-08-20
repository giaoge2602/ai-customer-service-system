# AI Customer Service Backend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone NestJS backend under `backend/` that supports login, tenant-scoped customer management, and the complete conversation lifecycle from creation through agent reply and closure.

**Architecture:** Use one NestJS process with focused health, auth, customers, conversations, and Prisma modules. MySQL is the only external dependency; JWT guards and a tenant-scope service derive authorization from the authenticated user before every business query.

**Tech Stack:** Node.js 20 LTS, NestJS, strict TypeScript, Prisma, MySQL 8, JWT, bcrypt, Swagger/OpenAPI, Jest, Supertest, npm

**Spec:** `docs/superpowers/specs/2026-08-20-ai-customer-service-backend-mvp-design.md`

## Global Constraints

- All backend code lives under `backend/`; existing React application behavior is unchanged.
- REST endpoints use the `/api/v1` prefix; Swagger uses `/api/docs`.
- MySQL 8 is the only runtime dependency. Do not add Redis, MongoDB, PostgreSQL, Elasticsearch, MinIO, queues, WebSocket, Tiledesk, FastGPT, or OneAPI.
- Roles are exactly `platform_admin`, `tenant_admin`, and `agent`.
- Non-platform tenant scope always comes from the verified JWT. A submitted `tenantId` never expands a tenant user's access.
- Success responses use `{ code: 0, data, message, requestId }`; failures use standard HTTP status plus a stable nonzero business code.
- New business behavior follows red-green-refactor: add a focused failing test, observe the intended failure, implement the minimum behavior, and rerun the focused and full relevant suites.
- Use npm and commit `backend/package-lock.json`.
- Preserve all pre-existing uncommitted files outside the exact task file list.

---

## File Map

### Application foundation

- `backend/package.json`: backend scripts and dependencies.
- `backend/package-lock.json`: locked npm dependency graph.
- `backend/tsconfig.json`, `backend/tsconfig.build.json`, `backend/nest-cli.json`: strict TypeScript and Nest build configuration.
- `backend/jest.config.cjs`, `backend/test/jest-e2e.json`: unit and interface-test transforms.
- `backend/eslint.config.mjs`: lint configuration scoped to the backend.
- `backend/.gitignore`: ignores `.env`, coverage, build output, and backend dependencies.
- `backend/src/main.ts`: production process entrypoint.
- `backend/src/create-app.ts`: shared Nest application setup for production and interface tests.
- `backend/src/app.module.ts`: module composition and environment loading.
- `backend/src/common/http/*`: request IDs, response envelopes, and exception mapping.
- `backend/src/common/auth/*`: authenticated-user type, decorators, guards, and tenant resolution.

### Persistence

- `backend/prisma/schema.prisma`: five core models and supporting enums.
- `backend/prisma/seed.ts`: idempotent demo data initialization.
- `backend/prisma/migrations/*`: generated MySQL migration.
- `backend/src/prisma/prisma.module.ts`, `backend/src/prisma/prisma.service.ts`: injectable Prisma client.
- `backend/docker-compose.yml`: one MySQL 8 service.
- `backend/docker/mysql/init/01-create-test-db.sql`: creates the independent interface-test database.
- `backend/.env.example`, `backend/.env.test.example`: non-secret development and test templates.

### Business modules

- `backend/src/health/*`: public health endpoint.
- `backend/src/auth/*`: login, current user, JWT strategy, and DTOs.
- `backend/src/customers/*`: tenant-scoped customer DTOs, controller, and service.
- `backend/src/conversations/*`: tenant-scoped conversation/message DTOs, controller, and service.

### Tests and documentation

- `backend/test/health.e2e-spec.ts`: application envelope and health contract.
- `backend/test/seed.e2e-spec.ts`: idempotent seed contract.
- `backend/test/auth.e2e-spec.ts`: login and current-user contract.
- `backend/test/auth.service.spec.ts`: password verification and JWT payload unit contract.
- `backend/test/tenant-scope.spec.ts`: tenant resolution rules.
- `backend/test/customers.e2e-spec.ts`: customer CRUD, role, and isolation contract.
- `backend/test/conversations.e2e-spec.ts`: full conversation lifecycle and transition rules.
- `backend/test/swagger.e2e-spec.ts`: Swagger route and endpoint coverage.
- `backend/test/helpers/*`: database reset, app lifecycle, and login helpers used only by tests.
- `backend/README.md`: exact setup, migration, seed, run, test, and Swagger commands.

---

### Task 1: Scaffold the Backend and Deliver the Health Contract

**Files:**
- Create: `backend/package.json`
- Create: `backend/package-lock.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/jest.config.cjs`
- Create: `backend/eslint.config.mjs`
- Create: `backend/.gitignore`
- Create: `backend/src/main.ts`
- Create: `backend/src/create-app.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/src/common/http/request-id.middleware.ts`
- Create: `backend/src/common/http/request-with-id.ts`
- Create: `backend/src/common/http/api-response.interceptor.ts`
- Create: `backend/src/common/http/http-exception.filter.ts`
- Create: `backend/src/health/health.module.ts`
- Create: `backend/src/health/health.controller.ts`
- Create: `backend/test/health.e2e-spec.ts`
- Create: `backend/test/jest-e2e.json`

**Interfaces:**
- Produces: `createApp(): Promise<INestApplication>` used by every interface test.
- Produces: `GET /api/v1/health` returning status `ok`, version `1.1.0`, and a request ID.
- Produces: the shared success and error envelopes used by later controllers.

- [ ] **Step 1: Create only the backend toolchain and install dependencies**

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force -Path backend | Out-Null
Set-Location backend
npm init -y
npm install @nestjs/common @nestjs/config @nestjs/core @nestjs/jwt @nestjs/passport @nestjs/platform-express @nestjs/swagger @prisma/client bcrypt class-transformer class-validator passport passport-jwt reflect-metadata rxjs
npm install --save-dev @eslint/js @nestjs/cli @nestjs/schematics @nestjs/testing @types/bcrypt @types/express @types/jest @types/node @types/passport-jwt @types/supertest eslint eslint-config-prettier jest prisma source-map-support supertest ts-jest ts-node tsconfig-paths typescript typescript-eslint
```

Set `backend/package.json` scripts to the following exact command surface:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "lint": "eslint \"{src,test,prisma}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config test/jest-e2e.json --runInBand",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "prisma db seed"
  }
}
```

Configure strict TypeScript with `strict: true`, `noImplicitAny: true`, decorators enabled, `src` as the build root, and `dist` as output. Add `.env`, `dist/`, `coverage/`, and `node_modules/` to `backend/.gitignore`.

Use this unit-test configuration:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};
```

Use this interface-test configuration in `test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testRegex": ".*\\.e2e-spec\\.ts$",
  "transform": { "^.+\\.ts$": ["ts-jest", { "tsconfig": "tsconfig.json" }] },
  "testEnvironment": "node"
}
```

- [ ] **Step 2: Write the failing health interface test**

Create `backend/test/health.e2e-spec.ts` with the desired public behavior:

```typescript
import request from 'supertest';
import { createApp } from '../src/create-app';

describe('health', () => {
  it('returns the deployment-guide health contract with one request id', async () => {
    const app = await createApp();
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Request-Id', 'health-test-request');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('health-test-request');
    expect(response.body).toEqual({
      code: 0,
      data: { status: 'ok', version: '1.1.0' },
      message: 'ok',
      requestId: 'health-test-request',
    });

    const invalidRequestId = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Request-Id', 'contains spaces');
    expect(invalidRequestId.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    await app.close();
  });
});
```

- [ ] **Step 3: Run the test and confirm the RED state**

Run:

```powershell
Set-Location backend
npm run test:e2e -- health.e2e-spec.ts
```

Expected: FAIL because `../src/create-app` and the health route do not exist.

- [ ] **Step 4: Implement the minimum Nest application and health route**

Implement `createApp()` so production and tests share configuration:

```typescript
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api/v1');
  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  return app;
}
```

Define `RequestWithId extends Request { requestId: string }` and use it consistently in the middleware, interceptor, and exception filter. `requestIdMiddleware` must accept an `X-Request-Id` containing 1-128 letters, digits, dots, underscores, or hyphens; otherwise generate `randomUUID()`. Store the value on the request and set the response header. `ApiResponseInterceptor` wraps controller values in the success envelope. `HttpExceptionFilter` preserves the HTTP status, reads an explicit `{ code, message }` exception body when present, and otherwise emits code `5000` with message `服务暂时不可用` for HTTP 500.

Implement `HealthController` exactly at `GET health` and return:

```typescript
{ status: 'ok', version: '1.1.0' }
```

`main.ts` calls `createApp()`, listens on `Number(process.env.PORT ?? 4000)`, and does not contain additional behavior.

- [ ] **Step 5: Verify health, build, and lint**

Run:

```powershell
Set-Location backend
npm run test:e2e -- health.e2e-spec.ts
npm run build
npm run lint
```

Expected: health test PASS, build exit code 0, lint exit code 0.

- [ ] **Step 6: Commit Task 1**

```powershell
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json backend/jest.config.cjs backend/eslint.config.mjs backend/.gitignore backend/src backend/test/health.e2e-spec.ts backend/test/jest-e2e.json
git commit -m "feat：搭建后端服务并提供健康检查"
```

---

### Task 2: Add MySQL Persistence, Migration, and Idempotent Demo Seed

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/docker/mysql/init/01-create-test-db.sql`
- Create: `backend/.env.example`
- Create: `backend/.env.test.example`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/*/migration.sql`
- Create: `backend/prisma/seed.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/test/seed.e2e-spec.ts`
- Create: `backend/test/helpers/database.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/package.json`

**Interfaces:**
- Produces: `PrismaService extends PrismaClient` for all later services.
- Produces: `seedDatabase(prisma: PrismaClient): Promise<void>` with repeatable upserts.
- Produces: MySQL development database `ai_cs` and test database `ai_cs_test`.

- [ ] **Step 1: Define the exact MySQL model and local database configuration**

Create one `mysql:8.0` Compose service named `ai-cs-mysql`, publish `3306`, use a named volume, health-check with `mysqladmin ping`, and set:

```yaml
MYSQL_ROOT_PASSWORD: root_password
MYSQL_DATABASE: ai_cs
MYSQL_USER: ai_cs
MYSQL_PASSWORD: ai_cs_password
```

Create `01-create-test-db.sql`:

```sql
CREATE DATABASE IF NOT EXISTS ai_cs_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ai_cs_test.* TO 'ai_cs'@'%';
```

Use these example URLs:

```dotenv
DATABASE_URL=mysql://ai_cs:ai_cs_password@127.0.0.1:3306/ai_cs
TEST_DATABASE_URL=mysql://ai_cs:ai_cs_password@127.0.0.1:3306/ai_cs_test
JWT_SECRET=replace-this-with-at-least-32-characters
JWT_EXPIRES=7d
PORT=4000
```

Define the Prisma schema with these exact enums, fields, relations, and indexes:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum TenantStatus {
  active
  paused
}

enum UserRole {
  platform_admin
  tenant_admin
  agent
}

enum UserStatus {
  active
  disabled
}

enum ConversationStatus {
  queued
  human
  ended
}

enum ConversationPriority {
  normal
  high
  urgent
}

enum SenderType {
  customer
  agent
  system
}

model Tenant {
  id            String         @id @db.VarChar(64)
  name          String         @db.VarChar(120)
  status        TenantStatus   @default(active)
  users         User[]
  customers     Customer[]
  conversations Conversation[]
  messages      Message[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model User {
  id                    String         @id @db.VarChar(64)
  tenantId              String?        @db.VarChar(64)
  email                 String         @unique @db.VarChar(255)
  passwordHash          String         @db.VarChar(255)
  name                  String         @db.VarChar(80)
  role                  UserRole
  status                UserStatus     @default(active)
  tenant                Tenant?        @relation(fields: [tenantId], references: [id])
  assignedConversations Conversation[] @relation("AssignedAgent")
  sentMessages          Message[]      @relation("MessageSender")
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@index([tenantId, role, status])
}

model Customer {
  id            String         @id @db.VarChar(64)
  tenantId      String         @db.VarChar(64)
  name          String         @db.VarChar(120)
  phone         String?        @db.VarChar(32)
  email         String?        @db.VarChar(255)
  source        String         @db.VarChar(64)
  level         String         @db.VarChar(64)
  tags          Json
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  conversations Conversation[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([tenantId, name])
  @@index([tenantId, email])
}

model Conversation {
  id        String               @id @db.VarChar(64)
  tenantId  String               @db.VarChar(64)
  customerId String              @db.VarChar(64)
  agentId   String?              @db.VarChar(64)
  channel   String               @db.VarChar(64)
  status    ConversationStatus   @default(queued)
  priority  ConversationPriority @default(normal)
  tenant    Tenant               @relation(fields: [tenantId], references: [id])
  customer  Customer             @relation(fields: [customerId], references: [id])
  agent     User?                @relation("AssignedAgent", fields: [agentId], references: [id])
  messages  Message[]
  startedAt DateTime             @default(now())
  endedAt   DateTime?
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt

  @@index([tenantId, status, updatedAt])
  @@index([tenantId, customerId])
  @@index([tenantId, agentId])
}

model Message {
  id             String       @id @db.VarChar(64)
  tenantId       String       @db.VarChar(64)
  conversationId String       @db.VarChar(64)
  senderType     SenderType
  senderId       String?      @db.VarChar(64)
  content        String       @db.VarChar(4000)
  tenant         Tenant       @relation(fields: [tenantId], references: [id])
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User?        @relation("MessageSender", fields: [senderId], references: [id])
  createdAt      DateTime     @default(now())

  @@index([tenantId, conversationId, createdAt])
}
```

- [ ] **Step 2: Start MySQL and generate the initial migration**

Run:

```powershell
Set-Location backend
docker compose up -d
Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev --name init_mvp
```

Expected: MySQL becomes healthy, Prisma client generation exits 0, and the migration creates all five tables plus enums and indexes.

- [ ] **Step 3: Write the failing seed idempotency test**

Create `seed.e2e-spec.ts` to call `seedDatabase(prisma)` twice, then assert exact stable IDs and no duplication:

```typescript
await seedDatabase(prisma);
await seedDatabase(prisma);

expect(await prisma.tenant.count({ where: { id: 'TENANT-018' } })).toBe(1);
expect(await prisma.user.count({
  where: { email: { in: [
    'admin@ai-service.demo',
    'admin@xinghe.demo',
    'lina@xinghe.demo',
  ] } },
})).toBe(3);
expect(await prisma.customer.count({ where: { tenantId: 'TENANT-018' } })).toBe(4);
expect(await prisma.conversation.count({ where: { tenantId: 'TENANT-018' } })).toBeGreaterThanOrEqual(3);
```

The test helper must set `process.env.DATABASE_URL = process.env.TEST_DATABASE_URL`, delete `Message`, `Conversation`, `Customer`, `User`, and `Tenant` in dependency order, and disconnect after the suite.

- [ ] **Step 4: Run the seed test and confirm the RED state**

Run:

```powershell
Set-Location backend
$env:DATABASE_URL='mysql://ai_cs:ai_cs_password@127.0.0.1:3306/ai_cs_test'
npx prisma migrate deploy
npm run test:e2e -- seed.e2e-spec.ts
```

Expected: FAIL because `seedDatabase` is not implemented.

- [ ] **Step 5: Implement the idempotent seed and Prisma module**

Export `seedDatabase(prisma)` and use `upsert` for all fixed IDs. Hash `Demo@2026` with bcrypt before user upserts. Seed these users:

```typescript
[
  { id: 'USR-PLATFORM-001', tenantId: null, role: 'platform_admin', name: '王敏', email: 'admin@ai-service.demo' },
  { id: 'USR-TENANT-001', tenantId: 'TENANT-018', role: 'tenant_admin', name: '赵宁', email: 'admin@xinghe.demo' },
  { id: 'USR-AGENT-001', tenantId: 'TENANT-018', role: 'agent', name: '李楠', email: 'lina@xinghe.demo' },
]
```

Seed customers `C-01842`, `C-01841`, `C-01840`, and `C-01839` with the current frontend names, contact data, sources, levels, and tags. Seed at least `CS-240819-018` as `queued`, `CS-240819-017` as `human` assigned to `USR-AGENT-001`, and `CS-240819-014` as `ended`; upsert their fixed message IDs. Use a transaction so partial seed data is never committed.

Implement `PrismaService` lifecycle methods and export it globally through `PrismaModule`. Register `PrismaModule` in `AppModule`. Configure `prisma.seed` to execute `ts-node prisma/seed.ts`.

- [ ] **Step 6: Verify migration and repeatable seed**

Run:

```powershell
Set-Location backend
$env:DATABASE_URL='mysql://ai_cs:ai_cs_password@127.0.0.1:3306/ai_cs_test'
npx prisma migrate reset --force --skip-seed
npm run test:e2e -- seed.e2e-spec.ts
npm run prisma:seed
npm run prisma:seed
npm run build
```

Expected: seed test PASS, both seed commands exit 0, build exits 0.

- [ ] **Step 7: Commit Task 2**

```powershell
git add backend/docker-compose.yml backend/docker/mysql/init/01-create-test-db.sql backend/.env.example backend/.env.test.example backend/prisma backend/src/prisma backend/src/app.module.ts backend/package.json backend/package-lock.json backend/test/seed.e2e-spec.ts backend/test/helpers/database.ts
git commit -m "feat：新增MySQL模型迁移与演示数据"
```

---

### Task 3: Implement JWT Login and the Tenant Authorization Boundary

**Files:**
- Create: `backend/src/common/auth/authenticated-user.ts`
- Create: `backend/src/common/auth/current-user.decorator.ts`
- Create: `backend/src/common/auth/roles.decorator.ts`
- Create: `backend/src/common/auth/roles.guard.ts`
- Create: `backend/src/common/auth/tenant-scope.service.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/jwt.strategy.ts`
- Create: `backend/test/auth.e2e-spec.ts`
- Create: `backend/test/auth.service.spec.ts`
- Create: `backend/test/tenant-scope.spec.ts`
- Create: `backend/test/helpers/app.ts`
- Create: `backend/test/helpers/auth.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Produces: `AuthenticatedUser { id, tenantId, email, name, role }`.
- Produces: `TenantScopeService.resolve(user, requestedTenantId?): string`.
- Produces: `POST /api/v1/auth/login` and `GET /api/v1/auth/me`.
- Produces: `@CurrentUser()` and `@Roles(...roles)` for later controllers.

- [ ] **Step 1: Write failing tenant-boundary unit tests**

Create `tenant-scope.spec.ts` with these assertions:

```typescript
expect(service.resolve(tenantAdmin, 'TENANT-OTHER')).toBe('TENANT-018');
expect(service.resolve(agent, undefined)).toBe('TENANT-018');
expect(service.resolve(platformAdmin, 'TENANT-018')).toBe('TENANT-018');
expect(() => service.resolve(platformAdmin, undefined)).toThrow(BadRequestException);
expect(() => service.resolve({ ...agent, tenantId: null }, undefined)).toThrow(ForbiddenException);
```

- [ ] **Step 2: Run the tenant test and confirm the RED state**

Run:

```powershell
Set-Location backend
npm test -- tenant-scope.spec.ts
```

Expected: FAIL because `TenantScopeService` does not exist.

- [ ] **Step 3: Implement the minimum tenant-scope service**

Implement `resolve` with this exact decision order:

```typescript
if (user.role === 'platform_admin') {
  if (!requestedTenantId) {
    throw new BadRequestException({ code: 2001, message: '超级管理员必须指定 tenantId' });
  }
  return requestedTenantId;
}
if (!user.tenantId) {
  throw new ForbiddenException({ code: 2002, message: '当前账号缺少租户上下文' });
}
return user.tenantId;
```

Run `npm test -- tenant-scope.spec.ts` and expect PASS.

- [ ] **Step 4: Write failing auth-service unit tests**

Create `auth.service.spec.ts` with a real bcrypt hash and real `JwtService`, replacing only the Prisma query boundary with a fixed test double. Assert that correct credentials return a token whose decoded payload contains `sub`, `role`, `tenantId`, and `email`:

```typescript
const result = await service.login({
  email: 'ADMIN@XINGHE.DEMO',
  password: 'Demo@2026',
});
const payload = jwtService.verify(result.accessToken);
expect(payload).toMatchObject({
  sub: 'USR-TENANT-001',
  role: 'tenant_admin',
  tenantId: 'TENANT-018',
  email: 'admin@xinghe.demo',
});
```

Add two rejection tests: unknown email and incorrect password must both reject with `UnauthorizedException` carrying code `1001` and message `账号或密码错误`.

- [ ] **Step 5: Run the auth unit test and confirm the RED state**

Run:

```powershell
Set-Location backend
npm test -- auth.service.spec.ts
```

Expected: FAIL because `AuthService` does not exist.

- [ ] **Step 6: Write failing login and current-user interface tests**

Reset and seed the test database, then assert:

```typescript
const login = await request(server)
  .post('/api/v1/auth/login')
  .send({ email: 'admin@xinghe.demo', password: 'Demo@2026' });

expect(login.status).toBe(201);
expect(login.body.data.user).toMatchObject({
  id: 'USR-TENANT-001',
  tenantId: 'TENANT-018',
  role: 'tenant_admin',
  email: 'admin@xinghe.demo',
});
expect(typeof login.body.data.accessToken).toBe('string');

const me = await request(server)
  .get('/api/v1/auth/me')
  .set('Authorization', `Bearer ${login.body.data.accessToken}`);
expect(me.status).toBe(200);
expect(me.body.data.id).toBe('USR-TENANT-001');
```

Add two invalid-login assertions, one for an unknown email and one for a wrong password; both must return HTTP 401, code `1001`, and message `账号或密码错误`.

- [ ] **Step 7: Run auth interface tests and confirm the RED state**

Run:

```powershell
Set-Location backend
npm run test:e2e -- auth.e2e-spec.ts
```

Expected: FAIL with HTTP 404 for `/api/v1/auth/login`.

- [ ] **Step 8: Implement auth, JWT strategy, decorators, and role guard**

`LoginDto` validates a normalized email and non-empty password. `AuthService.login` finds an active user by lowercase email, compares bcrypt hashes, and signs this payload:

```typescript
{
  sub: user.id,
  role: user.role,
  tenantId: user.tenantId,
  email: user.email,
}
```

Return `{ accessToken, user: { id, tenantId, email, name, role } }`. `JwtStrategy.validate` reloads the active user and returns `AuthenticatedUser`; missing or disabled users receive HTTP 401. Configure the JWT secret from `JWT_SECRET`, reject startup values shorter than 32 characters, and use `JWT_EXPIRES ?? '7d'`.

Protect `/auth/me` with Passport JWT. Implement `@Roles` metadata and a guard that rejects roles not listed by a controller method with HTTP 403 and code `2003`.

- [ ] **Step 9: Verify auth and tenant behavior**

Run:

```powershell
Set-Location backend
npm test -- tenant-scope.spec.ts
npm test -- auth.service.spec.ts
npm run test:e2e -- auth.e2e-spec.ts
npm run build
npm run lint
```

Expected: all focused tests PASS, build and lint exit 0.

- [ ] **Step 10: Commit Task 3**

```powershell
git add backend/src/common/auth backend/src/auth backend/src/app.module.ts backend/test/auth.e2e-spec.ts backend/test/auth.service.spec.ts backend/test/tenant-scope.spec.ts backend/test/helpers/app.ts backend/test/helpers/auth.ts
git commit -m "feat：实现JWT登录与租户权限边界"
```

---

### Task 4: Implement Tenant-Scoped Customer APIs

**Files:**
- Create: `backend/src/customers/dto/customer-query.dto.ts`
- Create: `backend/src/customers/dto/create-customer.dto.ts`
- Create: `backend/src/customers/dto/update-customer.dto.ts`
- Create: `backend/src/customers/customers.controller.ts`
- Create: `backend/src/customers/customers.module.ts`
- Create: `backend/src/customers/customers.service.ts`
- Create: `backend/test/customers.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Produces: `CustomersService.list/get/create/update` with explicit tenant IDs.
- Produces: `GET/POST/PATCH /api/v1/customers` routes from the specification.
- Consumes: `TenantScopeService.resolve`, `AuthenticatedUser`, and `PrismaService`.

- [ ] **Step 1: Write failing customer interface tests**

Create a second test tenant and tenant administrator directly through Prisma. Log in as the seeded tenant administrator and agent. Test these behaviors:

```typescript
const created = await request(server)
  .post('/api/v1/customers')
  .set('Authorization', `Bearer ${tenantAdminToken}`)
  .send({
    tenantId: 'TENANT-OTHER',
    name: 'MVP 客户',
    phone: '13800000001',
    email: 'mvp@example.com',
    source: 'web',
    level: '普通客户',
    tags: ['MVP'],
  });
expect(created.status).toBe(201);
expect(created.body.data.tenantId).toBe('TENANT-018');
```

Then assert:

- list pagination returns `items`, `page`, `pageSize`, and `total`;
- `search=MVP` finds the created record;
- detail and patch operate within `TENANT-018`;
- an agent receives HTTP 403 from POST and PATCH;
- the other tenant receives HTTP 404 when requesting the created customer ID;
- platform admin receives HTTP 400 without `tenantId` and succeeds with `tenantId=TENANT-018`.
- a body containing an unknown field returns HTTP 400 because global validation forbids non-whitelisted input.

- [ ] **Step 2: Run customer tests and confirm the RED state**

Run:

```powershell
Set-Location backend
npm run test:e2e -- customers.e2e-spec.ts
```

Expected: FAIL with HTTP 404 for `/api/v1/customers`.

- [ ] **Step 3: Implement customer DTOs and service**

Use the following DTO contract:

```typescript
class CustomerQueryDto {
  page = 1;
  pageSize = 20;
  search?: string;
  tenantId?: string;
}

class CreateCustomerDto {
  tenantId?: string;
  name!: string;
  phone?: string;
  email?: string;
  source!: string;
  level!: string;
  tags: string[] = [];
}
```

Decorate numeric pagination with integer, minimum, and maximum validators; limit `pageSize` to 100. Validate email when present, constrain `name/source/level` to non-empty strings, and validate `tags` as an array of strings. `UpdateCustomerDto` makes the mutable customer fields optional and does not allow `tenantId` changes.

Service methods receive the resolved `tenantId`, include it in every Prisma `where`, and use `randomUUID()` for new IDs. A missing record throws HTTP 404 with code `3001` and message `客户不存在`.

- [ ] **Step 4: Implement controller authorization**

Protect all customer routes with JWT. Allow list and detail to all three roles. Restrict create and patch to `platform_admin` and `tenant_admin`. Resolve tenant scope before calling the service; pass body/query `tenantId` only to `TenantScopeService.resolve`.

- [ ] **Step 5: Verify customer behavior**

Run:

```powershell
Set-Location backend
npm run test:e2e -- customers.e2e-spec.ts
npm test
npm run build
npm run lint
```

Expected: customer tests PASS, existing unit tests PASS, build and lint exit 0.

- [ ] **Step 6: Commit Task 4**

```powershell
git add backend/src/customers backend/src/app.module.ts backend/test/customers.e2e-spec.ts
git commit -m "feat：新增租户隔离的客户管理接口"
```

---

### Task 5: Implement the Complete Conversation Lifecycle

**Files:**
- Create: `backend/src/conversations/dto/conversation-query.dto.ts`
- Create: `backend/src/conversations/dto/create-conversation.dto.ts`
- Create: `backend/src/conversations/dto/send-message.dto.ts`
- Create: `backend/src/conversations/conversations.controller.ts`
- Create: `backend/src/conversations/conversations.module.ts`
- Create: `backend/src/conversations/conversations.service.ts`
- Create: `backend/test/conversations.e2e-spec.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Produces: list, create, detail, claim, reply, and end conversation routes.
- Produces: state transitions `queued -> human -> ended`.
- Consumes: `TenantScopeService`, `AuthenticatedUser`, `PrismaService`, and seeded users/customers.

- [ ] **Step 1: Write the failing full-lifecycle interface test**

Log in as `admin@xinghe.demo` and `lina@xinghe.demo`. Create a customer, then run this sequence:

```typescript
const conversation = await request(server)
  .post('/api/v1/conversations')
  .set('Authorization', `Bearer ${tenantAdminToken}`)
  .send({
    customerId,
    channel: 'web',
    priority: 'normal',
    firstMessage: '我需要人工帮助',
  });
expect(conversation.status).toBe(201);
expect(conversation.body.data.status).toBe('queued');

const claimed = await request(server)
  .post(`/api/v1/conversations/${conversationId}/claim`)
  .set('Authorization', `Bearer ${agentToken}`);
expect(claimed.body.data).toMatchObject({
  status: 'human',
  agentId: 'USR-AGENT-001',
});

const reply = await request(server)
  .post(`/api/v1/conversations/${conversationId}/messages`)
  .set('Authorization', `Bearer ${agentToken}`)
  .send({ content: '您好，我来协助处理。' });
expect(reply.body.data.senderType).toBe('agent');

const ended = await request(server)
  .post(`/api/v1/conversations/${conversationId}/end`)
  .set('Authorization', `Bearer ${agentToken}`);
expect(ended.body.data.status).toBe('ended');
expect(ended.body.data.endedAt).not.toBeNull();
```

Also assert:

- detail includes ordered messages;
- list filters by `status`, `channel`, and `customerId` and returns pagination metadata;
- creating a conversation for another tenant's customer returns HTTP 404;
- claiming a non-queued conversation returns HTTP 409;
- an agent cannot reply to or end another agent's conversation;
- an ended conversation rejects claim and reply with HTTP 409;
- platform admin can list/create/detail with a target tenant but receives HTTP 403 for claim, reply, and end.
- a reply containing only whitespace returns HTTP 400.

- [ ] **Step 2: Run conversation tests and confirm the RED state**

Run:

```powershell
Set-Location backend
npm run test:e2e -- conversations.e2e-spec.ts
```

Expected: FAIL with HTTP 404 for `/api/v1/conversations`.

- [ ] **Step 3: Implement query and command DTOs**

`ConversationQueryDto` contains validated `page`, `pageSize`, optional `tenantId`, optional enum `status`, optional `channel`, and optional `customerId`. `CreateConversationDto` contains optional `tenantId`, required `customerId`, required non-empty `channel`, optional enum `priority` defaulting to `normal`, and required `firstMessage` with length 1-4000. `SendMessageDto` contains only `content` with length 1-4000 after trimming.

- [ ] **Step 4: Implement list, create, and detail**

Every query includes the resolved `tenantId`. `create` first verifies the customer with `{ id: customerId, tenantId }`, then uses one Prisma transaction to create the `queued` conversation and first `customer` message. `detail` includes customer, assigned agent without `passwordHash`, and messages ordered by `createdAt asc`. Missing records throw code `3101`, message `会话不存在`, and HTTP 404.

- [ ] **Step 5: Implement claim, reply, and end transitions**

Implement the exact guards before mutation:

```typescript
if (conversation.status !== 'queued') {
  throw new ConflictException({ code: 4101, message: '当前会话无法接管' });
}
```

Claim sets `agentId=user.id`, sets status `human`, and writes a system message in one transaction. Reply requires status `human`; for role `agent`, require `agentId === user.id`, then create an `agent` message. End rejects `ended`; for role `agent`, require the same ownership, then set status `ended`, set `endedAt`, and write a system message in one transaction. Ownership failures return HTTP 403 and code `2101`.

Protect list/create/detail for all roles. Protect claim/reply/end with `@Roles('tenant_admin', 'agent')`, which excludes platform admins.

- [ ] **Step 6: Verify conversation behavior and regressions**

Run:

```powershell
Set-Location backend
npm run test:e2e -- conversations.e2e-spec.ts
npm run test:e2e -- customers.e2e-spec.ts auth.e2e-spec.ts health.e2e-spec.ts
npm test
npm run build
npm run lint
```

Expected: all focused and regression tests PASS, build and lint exit 0.

- [ ] **Step 7: Commit Task 5**

```powershell
git add backend/src/conversations backend/src/app.module.ts backend/test/conversations.e2e-spec.ts
git commit -m "feat：实现客服会话接管回复与结束链路"
```

---

### Task 6: Publish Swagger and Document Local Operation

**Files:**
- Create: `backend/test/swagger.e2e-spec.ts`
- Create: `backend/README.md`
- Modify: `backend/src/create-app.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/customers/customers.controller.ts`
- Modify: `backend/src/conversations/conversations.controller.ts`
- Modify: `backend/src/health/health.controller.ts`
- Modify: `backend/.env.example`
- Modify: `backend/.env.test.example`

**Interfaces:**
- Produces: Swagger UI and JSON at `/api/docs` and `/api/docs-json`.
- Produces: documented bearer authentication, DTO schemas, and all 13 MVP endpoints.
- Produces: copyable setup and verification workflow.

- [ ] **Step 1: Write the failing Swagger test**

Create `swagger.e2e-spec.ts`:

```typescript
const ui = await request(server).get('/api/docs');
expect(ui.status).toBe(200);

const document = await request(server).get('/api/docs-json');
expect(document.status).toBe(200);
expect(document.body.info.version).toBe('1.1.0');
expect(Object.keys(document.body.paths)).toEqual(expect.arrayContaining([
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/me',
  '/api/v1/customers',
  '/api/v1/customers/{id}',
  '/api/v1/conversations',
  '/api/v1/conversations/{id}',
  '/api/v1/conversations/{id}/claim',
  '/api/v1/conversations/{id}/messages',
  '/api/v1/conversations/{id}/end',
]));
```

- [ ] **Step 2: Run Swagger test and confirm the RED state**

Run:

```powershell
Set-Location backend
npm run test:e2e -- swagger.e2e-spec.ts
```

Expected: FAIL with HTTP 404 for `/api/docs`.

- [ ] **Step 3: Configure Swagger and annotate the public contract**

In `createApp()`, build a document with title `AI 智能客服后端 MVP`, version `1.1.0`, and bearer auth named `jwt`. Register UI at `api/docs` and JSON at `/api/docs-json`. Add `@ApiTags`, `@ApiBearerAuth('jwt')`, operation summaries, path parameters, and DTO property metadata so all public inputs appear in the generated schema.

- [ ] **Step 4: Write the backend README with exact commands**

Document:

```powershell
cd backend
npm install
docker compose up -d
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

Document demo password `Demo@2026`, the three demo emails, API base `http://localhost:4000/api/v1`, Swagger `http://localhost:4000/api/docs`, test-database setup, `npm test`, `npm run test:e2e`, `npm run build`, and `npm run lint`. State clearly that the MVP has no AI, real-time messaging, or external platform integration.

- [ ] **Step 5: Verify Swagger and documentation commands**

Run:

```powershell
Set-Location backend
npm run test:e2e -- swagger.e2e-spec.ts customers.e2e-spec.ts conversations.e2e-spec.ts
npm run build
npm run lint
```

Expected: tests PASS, Swagger document contains all paths, build and lint exit 0.

- [ ] **Step 6: Commit Task 6**

```powershell
git add backend/src/create-app.ts backend/src/health backend/src/auth backend/src/customers backend/src/conversations backend/test/swagger.e2e-spec.ts backend/test/customers.e2e-spec.ts backend/test/conversations.e2e-spec.ts backend/README.md backend/.env.example backend/.env.test.example
git commit -m "docs：补充后端Swagger与本地运行说明"
```

---

### Task 7: Run the Full Acceptance Gate

**Files:**
- Modify only if a verification failure reveals a defect in a file created by Tasks 1-6.

**Interfaces:**
- Consumes: every endpoint, migration, seed, build, lint, and test command from the approved specification.
- Produces: fresh evidence for all acceptance claims without expanding MVP scope.

- [ ] **Step 1: Recreate the test database from migrations and seed twice**

Run:

```powershell
Set-Location backend
docker compose up -d
$env:DATABASE_URL='mysql://ai_cs:ai_cs_password@127.0.0.1:3306/ai_cs_test'
npx prisma migrate reset --force --skip-seed
npm run prisma:seed
npm run prisma:seed
```

Expected: migration reset and both seed runs exit 0 without duplicate-key failures.

- [ ] **Step 2: Run the complete backend verification suite**

Run:

```powershell
Set-Location backend
npm test
npm run test:e2e
npm run lint
npm run build
```

Expected: all unit and interface tests PASS; lint and build exit 0 with no errors.

- [ ] **Step 3: Verify the existing frontend remains unaffected**

Run from the repository root:

```powershell
Set-Location ..
npm test
npm run build
```

Expected: the pre-existing frontend tests and production build exit 0. If a failure predates the backend work, record the exact output and do not modify unrelated frontend files.

- [ ] **Step 4: Verify scope and working-tree boundaries**

Run:

```powershell
git diff --check
git status --short
git log --oneline -8
```

Confirm every new implementation file is under `backend/`, plan/spec files remain under `docs/superpowers/`, and pre-existing uncommitted frontend or temporary files were neither staged nor rewritten.

If Steps 1-4 expose a defect, return to the task that owns that behavior, add or strengthen the failing test there, apply the minimum fix, rerun that task's focused commands, and then repeat the complete acceptance gate. Do not create an empty verification commit.

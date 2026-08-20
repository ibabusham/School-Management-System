# How Swagger Works in This Project

Swagger UI is hosted at **`/api-docs`**. The spec is built from **`@swagger` JSDoc comments** in each API route file under `app/api/`.

## The flow

```
Zod schemas (validation in app/api/*/schemas.ts)
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
lib/swagger/schemas.ts              @swagger JSDoc in route.ts
(shared component schemas)            (path, method, request, responses)
        │                                      │
        └──────────────┬───────────────────────┘
                       ▼
              lib/swagger.ts (next-swagger-doc)
                       │
                       ▼
              /api-docs (Swagger UI)
```

## Files

### `lib/swagger.ts`

Uses `next-swagger-doc` to scan `app/api` for `@swagger` comments and merge them with shared `components.schemas` and `BearerAuth`.

### `lib/swagger/schemas.ts`

Defines reusable OpenAPI schemas (`LoginRequest`, `StudentResponse`, etc.) generated from your Zod validation schemas.

### Route files (`app/api/**/route.ts`)

Add a `@swagger` block **directly above** each exported handler (`GET`, `POST`, `PATCH`, `DELETE`):

```ts
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */
export const POST = createRouteHandler(loginSchema, async (...) => { ... });
```

### `app/api-docs/page.tsx`

Renders Swagger UI using the generated spec.

## Adding a new endpoint

1. Create the route + Zod schema as usual
2. If needed, add request/response schemas to `lib/swagger/schemas.ts`
3. Add `@swagger` JSDoc above the handler in the route file
4. Open `/api-docs` to verify

## Auth in Swagger UI

Protected routes use `security: [{ BearerAuth: [] }]`. Click **Authorize**, paste the `accessToken` from `POST /api/auth/login`, then try protected endpoints.

## Mental model

- **Routes + Zod** = real API behavior and validation
- **`@swagger` in route.ts** = documents that specific endpoint
- **`lib/swagger/schemas.ts`** = shared `$ref` schemas so you don't repeat field definitions
- **`/api-docs`** = live Swagger UI

# BRAIN.md — Kaiyō Digital Studio

> **Single Source of Truth** for the Kaiyō project.
> Read this before making changes.

---

## 1. Project Overview

A digital studio marketing site with a MongoDB-backed CMS admin panel. Nearly all
content is admin-managed: public pages read the CMS document server-side, admin
writes go through one endpoint.

**This is a single Next.js application.** There is no separate backend server to
run or scale — the API is Route Handlers. See §5.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 13.5.1 | App Router, Route Handlers, Server Components |
| UI | React 18.2 | UI library |
| Styling | Tailwind CSS 3.3.3 | Utility-first CSS |
| Database | MongoDB via Mongoose 8.9.5 | ODM (Atlas SRV in production) |
| Passwords | bcryptjs 2.4.3 | Cost 12 |
| Validation | Zod 3.24.1 | Request-body schemas |
| Testing | mongodb-memory-server | Ephemeral DB for `npm test` |

No Redux, Axios, Express, JWT, Cloudinary, or Mongoose-HTTP.

---

## 3. Directory Structure

```
├── app/                       # Pages + Route Handlers (framework-mandated paths)
│   ├── api/                   # All /api/* endpoints
│   ├── solution/[slug]/       # CMS-backed solution detail + inquiry form
│   ├── admin/                 # Admin panel
│   ├── not-found.tsx          # Root not-found boundary
│   └── uploads/[...path]/     # Dev-only media serving
├── components/
│   ├── solutions/             # SolutionPage (listing) + SolutionDetail (detail)
│   ├── sections/              # Navbar, Footer, Hero, …
│   └── admin/                 # Admin-only components
├── lib/                       # BROWSER-side code (4 files)
│   ├── cms-types.ts  use-cms.ts  contact-info.ts  admin-client.ts
├── backend/                   # SERVER-side code
│   ├── lib/                   # 16 server-only modules
│   ├── models/                # 8 Mongoose models
│   └── scripts/               # create-admin, migrate, setup-indexes, tests
├── middleware.ts              # Edge redirect for /admin/* (must be at root)
├── data/cms.json              # Legacy snapshot; NOT read at runtime
└── .env.example               # Authoritative env documentation
```

---

## 4. The Two Folders

| Folder | Runs on | Contains |
|--------|---------|----------|
| `lib/` | Browser **and** server | Types, client hooks, admin fetch wrapper |
| `backend/lib/` | **Server only** | DB, auth, guards, validation, storage, CMS store |

**Rule:** if a module imports Mongoose, `process.env` secrets, or Node built-ins it
belongs in `backend/lib/`. If a `"use client"` component imports it, it belongs in
`lib/`.

Import with the `@/` alias: `@/backend/lib/db`, `@/lib/cms-types`.

---

## 5. Why the Backend Is Split Across Two Folders

| File | Location | Why it cannot move |
|------|----------|--------------------|
| `app/api/**/route.ts` | Next.js App Router | Next maps HTTP endpoints to `route.ts` **by directory**. A handler outside `app/` is not routed. |
| `app/uploads/[...path]/route.ts` | Next.js App Router | Same catch-all rule. |
| `middleware.ts` | Project root | Next only loads the edge middleware from the root. |

Everything not path-mandated lives in `backend/`.

**Do not "finish" the move by relocating Route Handlers.** It silently 404s every
API call while TypeScript still passes, because `@/` is only a path alias.

---

## 6. Database

### 6.1 Connection
`backend/lib/db.ts` → `db()` memoises the connection promise (production caches in
a module-scoped promise, development additionally on `globalThis` so hot reload does
not reopen the pool). A rejected promise is never cached, so a later request retries.

The connection string has exactly **one** source of truth: `env.mongoUri` in
`backend/lib/env.ts`.

| Environment | `MONGODB_URI` unset |
|---|---|
| production | **throws** — refuses to serve |
| development | falls back to `mongodb://127.0.0.1:27017/kaiyo` |

`assertValidMongoUri()` checks the scheme and rejects whitespace. **The value is
never included in an error message** — connection strings carry credentials.
`redactMongoUri()` is used before logging.

Connection lifecycle (`error` / `disconnected` / `reconnected`) is logged once per
process, without the connection string.

Options: `serverSelectionTimeoutMS: 10_000`, `socketTimeoutMS: 45_000`,
`maxPoolSize: 10`, `minPoolSize: isProd ? 1 : 0`, `autoIndex: !isProd`,
`strictQuery: true`.

### 6.2 Indexes — production does NOT create them
`autoIndex` is off in production, so **run `npm run db:indexes` once after the first
production deploy.** Without it there is no unique constraint on `admins.email` and
no TTL reaper for `adminsessions` / `ratelimits`, which grow forever.

`backend/scripts/setup-indexes.js` uses `collection.createIndex()`, which is
**additive only**. It deliberately does *not* use `syncIndexes()`, which drops any
index not declared in the schema.

```bash
npm run db:indexes -- --check   # report only, changes nothing
npm run db:indexes               # create missing indexes
```

### 6.3 Collections

| Collection | Purpose | Key indexes |
|------------|---------|-------------|
| `admins` | Admin accounts; `passwordHash` is `select:false` | `email` unique |
| `adminsessions` | Live sessions; only SHA-256 of the token is stored | `tokenHash` unique; `expiresAt` TTL |
| `cmscontents` | Single editable CMS document (`_id: "singleton"`) | built-in `_id` |
| `testimonials` | Testimonials with moderation state | `publicId` unique |
| `contactsubmissions` | Contact messages (personal data) | `publicId` unique |
| `leads` | Solution detail inquiries (personal data) | `publicId` unique |
| `mediaassets` | Upload metadata, incl. public testimonial avatars | `kind`, `storageKey` |
| `ratelimits` | Fixed-window counters | `key` unique; `resetAt` TTL |

### 6.4 CMS write path
Exactly one write path: `PUT /api/cms` → `applyCmsPatch()` → `cmsPatchSchema` →
`persistSections()`. Testimonials are synced only when the patch carries
`testimonials.items`. Composed reads are capped at `MAX_COMPOSED_CHILDREN` (500) to
match the schema cap, so a save can never silently truncate a larger collection.

---

## 7. Authentication

* bcrypt cost 12, `select: false`; opportunistic rehash on login. The hash stores
  the admin **PIN** — sign-in is PIN-only, there is no password field.
* **Sign-in accepts any stored PIN** — no policy is imposed at login, so a PIN set
  before the current policy existed still works (`pinLoginSchema` checks shape and
  bcrypt's 72-byte input limit only). **Choosing a new one** (`changePinSchema`)
  applies `validatePasswordStrength`: at least 10 characters with an uppercase
  letter, a lowercase letter and a number — the same rule the Change Admin PIN form
  advertises. `backend/scripts/create-admin.js` still sets digits-only 4–12 PINs.
  `Admin.email` is an identity record, not a sign-in identifier.
* Login mints a 256-bit opaque token; only `sha256(token)` is persisted.
* Cookies: `kaiyo-admin-token` (HttpOnly, Secure in prod, SameSite=Lax),
  `kaiyo-admin-csrf` (JS-readable, HMAC of the session token).
* Token rotated on every login and password change (session-fixation defence).
* Sessions expire on **inactivity**, enforced server-side on every request using the
  account's own `security.autoLogoutMinutes` (default 60), so the Admin Settings
  control is the real policy and not a client-side decoration.
* CSRF: `x-kaiyo-csrf` header must equal the cookie and the HMAC; `Origin` host is
  compared against `NEXT_PUBLIC_SITE_URL`.
* `requireAdmin` / `requireAdminMutation` (API), `requireAdminPage` (pages) and
  `resolveAdminSession` (CMS admin scope) all require `role === 'admin'`.
  A non-admin account therefore cannot read contact submissions, inquiries or
  pending testimonials.
* Passwords are capped at **72 bytes** (bcrypt's input limit), measured with
  `Buffer.byteLength`, so multi-byte characters cannot be silently truncated.
* Sign-in is PIN-only. The submitted PIN is compared with `bcrypt.compare` against
  **every** active administrator, so the work done does not depend on which account
  matched. Because the PIN is shared, a failed attempt increments the counter on all
  active accounts and the lockout is therefore shared — an attacker cannot escape it
  by rotating accounts.
* `middleware.ts` checks cookie *presence* only — it cannot verify an HMAC at the
  edge. A forged cookie passes it and is rejected by the guards with 401/403.

---

## 8. API Endpoints

🌐 public · 🔒 admin session + `admin` role · 🔒✍ admin + CSRF

| Method | Path | Access |
|--------|------|--------|
| `GET` | `/api/cms` | 🌐 / 🔒 (with `x-kaiyo-admin: 1`) |
| `PUT` | `/api/cms` | 🔒✍ |
| `GET`/`POST`/`DELETE` | `/api/admin/login` | 🌐 |
| `POST` | `/api/admin/logout` | 🔒✍ |
| `POST` | `/api/admin/pin` | 🔒✍ |
| `GET`/`PUT` | `/api/admin/security` | 🔒 / 🔒✍ |
| `GET`/`DELETE` | `/api/admin/sessions` | 🔒 / 🔒✍ |
| `GET`/`POST`/`DELETE` | `/api/admin/media` | 🔒 / 🔒✍ / 🔒✍ |
| `GET` | `/api/admin/overview` | 🔒 |
| `GET`/`PUT`/`DELETE` | `/api/admin/leads` | 🔒 / 🔒✍ / 🔒✍ |
| `GET`/`POST`/`DELETE` | `/api/contact-submissions` | 🔒 / 🌐 / 🔒✍ |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/testimonials` | 🔒 / 🌐 / 🔒✍ / 🔒✍ |
| `POST` | `/api/testimonials/avatar` | 🌐 |
| `POST` | `/api/leads` | 🌐 |
| `POST`/`GET` | `/api/calculator/quote` `/tiers` | 🌐 |
| `GET` | `/api/health` | 🌐 |

Full detail: [`docs/BACKEND.md`](docs/BACKEND.md).

---

## 9. Environment

`.env.example` is authoritative; `.env.local` is git-ignored.

**Browser-exposed (the only one):** `NEXT_PUBLIC_SITE_URL`.

**Server-only:** `MONGODB_URI`, `SESSION_SECRET`, `CSRF_SECRET`,
`MEDIA_STORAGE_DRIVER`, `BLOB_READ_WRITE_TOKEN`, `S3_*`, `S3_AUTH_TOKEN`.

**Script-only:** `ADMIN_EMAIL`, `ADMIN_PIN`, `ADMIN_NAME`.

**Test-only:** `MONGODB_URI_TEST`, `TEST_PORT`, `TEST_VERBOSE`.

**Opt-in:** `TRUSTED_PROXY` — rate limiting ignores `x-forwarded-for` unless this is
`1`. Set it only when a proxy you control rewrites those headers.

**Required in production:** `MONGODB_URI`, `SESSION_SECRET`, `CSRF_SECRET`,
`NEXT_PUBLIC_SITE_URL`. The app **refuses to boot** if any is missing.

---

## 10. Commands

```bash
npm run dev           # http://localhost:3000
npm run build
npm start
npm run lint
npm run typecheck
npm run create-admin  # first administrator
npm run migrate:cms   # one-off import of data/cms.json
npm run db:indexes    # production indexes (additive)
npm test              # build + 152-assertion backend suite
```

---

## 11. Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Every API call 404s | Route Handler moved out of `app/` | Move it back |
| Unknown `/solution/<slug>` shows the not-found page with a **200** | Next 13.5 flushes headers before a dynamic page runs | Documented limitation; use `generateStaticParams` only if the slug list is static |
| Admin save returns 403 "Cross-origin" | `NEXT_PUBLIC_SITE_URL` wrong or unset in production | Set it to the real origin |
| `MONGODB_URI is not configured` | Not set in the deployment | Set it; the app will not guess |
| Uploads 503 in production | `MEDIA_STORAGE_DRIVER=local` | Use `vercel-blob` (recommended) or `s3` |
| `SESSION_SECRET must be at least 32 characters` | Too short | `openssl rand -base64 48` |
| Upload fails against real S3 | SigV4 is not implemented | Use `vercel-blob` |
| Test suite fails oddly | Another process owns port 3111 | The suite now refuses to run; stop it or set `TEST_PORT` |
| `next build` fails with `PageNotFoundError` on a page that exists | `next dev` and `next build` share one `.next` | Never run them at once. `npm test` parks the build while its media suite runs `next dev`, and restores it afterwards |
| `npm start` fails with `ENOENT .next/BUILD_ID` | A dev server overwrote the production build | Re-run `npm run build`, and do not leave `next dev` running against the same directory |

---

## 12. Known limitations

* `/solution/[slug]` is dynamic, so an unknown slug returns the not-found UI with a
  **200** rather than 404 (Next.js 13.5 behaviour, verified against a live server).
* `/solutions` (the index) does not exist — links to it 404. Pre-existing.
* Single shared admin PIN. Change it with `POST /api/admin/pin`
  (requires the current PIN) or reset it with
  `npm run create-admin -- --force`. Neither accepts a PIN as a command-line
  argument.
* `output: "standalone"` makes `next start` warn; harmless on Vercel.
* Rate limits are per **fixed** window.
* The calculator quote budget (120 / 60 min per IP) is metered on the request source;
  behind no trustworthy proxy every caller shares one bucket (the documented
  fail-closed behaviour of `clientIp`).
* The `s3` driver has no AWS SigV4 signing.

---

*Verified against the codebase. Update this file and `docs/BACKEND.md` together.*
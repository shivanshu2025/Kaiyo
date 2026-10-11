# Kaiyō — Backend

MongoDB-backed backend for the Kaiyō site and admin panel. Route Handlers run inside
the existing Next.js App Router deployment; there is no separate server to host or
scale.

---

## 1. Architecture at a glance

```
Browser
  │
  ├─ Public pages (server components) ──► readCmsData / readPublicCmsData ──► MongoDB
  │                                     getSiteSettings
  │
  └─ Admin dashboard (client components)
        │
        ├─ lib/admin-client.ts   (adds CSRF header, handles 401 → /admin/login)
        ▼
   /api/*  route handlers
        │
        ├─ backend/lib/guards.ts         (session + role + CSRF + origin)
        ├─ backend/lib/validation.ts     (zod)
        ├─ backend/lib/rate-limit.ts     (MongoDB counters)
        ▼
     Mongoose models ──► MongoDB
                          (+ backend/lib/storage.ts → Vercel Blob / S3 for media)
```

### Collections

| Collection      | Purpose | Notable indexes |
| --------------- | ------- | --------------- |
| `admins`        | Admin accounts. `passwordHash` is `select:false`. | `email` (unique) |
| `adminsessions` | Live sessions; only the SHA-256 of the token is stored. TTL on `expiresAt`. | `tokenHash` (unique), `adminId`, `{adminId, lastActivityAt}` |
| `cmscontents`   | Single editable CMS document (`_id: "singleton"`). | `_id` |
| `testimonials`  | Client testimonials with moderation state. | `publicId` (unique), `{status, displayOrder, createdAt}` |
| `contactsubmissions` | Contact form messages (personal data). | `publicId` (unique), `{status, createdAt}` |
| `mediaassets`   | Upload metadata; bytes live in object storage. | `storageKey`, `{kind, createdAt}` |
| `ratelimits`    | Fixed-window counters. TTL on `resetAt`. | `key` (unique) |

---

## 2. Authentication

### Password storage

bcrypt (cost 12) via `backend/lib/password.ts`. The hash lives on the `Admin` document with
`select: false`, so it is never attached to a query result by default.

There is **no default account and no environment-variable password fallback**. Until
`backend/scripts/create-admin.js` has created an administrator, `POST /api/admin/login`
always answers `401 Invalid credentials` and every admin route returns `401`.

bcrypt only reads the first 72 bytes of a password, so `validatePasswordStrength`
caps the advertised maximum at 72 characters — otherwise two passwords sharing a
72-byte prefix would compare equal.

### Sessions

* Login mints a 256-bit random token (`crypto.randomBytes(32)`).
* Only `sha256(token)` is persisted, so a database disclosure yields no usable cookie.
* Cookies:
  * `kaiyo-admin-token` — `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`
  * `kaiyo-admin-csrf` — readable by JS, carries an HMAC of the session token
* Every successful sign-in mints a **new** token, which is the session-fixation
  defence: a token planted before login is never promoted to an authenticated one.
* Logout revokes the `AdminSession` document. A copied token stops working
  immediately, because that document is what the gate trusts.
* Sessions expire on **inactivity** (`lastActivityAt` + `autoLogoutMinutes`), not
  just on age. `AdminIdleGuard` is the client-side convenience; the server is the
  boundary.

### Authorization

`requireAdmin` / `requireAdminMutation` run on **every** protected route and on the
dashboard layout. They check, in order: session validity → account `active` →
`role === 'admin'` → CSRF header → `Origin` host.

The middleware in `middleware.ts` only redirects based on cookie *presence*; it
cannot verify an HMAC or reach the database at the edge. The authoritative checks
are the layout and the guards, which is why a forged cookie passes middleware and
is then rejected with `401`/`403`.

### Brute-force defences

| Control | Default | Where |
| ------- | ------- | ----- |
| IP rate limit on login | 10 / 15 min | `backend/lib/rate-limit.ts` |
| Per-account lockout | 5 failures → 15 min | `admins.failedAttempts` / `lockedUntil` |
| Contact form | 5 / 10 min per IP | same |
| Testimonial form | 5 / 60 min per IP | same |
| Duplicate submit window | 15 s (same IP + message) | `app/api/contact-submissions` |
| Honeypot fields | `website` | contact + testimonial |

All of the limits above are configurable per admin from Admin Settings, and the
values shown there are the values the backend actually enforces.

---

## 3. API reference

Every response uses one envelope:

```jsonc
// success
{ "success": true, "data": <payload>, "message": "…" }   // 200 / 201
// failure
{ "success": false, "error": "…", "fields": { "field": "message" } }  // 4xx / 5xx
```

`fields` is present only on validation failures (`422`). Error responses never
include a stack trace, driver message, connection string or password hash.

**Access legend:** 🌐 public · 🔒 admin session + `admin` role · 🔒✍ admin + CSRF header.

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| `GET` | `/api/cms` | 🌐 / 🔒 | Published content. With `x-kaiyo-admin: 1` **and** a valid admin session, also returns contact submissions and unpublished testimonials. |
| `PUT` | `/api/cms` | 🔒✍ | Partial content update. Validated by `cmsPatchSchema`. |
| `DELETE` | `/api/cms` | — | Always `405`; the document cannot be deleted. |
| `POST` | `/api/admin/login` | 🌐 | `{ email?, password }` → session cookies. `401` bad credentials, `422` bad input, `429` rate-limited/locked. |
| `GET` | `/api/admin/login` | 🔒 | Current session probe. |
| `POST` | `/api/admin/logout` | 🔒✍ | Revokes the session and clears both cookies. Idempotent. |
| `POST` | `/api/admin/pin` | 🔒✍ | `{ currentPassword, newPassword, confirmPassword }`. Verifies the current credential, stores a new hash, revokes every session and re-issues the caller's. |
| `GET` | `/api/admin/security` | 🔒 | Effective limits, lockout state, password-updated timestamp, live sessions. |
| `PUT` | `/api/admin/security` | 🔒✍ | `{ maxFailedAttempts?, lockoutMinutes?, autoLogoutMinutes? }`, clamped on both write and read. |
| `GET` | `/api/admin/sessions` | 🔒 | Live sessions with the current one flagged. |
| `DELETE` | `/api/admin/sessions` | 🔒✍ | `{ id }` revokes one, `{ others: true }` all others, `{ all: true }` everything. |
| `GET` | `/api/admin/media` | 🔒 | Paginated upload library. `?kind=image\|video`, `?page=`, `?limit=`. |
| `POST` | `/api/admin/media` | 🔒✍ | `multipart/form-data`, one or more `files`, optional `kind`. |
| `DELETE` | `/api/admin/media?id=` | 🔒✍ | Deletes the object and its metadata record. |
| `GET` | `/api/admin/overview` | 🔒 | Real aggregate counts, site-settings summary, last-saved timestamp. |
| `GET` | `/api/contact-submissions` | 🔒 | Paginated submissions. **Personal data — never exposed publicly.** |
| `POST` | `/api/contact-submissions` | 🌐 | `{ name, email, message, phone?, interest?, website? }`. `201` / `409` duplicate / `422` / `429`. |
| `DELETE` | `/api/contact-submissions?id=` | 🔒✍ | Deletes one submission. |
| `GET` | `/api/testimonials` | 🔒 | Paginated, published and pending. |
| `POST` | `/api/testimonials` | 🌐 | Public submission. Always stored as `pending`. |
| `PUT` | `/api/testimonials` | 🔒✍ | `{ id, ...fields }` — edit, publish (`status: "published"`) or unpublish. |
| `DELETE` | `/api/testimonials?id=` | 🔒✍ | Deletes one testimonial. |
| `POST` | `/api/calculator/quote` | 🌐 | `{ projectValue, role }` → authoritative quote. |
| `GET` | `/api/calculator/tiers` | 🌐 | Enabled commission tiers and value bounds. |
| `GET` | `/uploads/<key>` | — | Dev only. Serves files from the `local` driver; returns `404` in production. |

### CSRF

Every mutating request needs the `x-kaiyo-csrf` header carrying the value of the
`kaiyo-admin-csrf` cookie. `lib/admin-client.ts` does this automatically for the
dashboard. Requests are additionally rejected when the `Origin` host differs from
`NEXT_PUBLIC_SITE_URL`.

### Why the calculator cannot be gamed

`POST /api/calculator/quote` accepts only `projectValue` and `role`. The commission
percentage is looked up from the persisted `calculator.tiers` table, the project
value is clamped to `projectValue.minValue…maxValue`, the result is rounded to
`calculatorLogic.rounding` decimals and capped at `calculatorLogic.maxEarning`.
A client cannot submit its own percentage, and unknown roles are rejected `404`.

---

## 4. Setup

### 4.1 Environment

```bash
cp .env.example .env.local
```

Required:

| Variable | Notes |
| -------- | ----- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/kaiyo` locally; an Atlas SRV string in production. |
| `CSRF_SECRET` | ≥32 chars in production. |
| `SESSION_SECRET` | ≥32 chars in production. |
| `NEXT_PUBLIC_SITE_URL` | The site's real origin; also used for the CSRF `Origin` check. |
| `MEDIA_STORAGE_DRIVER` | `local` (dev only) · `vercel-blob` · `s3`. |

Generate the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Optional: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (used only by
`backend/scripts/create-admin.js`), and the blob/S3 variables in `.env.example`.

> The legacy `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `ADMIN_AUTH_SECRET` variables are
> **no longer read by the application**. Remove them from your deployment.

### 4.2 Create the administrator

Run from a trusted machine. Do not commit credentials.

```bash
ADMIN_EMAIL="you@example.com" \
ADMIN_PASSWORD="a-strong-passphrase" \
npm run create-admin
```

Or omit `ADMIN_PASSWORD` to be prompted with hidden input:

```bash
ADMIN_EMAIL="you@example.com" npm run create-admin
```

Rules the script enforces:

* The password is read from the environment or a hidden prompt — **never** a CLI
  argument, so it cannot land in shell history or the process table.
* Strength is validated (≥10 chars, upper, lower, digit) before anything is written.
* Re-running with an existing email exits non-zero and changes nothing. Use
  `-- --force` to reset the password of an existing account.
* The password and the hash are never printed.
* Nothing destructive: no collection is dropped, truncated, or deleted. Existing
  sessions for that account are revoked so a stolen token stops working.

### 4.3 Migrate existing content (one-off)

The previous backend stored content in `data/cms.json`. That file is no longer
read at runtime. To carry existing edits over:

```bash
npm run migrate:cms
```

It upserts the CMS document, testimonials and submissions, and refuses to run
without `-- --force` if a CMS document already exists.

If you skip this, the store seeds itself from `backend/lib/cms-defaults.ts` on first read.

---

## 5. Running and testing

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # production server
npm run typecheck
npm run lint
npm test           # builds, then runs the backend suite
```

`npm test` (`scripts/test-backend.js`) starts a real MongoDB
(`mongodb-memory-server`), creates accounts with `backend/scripts/create-admin.js`, boots
`next start`, and drives the API over HTTP — 72 assertions covering
authentication, authorization, CSRF, rate limiting, lockout, CRUD, privacy,
calculator integrity, media round trips and error handling. A development server
is started afterwards to exercise the upload path that production deliberately
blocks for the local driver.

Set `MONGODB_URI_TEST` to run against an existing database instead.

---

## 6. Media storage

Uploads must not live on the deployment filesystem: a Vercel/Netlify filesystem is
rebuilt on every deploy.

| Driver | Config | Notes |
| ------ | ------ | ----- |
| `local` | `MEDIA_STORAGE_DRIVER=local` | Writes to `./.uploads`, served by `/uploads/[...path]`. **Refuses to run in production** (`503` with an explanatory message). |
| `vercel-blob` | `MEDIA_STORAGE_DRIVER=vercel-blob`, `BLOB_READ_WRITE_TOKEN` | Vercel Blob over its REST API. |
| `s3` | `MEDIA_STORAGE_DRIVER=s3`, `S3_UPLOAD_BASE`, `S3_PUBLIC_BASE`, `S3_DELETE_BASE` | Any S3-compatible endpoint. |

Upload safety:

* The declared `Content-Type` is ignored; the real type comes from the file's magic
  bytes (`backend/lib/upload.ts`). SVG containing `<script>` is rejected.
* Limits: images 8 MB, videos 100 MB, 10 files per request.
* Storage keys are server-generated (`image/2026-01-01/<random>.png`), so a client
  filename can never become a path — traversal and overwrite are structurally
  impossible.
* Delete takes the key from the database record, never from the request.

---

## 7. Deploying

### Vercel

1. Import the repository (the project is linked to `shivanshu2025/Kaiyo`).
2. Add the environment variables above to **all** environments.
3. Provision MongoDB (Atlas or any reachable Mongo 6+). Allow-list the deployment's
   egress addresses if your provider requires it.
4. Configure persistent media storage — `vercel-blob` or `s3`. Leaving
   `MEDIA_STORAGE_DRIVER=local` will make uploads fail with `503` by design.
5. Create the administrator from a local checkout or a secure shell, not from CI.

### Netlify

`netlify.toml` is present and uses `@netlify/plugin-nextjs`. The same environment
variables and database requirements apply. Use the `s3` or `vercel-blob` driver.

### Backups and rollbacks

* Enable continuous backups / a daily snapshot on your MongoDB provider. The CMS
  document plus `testimonials`, `contactsubmissions` and `mediaassets` are the only
  irreplaceable data; `adminsessions` and `ratelimits` are disposable.
* Rolling back the application is a redeploy — there are no schema migrations that
  break older code, because the additive index declarations are created
  automatically (`autoIndex` is on outside production; create them explicitly in
  production if your provider blocks background index builds).
* Rolling back *data* means restoring the provider snapshot.

---

## 8. Known limitations

* **Single-admin login form.** The existing login page has one credential field.
  The API accepts an optional `email`; when exactly one administrator exists it is
  unambiguous. With several accounts, `email` becomes required — add a field to the
  form at that point.
* **`output: "standalone"`** in `next.config.js` makes `next start` warn. It is
  harmless on Vercel (which ignores it) but can be removed if you deploy elsewhere.
* **Rate limits are per fixed window**, not a sliding window. A burst at a window
  boundary can briefly allow `2 × limit` requests.
* **`data/cms.json`** is retained only as the input for `npm run migrate:cms`; it is
  ignored at runtime and no longer updated.

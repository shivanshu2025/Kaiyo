# Kaiyō — Backend

MongoDB-backed backend for the Kaiyō site and admin panel. Route Handlers run inside
the existing Next.js App Router deployment; there is no separate server to host or
scale.

---

## 1. Architecture at a glance

```
Browser
  ├─ Public pages (server components) ──► readPublicCmsData ──► MongoDB
  └─ Admin dashboard (client components)
        └─ lib/admin-client.ts   (adds CSRF header, handles 401 → /admin/login)
             ▼
        /api/*  route handlers
             ├─ backend/lib/guards.ts      (session + role + CSRF + origin)
             ├─ backend/lib/validation.ts  (zod)
             ├─ backend/lib/rate-limit.ts  (MongoDB counters)
             ▼
        backend/models/* ──► MongoDB
              (+ backend/lib/storage.ts → local | vercel-blob | s3)
```

### Collections

| Collection      | Purpose | Notable indexes |
| --------------- | ------- | --------------- |
| `admins`        | Admin accounts. `passwordHash` is `select:false`. | `email` (unique) |
| `adminsessions` | Live sessions; only the SHA-256 of the token is stored. TTL on `expiresAt`. | `tokenHash` (unique), `expiresAt` (TTL) |
| `cmscontents`   | Single editable CMS document (`_id: "singleton"`). | built-in `_id` |
| `testimonials`  | Client testimonials with moderation state. | `publicId` (unique) |
| `contactsubmissions` | Contact form messages (personal data). | `publicId` (unique) |
| `leads`         | Solution detail inquiries (personal data). | `publicId` (unique) |
| `mediaassets`   | Upload metadata; bytes live in object storage. | `storageKey`, `kind` |
| `ratelimits`    | Fixed-window counters. TTL on `resetAt`. | `key` (unique), `resetAt` (TTL) |

---

## 2. Database connection

`backend/lib/db.ts` memoises the connection promise so a request never opens a
second pool. `backend/lib/env.ts` is the **only** place `MONGODB_URI` is read.

| Environment | `MONGODB_URI` unset |
|---|---|
| production | throws — the app refuses to serve |
| development | falls back to `mongodb://127.0.0.1:27017/kaiyo` |

The value is validated (scheme, whitespace) but **never** included in an error
message, because a connection string contains the username and password.
`redactMongoUri()` strips credentials before anything is logged.

Connection lifecycle events (`error`, `disconnected`, `reconnected`) are logged
once per process, again without the connection string.

### 2.1 MongoDB Atlas setup

1. **Database user** — Atlas → *Access Control* → *Database Users* → add a user with
   **Read and write to any database**. Atlas Admin is unnecessary and grants more
   than this app uses.
2. **Network Access** — Atlas → *Network Access*:
   - **Vercel**: add the project's static outbound IPs. "Allow access from anywhere"
     is acceptable for a static marketing site but is a diagnostic, not a default.
   - **Netlify**: same, via the build/outbound address list.
   - **Local development**: add your own public IP. Use `0.0.0.0/0` only
     temporarily, and remove it afterwards.
3. Copy the SRV string from the Atlas *Connect* dialog into `.env.local`:

   ```
   mongodb+srv://<db_username>:<db_password>@<cluster>/<database_name>?retryWrites=true&w=majority
   ```

   The password must be URL-encoded (`@` → `%40`, `:` → `%3A`, `#` → `%23`,
   `/` → `%2F`, `?` → `%3F`, `%` → `%25`).
4. Never commit it. `.env.local` is git-ignored; production uses the host's
   environment settings.

### 2.2 Production indexes

`autoIndex` is **off** in production, so no index is created automatically — not the
unique constraint on `admins.email`, and not the TTL reapers that let MongoDB remove
expired sessions and rate-limit counters.

Run once after the first production deploy:

```bash
MONGODB_URI="mongodb+srv://..." npm run db:indexes -- --check   # inspect, changes nothing
MONGODB_URI="mongodb+srv://..." npm run db:indexes               # create what is missing
```

To inspect manually:

```bash
mongosh "$MONGODB_URI" --eval 'db.admins.getIndexes()'
```

`setup-indexes.js` uses `collection.createIndex()`, which is **additive only** — it
never drops an index, a collection, or a document. It deliberately avoids
`syncIndexes()`, which would remove any index not declared in the schema. If existing
data already violates a unique index, the driver reports a duplicate-key error naming
the index; fix the data deliberately rather than letting a tool delete it.

---

## 3. Authentication

### PIN storage and verification

Admin sign-in is **PIN-only** — there is no username or password field. The PIN is
verified with bcrypt (cost 12) via `backend/lib/password.ts` against
`Admin.passwordHash`, which is `select: false`. The plaintext PIN is never stored,
logged, or returned.

* **Policy:** two different rules, because two different questions are asked.
  *Signing in* (`pinLoginSchema`) imposes **no** policy beyond shape and bcrypt's
  72-byte input limit, so a PIN stored before the current rule existed still works.
  *Choosing a new one* (`changePinSchema`) applies `validatePasswordStrength` in
  `backend/lib/password.ts`: **at least 10 characters with an uppercase letter, a
  lowercase letter and a number** — the same rule the Change Admin PIN form
  advertises, from the same function, so the two cannot drift. `create-admin.js`
  still sets digits-only 4–12 PINs.
  Each failure is reported against the offending field (`newPin` / `confirmPin` /
  `currentPin`); the Change Admin PIN screen renders those messages beside the
  input rather than only as a banner.
* **Current-PIN proof:** `POST /api/admin/pin` re-verifies `currentPin` with
  `bcrypt.compare` against the authenticated administrator's stored hash before
  anything is written, then rotates the caller's session and revokes the rest.
* **No default PIN and no environment-variable fallback.** Until
  `backend/scripts/create-admin.js` has run, every sign-in fails with
  `Incorrect PIN`.
* **Identity:** `Admin.email` remains required and unique as an ownership record, but
  it is *not* a sign-in identifier. The submitted PIN is compared against every
  active administrator, and the loop continues past a match so the amount of bcrypt
  work does not reveal which account matched or how many exist.
* **Shared lockout:** because the PIN is shared, a failed attempt increments
  `failedAttempts` on *all* active accounts, so an attacker cannot escape the
  lockout by rotating accounts. A successful sign-in resets them all.
* **Rate limiting:** 10 attempts / 15 min per IP, on top of the shared lockout.
* **Timing:** when no account exists, a throwaway bcrypt comparison is performed
  first so the response time does not distinguish "no admin" from "wrong PIN".

### Setting or changing the PIN

Never accepted as a command-line argument (it would land in shell history and the
process table). Either:

```bash
ADMIN_EMAIL="you@example.com" ADMIN_PIN="123456" npm run create-admin
npm run create-admin            # hidden interactive prompt
```

or, while signed in, **Admin Settings → Change PIN** (`POST /api/admin/pin` with
`{ currentPin, newPin, confirmPin }`), which requires the current PIN, revokes every
other session, and rotates the caller's own.

To recover from a forgotten PIN, re-run `npm run create-admin -- --force` against
that account's email.

#### The script must point at the database Vercel reads

`create-admin.js` writes to whatever database `MONGODB_URI` names. It loads
`.env.local` then `.env` **before** reading that variable, and refuses to connect
when the value is not a real connection string — a placeholder such as
`<db_username>` or `YOUR_PRODUCTION_MONGODB_URI` is rejected with an explanatory
error rather than reaching the driver and failing as an opaque `MongoParseError`.

Run it from the `frontend` directory and confirm the target before trusting it:

```
Connecting to mongodb+srv://***@<cluster>/kaiyo (database "kaiyo") ...
```

If that database name is not the one production uses, the account was created in
the wrong place and production has no admin at all. Set the same connection string
in Vercel (`Settings → Environment Variables → MONGODB_URI`) that the local
`.env.local` holds for production setup; never commit it.

#### "Sign-in fails in production" — diagnose the status code first

A wrong PIN is a **401** whose body carries `Incorrect PIN`. Check the status code
before touching credentials:

```bash
curl -i https://<your-domain>/api/admin/login            # 401 when simply signed out
curl -i -X POST https://<your-domain>/api/admin/login \
  -H 'Content-Type: application/json' -d '{"pin":"000000"}'
```

* **401** — the PIN really is wrong; the database is reachable.
* **500** with `Something went wrong. Please try again.` — the route threw before
  comparing anything, so the PIN is irrelevant. The cause is the deployment's
  database connection: `MONGODB_URI` missing or a placeholder in Vercel, or Atlas
  *Network Access* not allowing the platform's egress. The public site keeps
  returning 200 in this state because only DB-backed routes fail.
* **429** — the per-source rate limit; wait for the window to pass.

To confirm an account exists without exposing anything:

```bash
mongosh "$MONGODB_URI" --quiet --eval \
  'db.admins.find({},{projection:{email:1,role:1,active:1,lastLoginAt:1}}).toArray()'
```

This prints no PIN and no hash.

### Sessions

* Login mints a 256-bit token (`crypto.randomBytes(32)`); only `sha256(token)` is
  stored, so a database disclosure yields no usable cookie.
* Cookies: `kaiyo-admin-token` (HttpOnly, Secure in production, SameSite=Lax) and
  `kaiyo-admin-csrf` (JS-readable, HMAC of the session token).
* Every sign-in mints a **new** token — the session-fixation defence.
* Logout revokes the `AdminSession` document, so a copied token stops working
  immediately.
* Sessions expire on **inactivity**, not just on age. The window is the account's
  own `security.autoLogoutMinutes` (5–720, default 60), read from the `Admin`
  document on every resolution by `resolveAuth` — the value set through
  `PUT /api/admin/security` is what the server enforces, not a constant. The
  `AdminIdleGuard` client component uses the same value, but only to sign the admin
  out promptly; it is a convenience, not the boundary. An idle session past its
  window is revoked server-side (`revokedByIp: 'idle-timeout'`), not merely refused.

### Authorization

`requireAdmin` / `requireAdminMutation` (API routes), `requireAdminPage` (dashboard
pages) and `resolveAdminSession` (`GET /api/cms` admin scope) all require
`role === 'admin'`. A lower-privilege `editor` therefore cannot read contact
submissions, inquiries, or pending testimonials, and cannot mutate the CMS.

`middleware.ts` only redirects on cookie *presence*; it cannot verify an HMAC at the
edge. The guards are the boundary, which is why a forged cookie passes middleware and
is then rejected with 401/403.

### Brute-force defences

| Control | Default | Where |
| ------- | ------- | ----- |
| IP rate limit on login | 10 / 15 min | `backend/lib/rate-limit.ts` |
| Per-account lockout | 5 failures → 15 min | `admins.failedAttempts` / `lockedUntil` |
| Contact form | 5 / 10 min per IP | same |
| Testimonial form | 5 / 60 min per IP | same |
| Duplicate submit window | 15 s | `app/api/contact-submissions` |
| Solution inquiry | 3 / 30 min per IP, 20 / 30 min per slug | `app/api/leads` |
| Avatar upload | 5 / 60 min per IP | `app/api/testimonials/avatar` |
| Calculator quote | 120 / 60 min per IP | `app/api/calculator/quote` |
| Honeypot fields | `website` | contact, testimonial, lead |

### Client IP

Forwarded headers are **ignored unless `TRUSTED_PROXY=1`**. On Vercel/Netlify (or
behind a proxy you control) set it so per-IP limits work. On a directly exposed
server, leave it unset — otherwise anyone could spoof `x-forwarded-for` to bypass a
limit or burn someone else's budget.

---

## 4. API reference

Every response uses one envelope:

```jsonc
{ "success": true,  "data": <payload>, "message": "…" }   // 200 / 201
{ "success": false, "error": "…", "fields": { "field": "message" } }  // 4xx / 5xx
```

**Access legend:** 🌐 public · 🔒 admin session + `admin` role · 🔒✍ admin + CSRF header.

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| `GET` | `/api/cms` | 🌐 / 🔒 | Published content. With `x-kaiyo-admin: 1` **and** an `admin`-role session, also returns contact submissions and unpublished testimonials. An `editor` gets the public projection. |
| `PUT` | `/api/cms` | 🔒✍ | Partial content update. Validated by `cmsPatchSchema`. Rate limited to 300 writes/hour per administrator (`RATE_LIMITS.cmsWrite`). |
| `DELETE` | `/api/cms` | — | Always `405`. |
| `POST` | `/api/admin/login` | 🌐 | `{ pin }` → session cookies. `401` wrong PIN, `422` malformed, `429` rate-limited/locked. |
| `GET` | `/api/admin/login` | 🔒 | Session probe. |
| `POST` | `/api/admin/logout` | 🔒✍ | Revokes the session, clears cookies. Idempotent. |
| `POST` | `/api/admin/pin` | 🔒✍ | Change PIN; revokes every session and re-issues the caller's. |
| `GET`/`PUT` | `/api/admin/security` | 🔒 / 🔒✍ | Effective limits, lockout state, live sessions. |
| `GET`/`DELETE` | `/api/admin/sessions` | 🔒 / 🔒✍ | List and revoke sessions. |
| `GET`/`POST`/`DELETE` | `/api/admin/media` | 🔒 / 🔒✍ / 🔒✍ | Media library. `DELETE` takes `?id=`: a malformed id is `400`, an unknown one `404`. |
| `GET` | `/api/admin/overview` | 🔒 | Live aggregate counts, the site-settings summary and the last-saved timestamp. The Overview screen's only data source. |
| `POST` | `/api/admin/testimonials` | 🔒✍ | Creates one testimonial, published immediately. The admin counterpart to the public `POST /api/testimonials`, which always forces `pending`. |
| `GET`/`PUT`/`DELETE` | `/api/admin/leads` | 🔒 / 🔒✍ / 🔒✍ | Solution inquiries. |
| `GET` | `/api/contact-submissions` | 🔒 | Paginated submissions. **Personal data.** |
| `POST` | `/api/contact-submissions` | 🌐 | `201` / `409` duplicate / `422` / `429`. |
| `PUT` | `/api/contact-submissions` | 🔒✍ | `{ id, status }` — `new` / `read` / `archived`. `422` on any other value, `404` on an unknown id. |
| `DELETE` | `/api/contact-submissions?id=` | 🔒✍ | Deletes one submission. |
| `GET` | `/api/testimonials` | 🔒 | Paginated, published and pending. |
| `POST` | `/api/testimonials` | 🌐 | Public submission, always stored as `pending`. |
| `PUT`/`DELETE` | `/api/testimonials` | 🔒✍ | Edit, publish, unpublish, reorder (`displayOrder`), delete. |
| `POST` | `/api/testimonials/avatar` | 🌐 | `multipart/form-data`, one `file`. Returns `{ url }` and records the object as a `MediaAsset`, so it is listed — and deletable — in the admin media library. |
| `POST` | `/api/leads` | 🌐 | Solution inquiry. `404` if the slug is not in the CMS. |
| `POST` | `/api/calculator/quote` | 🌐 | `{ projectValue, role }` → authoritative quote. `429` once the per-IP budget is spent. |
| `GET` | `/api/calculator/tiers` | 🌐 | Enabled commission tiers. |
| `GET` | `/api/health` | 🌐 | `200` when MongoDB is reachable, `503` otherwise. |
| `GET` | `/uploads/<key>` | — | Dev only; `404` in production. |

### Why a testimonial avatar needs an upload endpoint

`safeUrl` accepts only http(s) URLs and site-relative paths, so a base64 `data:`
payload is **rejected** — correctly, since inline `data:` in CMS content is a stored
XSS vector. The browser therefore uploads the file to
`POST /api/testimonials/avatar` and submits the returned URL. That endpoint is the
only public write to storage, so it is deliberately narrow: images only, real type
from magic bytes, SVG rejected outright, 8 MB ceiling, one file per request, rate
limited, and a server-generated storage key.

### CSRF

Every mutating request needs `x-kaiyo-csrf` carrying the `kaiyo-admin-csrf` cookie.
`lib/admin-client.ts` does this automatically. Requests are additionally rejected
when the `Origin` host differs from `NEXT_PUBLIC_SITE_URL`.

### Why the calculator cannot be gamed

`POST /api/calculator/quote` accepts only `projectValue` and `role`. The percentage
is read from the persisted tier table, the value is clamped, the result rounded and
capped. A client cannot submit its own percentage; unknown roles are `404`, and a
whitespace-only role is rejected too.

### Why testimonial records are not saved through the CMS document

`PUT /api/cms` still accepts `testimonials.items`, but **no admin screen sends it**.
The Admin > Testimonials screen used to, and that was a data-loss bug: the store
treated the submitted array as the complete truth and deleted every record missing
from it. That is only safe when the admin has the entire collection on screen, and
they never do — `readCmsData()` composes at most `MAX_COMPOSED_CHILDREN` (500)
rows, and the screen now loads a single page.

Records are therefore addressed one at a time (`POST /api/admin/testimonials`,
`PUT`/`DELETE /api/testimonials`), and the list is read from the paginated
`GET /api/testimonials`. The page heading is still CMS content and is saved
through `PUT /api/cms` — with `hero` only.

As defence in depth, `syncTestimonials` now computes its delete set as
`composed \ submitted`, so even a direct API caller cannot delete a record that
was never in the composed view.

---

## 5. Setup

```bash
cp .env.example .env.local
# set MONGODB_URI, CSRF_SECRET, SESSION_SECRET, NEXT_PUBLIC_SITE_URL
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then create the administrator:

```bash
npm run create-admin
```

Password rules: ≥10 characters, upper, lower, digit, and ≤72 **bytes**.

---

## 6. Media storage

Uploads must not live on the deployment filesystem.

| Driver | Config | Notes |
| ------ | ------ | ----- |
| `local` | `MEDIA_STORAGE_DRIVER=local` | Writes `./.uploads`, served by `/uploads/[...path]`. **Refuses to run in production** (`503`). |
| `vercel-blob` | `MEDIA_STORAGE_DRIVER=vercel-blob`, `BLOB_READ_WRITE_TOKEN` | **Recommended for production.** Vercel Blob over its REST API. |
| `s3` | `MEDIA_STORAGE_DRIVER=s3`, `S3_UPLOAD_BASE`, `S3_PUBLIC_BASE`, `S3_DELETE_BASE` | Any endpoint accepting an anonymous or static-token `PUT`. **AWS SigV4 is not implemented**, so this does not work against real Amazon S3. Optional `S3_AUTH_TOKEN`. |

Upload safety:

* The declared `Content-Type` is ignored; the real type comes from magic bytes
  (`backend/lib/upload.ts`). SVG containing `<script>` is rejected.
* Limits: images 8 MB, videos 100 MB, 10 files per request (admins).
* Storage keys are server-generated, so a client filename can never become a path.
* Delete takes the key from the database record, never from the request.

---

## 7. Running and testing

```bash
npm install
npm run dev
npm run build
npm start
npm run typecheck
npm run lint
npm test
```

`npm test` builds, then runs `backend/scripts/test-backend.js`: a real MongoDB
(`mongodb-memory-server`), accounts created through `create-admin.js`, `next start`
and a development server, driven over HTTP. Set `MONGODB_URI_TEST` to use an
existing database instead.

If port 3111 is occupied the suite refuses to run rather than silently testing
whatever else is listening. Use `TEST_PORT` to choose another.

---

## 8. Deploying

### Vercel

1. Import the repository.
2. Set `MONGODB_URI`, `CSRF_SECRET`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `MEDIA_STORAGE_DRIVER` and the driver token **in every environment**. The app
   fails to boot if a required one is missing — by design.
3. Provision MongoDB and allow-list the deployment's egress in Atlas.
4. Use `vercel-blob`; `local` returns `503` by design.
5. Run `npm run db:indexes` once.
6. Create the administrator from a local checkout, not from CI.
7. **Redeploy after changing any environment variable.** Vercel injects variables
   into the build *and* the runtime from the deployment's own snapshot: editing a
   variable neither restarts nor affects already-running instances, and a variable
   first added to *Production* is invisible to a Preview deployment. Use
   **Deployments → ⋯ → Redeploy** (not just a refresh) after every change.
8. Verify with `curl -i -X POST https://<domain>/api/admin/login -H
   'Content-Type: application/json' -d '{"pin":"000000"}'`. A `500` means the
   deployment still cannot reach the database; `401` means it can and only the PIN
   is wrong.

### Netlify

`netlify.toml` uses `@netlify/plugin-nextjs`; the same variables apply.

### Backups

The CMS document plus `testimonials`, `contactsubmissions` and `leads` are the only
irreplaceable data; `adminsessions` and `ratelimits` are disposable. Rolling back the
application is a redeploy.

---

## 9. Known limitations

* **Unknown `/solution/<slug>` returns the not-found page with a `200`.** Next.js
  13.5 flushes response headers before a dynamic page component runs, so
  `notFound()` renders the right UI but not the right status. Using
  `generateStaticParams` would freeze the slug list at build time and 404 every
  solution added later, which is worse. Verified against a live server.
* **There is no `/solutions` index page** — links to it 404. Pre-existing.
* **The PIN is shared across all administrator accounts.** That is inherent to a
  PIN-only login with no username: one credential guards every admin, and the
  lockout is shared accordingly. If you later need per-account credentials, the
  login form must gain an identifier field.
* **`output: "standalone"`** makes `next start` warn. Harmless on Vercel.
* **Rate limits are per fixed window**, so a burst at a boundary can briefly allow
  `2 × limit`.
* **`data/cms.json`** is retained only as input for `npm run migrate:cms`.
* **No CSP.** The site loads fonts, images and video from many third-party origins
  and Next injects inline scripts; a policy narrow enough to be useful has not been
  inventoried. Baseline headers (`nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  HSTS) are set in `next.config.js`.
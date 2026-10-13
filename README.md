# Kaiyō Digital Studio

Digital studio marketing website with a MongoDB-backed CMS admin panel.

This is a **single Next.js application**. There is no separate backend server —
the API is made of Next.js Route Handlers. See [`docs/BACKEND.md`](docs/BACKEND.md)
for the full backend reference and [`BRAIN.md`](BRAIN.md) for architecture.

---

## Requirements

- Node.js 18+
- MongoDB (local `mongodb://127.0.0.1:27017/kaiyo`, or a MongoDB Atlas cluster)

---

## Setup

```bash
npm install

cp .env.example .env.local
# Set MONGODB_URI, CSRF_SECRET and SESSION_SECRET (see below)
```

Generate the two secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Create the first administrator — there is no default account, and every admin
route returns `401` until one exists:

```bash
npm run create-admin
```

Then start the dev server:

```bash
npm run dev     # http://localhost:3000
```

---

## Environment Variables

`.env.example` is the authoritative, fully commented list. `.env.local` is
git-ignored.

**Only `NEXT_PUBLIC_SITE_URL` reaches the browser.** Everything else is read
server-side and must never carry the `NEXT_PUBLIC_` prefix — database
credentials, admin passwords and CSRF/session secrets would be shipped to every
visitor in the JS bundle.

| Variable | Required | Used by |
|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Browser — SEO metadata, and the server-side CSRF `Origin` check |
| `MONGODB_URI` | Yes (prod) | Server — `backend/lib/db.ts` |
| `SESSION_SECRET` | Yes (prod) | Server — session HMAC |
| `CSRF_SECRET` | Yes (prod) | Server — CSRF token binding |
| `MEDIA_STORAGE_DRIVER` | Yes | Server — `local` \| `vercel-blob` \| `s3` |
| `BLOB_READ_WRITE_TOKEN` | If `vercel-blob` | Server |
| `S3_UPLOAD_BASE` / `S3_PUBLIC_BASE` / `S3_DELETE_BASE` | If `s3` | Server |
| `ADMIN_EMAIL` / `ADMIN_PIN` / `ADMIN_NAME` | No | `npm run create-admin` only — never read by the app |
| `MONGODB_URI_TEST` / `TEST_PORT` / `TEST_VERBOSE` | No | `npm test` only |

In development, `MONGODB_URI` falls back to `mongodb://127.0.0.1:27017/kaiyo` and
secrets may be omitted. **In production all three are required** and the app
fails loudly on boot rather than falling back to a guessable default.

---

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run create-admin` | Create the first administrator |
| `npm run migrate:cms` | One-off import of `data/cms.json` into MongoDB |
| `npm run db:indexes` | Create production indexes (additive). `-- --check` to inspect first |
| `npm test` | Build, then run the backend suite |

All scripts run from the project root. `backend/` is **not** a separate npm
package — there is no `cd backend && npm install`.

---

## Project Structure

```
├── app/            # Pages + Route Handlers (framework-mandated paths)
│   └── api/        # All /api/* endpoints
├── components/     # React components (sections/, solutions/, admin/)
├── lib/            # Browser-safe code: types, hooks, admin fetch wrapper
├── backend/        # Server-side code
│   ├── lib/        # DB, auth, guards, validation, storage, CMS store
│   ├── models/     # Mongoose models
│   └── scripts/    # create-admin, migrate, test suite
├── middleware.ts   # Edge redirect for /admin/*
└── public/         # Static assets
```

### Why is part of the backend still under `app/`?

Next.js resolves HTTP endpoints from `app/**/route.ts` by directory convention,
and only loads the edge middleware from the project root. Those files cannot be
moved without breaking routing — a misplaced Route Handler still type-checks
(`@/` is just a path alias) but 404s at runtime.

Everything that is *not* path-mandated has been consolidated under `backend/`.
See §5 of [`BRAIN.md`](BRAIN.md) for the rule and the reasoning.

---

## Deployment

### Vercel

1. Import the repository.
2. Add the environment variables above to **all** environments.
3. Provision MongoDB and allow-list the deployment's egress addresses.
4. Set `MEDIA_STORAGE_DRIVER` to `vercel-blob` or `s3`. Leaving it as `local`
   makes uploads return `503` by design — a serverless filesystem is rebuilt on
   every deploy.
5. Create the administrator from a local checkout, not from CI.

### Netlify

`netlify.toml` uses `@netlify/plugin-nextjs`. The same environment variables and
database requirements apply; use the `s3` or `vercel-blob` driver.

### Backups

Enable snapshots on your MongoDB provider. The CMS document plus `testimonials`,
`contactsubmissions` and `mediaassets` are the only irreplaceable data —
`adminsessions` and `ratelimits` are disposable. Rolling back the application is
just a redeploy; there are no breaking schema migrations.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Admin login always `401` | No administrator exists yet | `npm run create-admin` |
| Every API call `404`s | A Route Handler was moved out of `app/` | Move it back under `app/api/` |
| Uploads fail with `503` | `MEDIA_STORAGE_DRIVER=local` in production | Switch to `vercel-blob` or `s3` |
| `SESSION_SECRET must be at least 32 characters` | Secret too short in production | Regenerate it |
| MongoDB connection error | Bad connection string | Check `MONGODB_URI` |
| TypeScript error after moving a file | Stale `@/lib/...` import | Server code imports from `@/backend/lib/...` |
| Build succeeds but a page 500s | Env var present at build but missing at runtime | Check deployment environment settings |

---

## Security Notes

* `middleware.ts` checks only for the *presence* of a session cookie — it cannot
  verify an HMAC at the edge. Real enforcement is in `backend/lib/guards.ts`.
* Contact submissions are personal data and are never exposed publicly.
* Errors never include stack traces, connection strings, or password hashes.
* Never commit `.env.local`; it is git-ignored.

# Kaiyō Digital Studio

Full-stack digital agency website with a CMS admin panel. Built with Next.js 13.5 (App Router), Express.js, MongoDB, and Tailwind CSS.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [GitHub Secrets](#github-secrets)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
kaiyo-main/
├── app/                    # Next.js App Router pages
├── components/             # Shared UI components
│   ├── sections/           # Page sections (Navbar, Footer, Hero, etc.)
│   ├── solutions/          # Solution page components
│   ├── ui/                 # Reusable UI primitives
│   └── admin/              # Admin-only components
├── src/
│   ├── api/                # Axios API service layer
│   ├── store/              # Redux store (auth + userAuth)
│   ├── auth/               # Admin auth (slice, service, pages, components)
│   ├── user/               # User auth (slice, service, pages, components)
│   └── config/             # Frontend env config
├── lib/                    # Utility functions, validations
├── styles/                 # Global CSS (Tailwind)
├── backend/
│   └── src/
│       ├── controllers/    # 16 route controllers
│       ├── models/         # 18 Mongoose models
│       ├── routes/         # 16 route definitions
│       ├── middleware/     # Auth, caching, error handling, uploads
│       ├── config/         # Env, DB, Cloudinary config
│       ├── validators/     # Express-validator chains
│       ├── utils/          # Helpers (notifications, URL normalization)
│       ├── seeds/          # Database seed scripts
│       └── types/          # TypeScript interfaces
├── .github/workflows/      # CI pipelines (GitHub Actions)
└── netlify.toml            # Netlify deployment config
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- npm

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd kaiyo-main

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..

# 4. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# 5. Start the backend
cd backend
npm run dev
# Backend running at http://localhost:5000

# 6. Start the frontend (in a separate terminal)
npm run dev
# Frontend running at http://localhost:3000

# 7. (Optional) Seed the database
cd backend
npm run seed
```

### Available Scripts

```bash
# Frontend
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
npm run typecheck # TypeScript check

# Backend
cd backend
npm run dev       # Nodemon hot-reload
npm run build     # TypeScript compilation
npm run start     # Production start
npm run test      # Run tests
npm run seed      # Seed database
npm run seed:admin # Seed admin only
```

---

## CI/CD Pipeline

### CI Pipeline (`.github/workflows/ci.yml`)

Triggers on every push to `main`/`develop` and on pull requests to `main`.

| Job | What it does | Fails on |
|-----|-------------|----------|
| **frontend** | `npm ci` → `lint` → `typecheck` → `build` | Any step fails |
| **backend**  | `npm ci` → `tsc` → `test` → `build` | Any step fails |
| **security** | `npm audit` on frontend + backend | Warnings only (non-blocking) |

Key features:
- **Dependency caching** — `cache: npm` in `setup-node` caches `node_modules` between runs
- **Parallel execution** — frontend, backend, and security jobs run concurrently
- **Fail-fast** — any non-audit failure stops the workflow immediately

---

## GitHub Secrets

The following secrets must be configured in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

For custom deployment (optional — not configured by default):
| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_KEY` | SSH private key for deploying to a VPS |
| `DEPLOY_HOST` | Hostname/IP of the deployment server |
| `DEPLOY_USER` | SSH username |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token (for frontend deploy) |
| `NETLIFY_SITE_ID` | Netlify site ID (for frontend deploy) |

---

## Deployment

### Netlify (Frontend)

The `netlify.toml` file is already configured for automatic Netlify deployments:

```toml
[build]
  command = "npx next build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Connect your Netlify site to the GitHub repository for automatic deployments on every push.

### Manual Deployment

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
npm run build
npm start
```

---

## Troubleshooting

### CI Pipeline Failures

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `npm ci` fails | `package-lock.json` out of sync with `package.json` | Run `npm install` locally and commit the updated lockfile |
| Lint fails | ESLint rule violations | Run `npm run lint` locally and fix issues |
| TypeScript error | Type mismatch or missing type | Run `npm run typecheck` locally and fix |
| Build fails | Code that doesn't compile | Check build logs for specific error |
| Tests fail | Backend test assertions | Run `cd backend && npm test` locally |

### Local Development

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| API calls fail | Backend not running | Start backend: `cd backend && npm run dev` |
| CORS errors | Backend origin mismatch | Check `CORS_ORIGIN` in `backend/.env` |
| Auth not working | Missing or expired token | Clear cookies and localStorage, re-login |
| MongoDB connection error | Invalid connection string | Verify `MONGO_URI` in `backend/.env` |
| Build errors after pull | Dependencies changed | Run `npm install` and `cd backend && npm install` |

# BRAIN.md — Kaiyō Digital Studio

> **Single Source of Truth** for the Kaiyō project.  
> Every AI agent or developer should read this first before making any changes.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure Map](#4-directory-structure-map)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Authentication System](#7-authentication-system)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Database Schema & Relationships](#9-database-schema--relationships)
10. [Key Workflows](#10-key-workflows)
11. [Configuration & Environment](#11-configuration--environment)
12. [Deployment](#12-deployment)
13. [Performance Optimizations Applied](#13-performance-optimizations-applied)
14. [Risks & Technical Debt](#14-risks--technical-debt)
15. [Conventions & Patterns](#15-conventions--patterns)
16. [Common Tasks & Gotchas](#16-common-tasks--gotchas)

---

## 1. Project Overview

**Kaiyō** is a full-stack digital agency website with an admin panel. It showcases web design services, partner programs, pricing, testimonials, and a revenue calculator. The public site is a marketing presence for a design studio; the admin panel manages all dynamic content.

**Purpose:** A marketing website for a design studio that offers:
- Web design & development services
- A partner/referral program with commission tiers
- An interactive revenue calculator
- Testimonial collection & display
- Full CMS via an admin panel

**Key Differentiator:** Nearly all content is admin-managed via a MongoDB-backed CMS. The frontend fetches dynamic content on every page, falling back to hardcoded defaults.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS 13.5 (App Router)                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Public Pages (○ static)                                       │  │
│  │  / (Home), /pricing, /contact, /how-it-works, /calculator,    │  │
│  │  /solutions/*, /Testimonial, /solution/[slug] (λ dynamic)     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Admin Panel (○ static, auth-protected at edge)               │  │
│  │  /adminpanel/login → register → dashboard                    │  │
│  │  /adminpanel/{pricing,partner,calculator,homepage,            │  │
│  │               solutions,notifications,testimonials,contacts,  │  │
│  │               newsletter,promotions}                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Shared Layer                                                  │  │
│  │  Components (sections/ ui/ solutions/ admin/)                 │  │
│  │  Redux Store (auth + userAuth slices)                         │  │
│  │  API Services (12 services → Axios → Backend)                 │  │
│  │  lib/ (utils, validations, getLiveSections)                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │ Axios HTTP                           │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS BACKEND (PORT 5000)                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐  │
│  │ Middleware     │  │ Controllers    │  │ Mongoose Models (18) │  │
│  │ cors          │  │ authController │  │ Admin, User,          │  │
│  │ compression   │  │ userAuthCtrl   │  │ Contact, Newsletter,  │  │
│  │ json/urlenc   │  │ homePageCtrl   │  │ Testimonial,          │  │
│  │ auth (JWT)    │  │ pricingCtrl    │  │ Notification,         │  │
│  │ errorHandler  │  │ partnerCtrl    │  │ PricingPlan,          │  │
│  │ publicCache   │  │ calculatorCtrl │  │ PartnerProgram,       │  │
│  └───────────────┘  │ testimonialCtrl │  │ HomePageContent,      │  │
│                     │ solutionCtrl    │  │ Calculator,           │  │
│                     │ + 8 more        │  │ Category, SubCategory │  │
│                     └─────────────────┘  │ Solution, Media,      │  │
│                                          │ Lead, PortfolioItem,  │  │
│  ┌──────────────────────────────┐        │ PortfolioSection,     │  │
│  │ External Services            │        │ PasswordReset         │  │
│  │ MongoDB Atlas (cloud DB)     │        └───────────────────────┘  │
│  │ Cloudinary (image storage)   │                                   │
│  │ Local disk fallback (uploads)│                                   │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 13.5.1 | React framework with App Router |
| **React** | React | 18.2.0 | UI library |
| **Styling** | Tailwind CSS | 3.3.3 | Utility-first CSS |
| **Animation** | Framer Motion | 10.16.4 | Page/component animations |
| **State** | Redux Toolkit | 2.12.0 | Auth state management |
| **HTTP** | Axios | 1.17.0 | API client |
| **Forms** | React Hook Form | 7.79.0 | Form handling (testimonials) |
| **Validation** | Zod | 4.4.3 | Schema validation |
| **Icons** | lucide-react + react-icons | both | Icon libraries |
| **UI Components** | Radix UI | various | Accessible primitives |
| **Notifications** | Sonner + SweetAlert2 | both | Toast + modals |
| **Backend** | Express.js | 4.22.2 | Node.js HTTP server |
| **Database** | MongoDB via Mongoose | 8.24.0 | NoSQL ODM |
| **Auth** | jsonwebtoken + bcryptjs | latest | JWT + password hashing |
| **Uploads** | Multer + Cloudinary | latest | File upload with CDN fallback |
| **Compression** | compression | 1.7.5 | Gzip API responses |
| **Security** | helmet + cors | latest | HTTP headers + CORS |
| **Rate Limiting** | express-rate-limit | 8.5.2 | API rate limiting |
| **Validation** | express-validator | 7.3.2 | Input validation |
| **Runtime** | Node.js + ts-node | 18.x | TypeScript execution |

---

## 4. Directory Structure Map

```
kaiyo-main/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout (fonts, providers, nav/footer)
│   ├── page.tsx                      # Homepage (fetches HomePageContent)
│   ├── loading.tsx                   # Root loading boundary
│   ├── error.tsx                     # Root error boundary
│   ├── calculator/                   # Revenue calculator page
│   ├── contact/                      # Contact form page
│   ├── pricing/                      # Pricing plans page
│   ├── how-it-works/                 # Partner program page
│   ├── login/ / register/ / forgot-password/  # User auth pages
│   ├── Testimonial/                  # Public testimonial listing
│   ├── solution/[slug]/              # Dynamic solution detail
│   ├── solutions/                    # 11 solution category pages
│   └── adminpanel/                   # Admin panel (12 pages + components)
├── components/
│   ├── sections/                     # 18 page sections (Hero, Navbar, Footer, etc.)
│   ├── solutions/                    # Solution page components + data
│   ├── ui/                           # Reusable UI primitives (13 files)
│   └── admin/                        # Admin-only components
├── src/
│   ├── api/                          # 12 API service files (Axios clients)
│   ├── store/                        # Redux store config
│   ├── auth/                         # Admin auth (slice, service, pages, components)
│   ├── user/                         # User auth (slice, service, pages, components)
│   └── config/                       # Frontend env config
├── lib/
│   ├── getLiveSections.ts            # Fetches live solution data for static pages
│   ├── utils.ts                      # cn() utility (tailwind-merge + clsx)
│   └── validations/testimonial.ts    # Zod schemas for testimonials
├── styles/globals.css                # Global CSS (Tailwind directives, fonts, animations)
├── middleware.ts                     # Edge middleware (admin auth redirect)
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind theme customization
└── backend/                          # Express.js backend
    ├── src/
    │   ├── app.ts                    # Express app setup (routes, middleware)
    │   ├── server.ts                 # Server entry point (DB connect, start)
    │   ├── config/                   # env, db, cloudinary config
    │   ├── models/                   # 18 Mongoose models
    │   ├── controllers/              # 15 controller files
    │   ├── routes/                   # 16 route files
    │   ├── middleware/               # auth, errorHandler, upload, validate, cache
    │   ├── validators/               # express-validator chains
    │   ├── utils/                    # createNotification, normalizeUrl
    │   ├── seeds/                    # 4 seed scripts
    │   └── types/                    # TypeScript interfaces
    ├── uploads/                      # Uploaded images (disk fallback)
    ├── package.json
    └── tsconfig.json
```

---

## 5. Frontend Architecture

### 5.1 App Router Structure

The project uses Next.js 13.5 **App Router** (`/app` directory). Pages are organized into route groups:

- **Public pages** (no auth required): home, calculator, contact, pricing, how-it-works, login, register, forgot-password, Testimonial, solutions/*, solution/[slug]
- **Admin pages** (auth-protected via middleware): all `/adminpanel/*` routes

**Route types from build output:**
- `○ (Static)`: Pre-rendered at build time — most public pages
- `λ (Dynamic)`: Server-rendered per request — `/solution/[slug]` and `/adminpanel/testimonials/[id]/edit`

### 5.2 Component Hierarchy

```
RootLayout (inter font, redux provider, nav/footer wrappers)
├── NavbarWrapper (hides on admin/hiw/calculator routes)
│   └── Navbar (sticky, mobile-responsive, user auth state)
│       ├── SolutionsDropdown (fetches categories from API)
│       │   └── MegaMenu → MegaMenuColumn → MegaMenuItem
├── [Page Content]
│   ├── HomePage
│   │   ├── Hero (fetches dynamic content)
│   │   ├── Marquee (CSS animation, static or dynamic)
│   │   ├── Collection ← Feature ← Blog ← Banner
│   │   ├── FutureEquitySection
│   │   └── Ads (background video)
│   ├── CalculatorPage (interactive revenue sim)
│   ├── HowItWorksPage (partner program, tiers, FAQ)
│   ├── PricingPage (fetches plans from API)
│   ├── ContactPage (form + FAQ accordion)
│   ├── SolutionsPages (server components, ISR)
│   └── AdminPages (dynamic imports for heavy pages)
├── FooterWrapper (hides on dashboard/admin routes)
│   └── Footer (newsletter subscribe, social icons)
```

### 5.3 State Management

Redux Toolkit with **two slices**:

| Slice | State | Async Thunks |
|-------|-------|-------------|
| `auth` (admin) | `token`, `admin`, `isAuthenticated`, `error` | `login`, `register`, `verifyToken` |
| `userAuth` | `token`, `user`, `isAuthenticated`, `error` | `userLogin`, `userRegister`, `userVerifyToken` |

**Key pattern:** The store is configured in `src/store/index.ts` and provided via `ReduxProvider` in `src/store/Provider.tsx`. The `src/auth/state/` and `src/src/user/state/` directories re-export from the central store.

**Auth flow (Navbar.tsx):**
1. On mount, check localStorage for `user-token`
2. If found, dispatch `userVerifyToken(token)`
3. If verified, show user name + logout button
4. If not, show login link

### 5.4 API Service Layer

All API calls go through Axios (`src/api/client.ts`):
- Base URL from `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:5000/api`)
- 15-second timeout
- Response interceptor extracts error messages
- FormData requests get `Content-Type: null` to let browser set boundary

**12 Service Files:**
| Service | Base Route | Key Methods |
|---------|-----------|-------------|
| `calculatorService` | `/calculator` | getActive, CRUD, tier management |
| `contactService` | `/contact` | submit, getAll, delete |
| `homepageService` | `/homepage` | getActive, CRUD |
| `newsletterService` | `/newsletter` | subscribe, unsubscribe, getAll |
| `notificationService` | `/admin/notifications` | getAll, create, markAsRead, delete |
| `partnerProgramService` | `/partner-program` | getActive, CRUD |
| `passwordResetService` | `/password-reset` | request, verifyToken, reset |
| `pricingPlanService` | `/pricing-plans` | getAll, CRUD |
| `solutionService` | `/solutions` | getActive, getBySlug, CRUD, upload |
| `testimonialService` | `/testimonials` | getPublished, CRUD, approve/reject, bulk |
| `authService` | `/auth` | login, register, verifyToken |
| `userAuthService` | `/user-auth` | login, register, verifyToken |

### 5.5 Data Fetching Pattern

**Client-side data fetching** (most pages):
```tsx
// Pattern used by: home, pricing, how-it-works, calculator, contact, testimonials
const [data, setData] = useState(defaultData);
useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await service.getActive();
      if (res.success && res.data) setData(res.data);
    } catch { /* use fallback */ }
  };
  fetchData();
}, []);
```

**Server-side data fetching** (solution pages):
```tsx
// getLiveSections.ts uses fetch() with next: { revalidate: 60 }
export default async function Page() {
  const sections = await getLiveSections(subSlug, staticSections);
  return <HeroSection />;
}
```

### 5.6 Key UI Components

| Component | Purpose | Technical Notes |
|-----------|---------|-----------------|
| `Navbar` | Sticky top navigation | framer-motion animations, mobile hamburger, user auth state |
| `Footer` | Site footer with newsletter | `react-icons/fa` for social icons, inline newsletter subscribe |
| `Hero` | Homepage hero section | Next/Image, framer-motion rotating element |
| `Marquee` | Scrolling text banner | CSS `@keyframes marquee-scroll`, `will-change: transform` |
| `Card` | Reusable card container | Tailwind className merging via cn() |
| `CTAButton` | Call-to-action link | Dynamic inline styles (avoids Tailwind runtime eval issues) |
| `Dialog` | Modal dialog | Radix Dialog, AnimatePresence |
| `Skeleton` | Loading placeholder | `animate-pulse` Tailwind animation |
| `Toaster` | Toast notifications | Sonner integration |
| `CookiePopup` | Cookie consent modal | Fixed overlay, framer-motion, on how-it-works page |

---

## 6. Backend Architecture

### 6.1 Express App Setup (`backend/src/app.ts`)

```ts
Middleware order:
1. compression() - gzip responses
2. cors() - allow all origins with credentials
3. express.json() - parse JSON bodies
4. express.urlencoded() - parse URL-encoded bodies
5. express.static('/uploads') - serve uploaded files (7d max-age cache)
6. All API routes (16 route files)
7. errorHandler() - unified error handling
```

**Key middleware details:**
- **`compression`**: Level 6, threshold 1024 bytes — compresses all API responses
- **`publicCache`**: `Cache-Control: public, max-age=60, s-maxage=120, stale-while-revalidate=300` — applied to public GET endpoints
- **`auth.ts`**: JWT verification, extracts `admin` or `user` payload from Bearer token
- **`errorHandler.ts`**: Handles Multer errors, AppError class, creates system notifications

### 6.2 Controllers

**15 controllers**, each handling a MongoDB collection:

| Controller | Model | Key Handlers |
|-----------|-------|-------------|
| `authController` | Admin | login, register, verifyToken |
| `userAuthController` | User | login, register, verifyToken |
| `homePageContentController` | HomePageContent | getActive, CRUD |
| `pricingPlanController` | PricingPlan | getAll, CRUD |
| `partnerProgramController` | PartnerProgram | getActive, CRUD |
| `calculatorController` | Calculator | getActive, CRUD, addTier, updateTier, deleteTier, reorderTiers, toggleTier |
| `testimonialController` | Testimonial | getPublished (paginated), CRUD, approve/reject, bulk, analytics |
| `solutionsModuleController` | Category, SubCategory, Solution | getActive, getBySlug, getRelated, module CRUD, publish/unpublish |
| `contactController` | Contact | submit, getAll, delete |
| `newsletterController` | Newsletter | subscribe, unsubscribe, getSubscribers |
| `notificationController` | Notification | getAll, create, markAsRead, delete |
| `mediaController` | Media | uploadMedia, getMedia, deleteMedia |
| `passwordResetController` | PasswordReset | request, verifyToken, reset |
| `portfolioItemController` | PortfolioItem | getBySection, CRUD |
| `portfolioSectionController` | PortfolioSection | getBySolution, CRUD |

**Performance optimization applied to all controllers:**
- All read-only queries use `.lean()` for plain JS objects
- All `find()` calls use proper indexes
- Public endpoints have `Cache-Control` headers

### 6.3 Routes

All routes are registered in `app.ts`:

| Base Path | Route File | Public Endpoints | Admin Endpoints |
|-----------|-----------|-----------------|-----------------|
| `/api/auth` | authRoutes | - | login, register, verify |
| `/api/user-auth` | userAuthRoutes | - | login, register, verify |
| `/api/contact` | contactRoutes | POST / (submit) | GET /, DELETE /:id |
| `/api/newsletter` | newsletterRoutes | POST /subscribe, /unsubscribe | GET /subscribers |
| `/api/testimonials` | testimonialRoutes | GET /published, GET /, GET /:id | + CRUD, approve, bulk |
| `/api/admin/notifications` | notificationRoutes | - | CRUD |
| `/api/password-reset` | passwordResetRoutes | POST /request, GET /verify/:token, POST /reset | - |
| `/api/pricing-plans` | pricingPlanRoutes | GET /, GET /:id | + CRUD |
| `/api/partner-program` | partnerProgramRoutes | GET /active | + CRUD |
| `/api/homepage` | homePageContentRoutes | GET /active | + CRUD |
| `/api/calculator` | calculatorRoutes | GET /active | + CRUD, tier management |
| `/api/solutions` | solutionsModuleRoutes | GET /active, /slug/:slug, /public-categories, /:id/related | + module CRUD |
| `/api/media` | mediaRoutes | - | POST /upload, GET /, DELETE /:id |
| `/api/leads` | leadRoutes | POST / | GET / |
| `/api/portfolio-sections` | portfolioSectionRoutes | - | CRUD |
| `/api/portfolio-items` | portfolioItemRoutes | - | CRUD |
| `/api/health` | inline | GET / (health check) | - |

### 6.4 File Upload System

Two upload middlewares exist:

1. **`backend/src/middleware/upload.ts`**: Simple disk storage (testimonial images)
2. **`backend/src/config/cloudinary.ts`**: Custom storage engine that:
   - Always saves to disk first
   - Optionally uploads to Cloudinary if configured
   - Removes local temp file on Cloudinary success
   - Falls back to disk-only if Cloudinary not configured

**Upload flow:**
1. Client sends multipart/form-data with `image` field
2. Multer processes with file filter (images only, max 5MB)
3. Cloudinary storage engine saves to disk, optionally uploads to Cloudinary
4. Response returns the URL (cloudinary or local)
5. Media record is created in the `medias` collection

---

## 7. Authentication System

### 7.1 Dual Auth Architecture

The system has **two completely separate authentication systems**:

| Aspect | Admin Auth | User Auth |
|--------|-----------|-----------|
| **Model** | `Admin` | `User` |
| **Token Key** | `admin-token` | `user-token` |
| **Storage** | localStorage + cookie | localStorage + cookie |
| **Redux Slice** | `auth` | `userAuth` |
| **JWT Payload** | `{ id, username, role: 'admin' }` | `{ id, email, role: 'user' }` |
| **Verification** | `authenticate` middleware (checks `role: 'admin'`) | `authenticateUser` middleware (checks `role: 'user'`) |
| **Middleware** | Edge middleware (`middleware.ts`) protects `/adminpanel/*` | Client-side `useRequireAuth` hook |

### 7.2 Admin Auth Flow

```
1. User visits /adminpanel/*
2. Edge middleware (middleware.ts) checks for 'admin-token' cookie
3. If no token → redirect to /adminpanel/login
4. If has token → allow through (middleware trusts cookie presence)
5. LoginSection.tsx collects credentials, dispatches login() thunk
6. authSlice.login calls authService.login()
7. Backend verifies credentials, returns JWT
8. Client stores JWT in localStorage('admin-token') + sets cookie
9. useRequireAuth hook verifies token on admin page mount
10. On logout: clear localStorage, clear cookie, redirect to login
```

### 7.3 Edge Middleware (`middleware.ts`)

```
Matcher: /adminpanel/:path*
Rules:
  - /adminpanel → redirect to /adminpanel/login
  - /adminpanel/login with valid token → redirect to /adminpanel/dashboard
  - Any other /adminpanel/* without token → redirect to /adminpanel/login
```

**CRITICAL:** The middleware trusts that any non-empty cookie value is valid. It does NOT verify the JWT. Token verification happens client-side via `useRequireAuth`. This means a malformed token passes the edge check but fails on the client.

### 7.4 `useRequireAuth` Hook

```tsx
// In admin panel pages: checks localStorage('admin-token')
// If no token → redirect to /adminpanel/login
// If token exists → dispatch verifyToken()
// Returns boolean `ready` — page renders null until true
export default function DashboardPage() {
  const ready = useRequireAuth();
  if (!ready) return null;
  return <HealthDashboard />;
}
```

### 7.5 Password Reset Flow

```
1. User provides identifier (email or username)
2. Backend generates crypto token, stores in PasswordReset (60-min expiry)
3. Always returns "If an account exists..." to prevent enumeration
4. Token verification: GET /api/password-reset/verify/:token
5. Password reset: POST /api/password-reset/reset { token, password }
6. Token is marked used (one-time)
7. TTL index auto-deletes expired tokens
```

---

## 8. API Endpoints Reference

### Public Endpoints (no auth required)

| Method | Path | Description | Cache |
|--------|------|-------------|-------|
| GET | `/api/health` | Health check | No |
| GET | `/api/homepage/active` | Latest active homepage | 60s |
| GET | `/api/pricing-plans` | All pricing plans | 60s |
| GET | `/api/pricing-plans/:id` | Single plan | 60s |
| GET | `/api/partner-program/active` | Latest active partner | 60s |
| GET | `/api/calculator/active` | Latest active calculator | 60s |
| GET | `/api/testimonials` | Filtered list | 60s |
| GET | `/api/testimonials/published` | Paginated published | 60s |
| GET | `/api/testimonials/:id` | Single testimonial | 60s |
| GET | `/api/solutions/active` | Active published solutions | 60s |
| GET | `/api/solutions/slug/:slug` | Solution by slug | 60s |
| GET | `/api/solutions/public-categories` | Active categories+subs | 60s |
| GET | `/api/solutions/:id/related` | Related solutions | 60s |
| POST | `/api/contact` | Submit contact form | No |
| POST | `/api/newsletter/subscribe` | Subscribe email | No |
| POST | `/api/newsletter/unsubscribe` | Unsubscribe | No |
| POST | `/api/testimonials` | Submit testimonial | No |
| POST | `/api/leads` | Submit lead inquiry | No |
| POST | `/api/password-reset/request` | Request password reset | No |
| GET | `/api/password-reset/verify/:token` | Verify reset token | No |
| POST | `/api/password-reset/reset` | Reset password | No |

### Admin Endpoints (require Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/register` | Admin registration |
| GET | `/api/auth/verify` | Verify admin token |
| POST | `/api/user-auth/login` | User login |
| POST | `/api/user-auth/register` | User registration |
| GET | `/api/user-auth/verify` | Verify user token |
| GET | `/api/admin/notifications` | List notifications |
| POST | `/api/admin/notifications` | Create notification |
| PATCH | `/api/admin/notifications/:id/read` | Mark as read |
| DELETE | `/api/admin/notifications/:id` | Delete notification |
| CRUD | `/api/homepage` | Manage homepage content |
| CRUD | `/api/pricing-plans` | Manage pricing plans |
| CRUD | `/api/partner-program` | Manage partner program |
| CRUD | `/api/calculator` | Manage calculator config |
| CRUD+Tiers | `/api/calculator/:id/tiers` | Tier management |
| CRUD+Actions | `/api/testimonials` | Manage testimonials |
| POST | `/api/testimonials/bulk/approve` | Bulk approve |
| POST | `/api/testimonials/bulk/reject` | Bulk reject |
| GET | `/api/testimonials/analytics` | Testimonial analytics |
| POST | `/api/testimonials/upload-image` | Upload image |
| POST | `/api/media/upload` | Upload media file |
| CRUD | `/api/media` | Manage media |
| POST | `/api/solutions/module-action` | Solutions CRUD + actions |
| GET | `/api/solutions/module-data` | Solutions with categories |
| GET | `/api/solutions/subcategory/:id/details` | Subcategory details |
| CRUD | `/api/portfolio-sections` | Portfolio section management |
| CRUD | `/api/portfolio-items` | Portfolio item management |
| CRUD | `/api/contact` | Manage contact submissions |
| GET | `/api/newsletter/subscribers` | List subscribers |
| GET | `/api/leads` | List leads |

---

## 9. Database Schema & Relationships

### 9.1 Collections and Document Counts

| Collection | Purpose | Key Queries |
|-----------|---------|-------------|
| `admins` | Admin users | findByUsername, findById |
| `users` | End users | findByEmail, findById |
| `homepagecontents` | Homepage content (singleton-ish) | findOne({isActive:true}) sort createdAt |
| `pricingplans` | Pricing plans | find() sort order |
| `partnerprograms` | Partner program (singleton-ish) | findOne({isActive:true}) sort createdAt |
| `calculators` | Calculator config (singleton-ish) | findOne({isActive:true}) sort createdAt |
| `testimonials` | Client testimonials | find({status:'approved',deletedAt:null}) |
| `notifications` | Admin notifications | find() sort createdAt |
| `contacts` | Contact form submissions | find() sort createdAt |
| `newsletters` | Email subscribers | find({isActive:true}) |
| `categories` | Solution categories | find({isActive:true}) sort displayOrder |
| `subcategories` | Solution subcategories | find({category,isActive:true}) |
| `solutions` | Service offerings | find({isActive, published}), findOne({slug}) |
| `media` | Uploaded media files | find({solution}), find({section}) |
| `leads` | Client inquiries | find({solution}), find({status}) |
| `portfoliosections` | Solution portfolio sections | find({solution,isActive:true}) |
| `portfolioitems` | Portfolio cards | find({section,isActive:true}) |
| `passwordresets` | Password reset tokens | findOne({token, usedAt:null, expiresAt:{$gt:now}}) |

### 9.2 Indexes Defined

| Model | Indexes | Query Optimized |
|-------|---------|-----------------|
| `Testimonial` | `{status:1, createdAt:-1}`, `{status:1, rating:-1}`, `{deletedAt:1}` | Published listing, filtering, soft-delete |
| `Solution` | `{category:1, displayOrder:1}`, `{categoryId:1, subCategoryId:1}`, `{published:1, isActive:1}`, `{tags:1}`, `{featured:1}` | Category browsing, publishing filter |
| `Category` | `{displayOrder:1}` | Ordered listing |
| `SubCategory` | `{category:1, displayOrder:1}`, unique `{slug:1, category:1}` | Category children, slug uniqueness |
| `Lead` | `{solution:1, createdAt:-1}`, `{status:1}` | Solution leads, status filtering |
| `Media` | `{solution:1}` | Solution media |
| `PortfolioSection` | `{solution:1, displayOrder:1}` | Solution sections |
| `PortfolioItem` | `{section:1, displayOrder:1}` | Section items |
| `PasswordReset` | `{token:1}`, `{expiresAt:1}` (TTL) | Token lookup, auto-expiry |
| `HomePageContent` | `{isActive:1, createdAt:-1}` | Active content |
| `PartnerProgram` | `{isActive:1, createdAt:-1}` | Active program |
| `Calculator` | `{isActive:1, createdAt:-1}` | Active calculator |
| `PricingPlan` | `{isActive:1, order:1, createdAt:-1}` | Active pricing order |
| `Contact` | `{createdAt:-1}` | Recent contacts |
| `Newsletter` | `{isActive:1, createdAt:-1}` | Active subscribers |
| `Notification` | `{createdAt:-1}`, `{isRead:1, createdAt:-1}` | Recent notifications |
| `Admin` | Unique on `username` | Login |
| `User` | Unique on `email` | Login |

### 9.3 Key Schema Relationships

```
Category ──1:N──> SubCategory ──1:N──> Solution
                                             │
                                    ┌────────┴────────┐
                                    │                  │
                              PortfolioSection    Lead (inquiry)
                                    │
                              PortfolioItem

Solution ──1:N──> Media (images/gallery)

Calculator ──embedded──> Tier[] (subdocument array)
PartnerProgram ──embedded──> Tier[], WorkflowStep[], WhyChooseUs[], FAQ[]
HomePageContent ──embedded──> Hero, Marquee[], Feature[], Collection[], BlogPost[]
```

**Embedded vs Referenced documents:**
- **Embedded** (within same document): PartnerProgram tiers/workflow/FAQ/whyChooseUs, Calculator tiers, HomePageContent sections — these are edited via full document replacement or subdocument array operations
- **Referenced** (separate collections): Solutions → PortfolioSections → PortfolioItems, Solutions → Media, Solutions → Leads — these support independent CRUD

---

## 10. Key Workflows

### 10.1 Homepage Content Management

```
Admin edits homepage content in /adminpanel/homepage
  └── PUT /api/homepage/:id (authenticated)
      └── HomePageContent.findByIdAndUpdate()
          └── Updated document returned

Public visits homepage (/)
  └── useEffect fetches GET /api/homepage/active
      └── HomePageContent.findOne({isActive:true}).sort({createdAt:-1}).lean()
          └── Returns latest active content (or null)
  └── Components receive dynamicContent prop
      └── Each section renders with API data or fallback
```

**Fallback behavior:** If API fails or returns null, each section has hardcoded default content.

### 10.2 Partner Program + Calculator Flow

```
Admin manages partner program in /adminpanel/partner
  └── CRUD via /api/partner-program
      └── PartnerProgram collection (singleton pattern)

Admin manages calculator in /adminpanel/calculator
  └── CRUD + tier management via /api/calculator
      └── Calculator collection (singleton pattern)

Public views /how-it-works:
  └── Fetches GET /api/partner-program/active
  └── Renders tiers, workflow, why-choose-us, FAQ, calculator preview
  └── CTA links to /calculator

Public uses /calculator:
  └── Fetches GET /api/calculator/active
  └── Renders interactive simulator
  └── User inputs project value, selects role → calculates earnings
  └── CTA buttons link to WhatsApp / contact
```

### 10.3 Solution Pages Workflow

```
Static pages at /solutions/{web-apps,portfolios,...}:
  └── Server component (no "use client")
  └── Calls getLiveSections(subSlug, staticSections)
      └── fetch(GET /api/solutions/active, {next:{revalidate:60}})
      └── Merges API solution thumbnails into static section data
  └── Renders HeroSection → TopSection → BannerStrip → CardSections → FooterSection
  └── ISR: revalidates every 60 seconds

Dynamic page at /solution/[slug]:
  └── Client component with "use client"
  └── useEffect fetches GET /api/solutions/slug/:slug
  └── Also fetches GET /api/solutions/:id/related
  └── Renders solution details + inquiry form
  └── Inquiry form posts to POST /api/leads (creates Lead document)
```

### 10.4 Testimonial Workflow

```
Public submits testimonial:
  └── POST /api/testimonials { name, rating, message }
  └── Status defaults to "pending"
  └── Notification created: "New Testimonial Submission"

Admin reviews in /adminpanel/testimonials:
  └── GET /api/testimonials (filterable, paginated)
  └── Approve → POST /api/testimonials/:id/approve → status='approved', approvedAt=now
  └── Reject → POST /api/testimonials/:id/reject → status='rejected'
  └── Bulk approve/reject → POST /api/testimonials/bulk/approve (or /reject)

Public views approved testimonials:
  └── GET /api/testimonials/published?page=1&limit=12
  └── Filter: { status:'approved', deletedAt:null }
  └── Sort by approvedAt desc, paginated
```

---

## 11. Configuration & Environment

### 11.1 Frontend Environment Variables

Required in `.env.local` or deployment environment:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 11.2 Backend Environment Variables

Required in `backend/.env`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/kaiyo
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/kaiyo?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=<default_admin_username>
ADMIN_PASSWORD=<default_admin_password>
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

**Note:** Both `MONGO_URI` and `MONGODB_URI` are read; `MONGODB_URI` takes precedence. All frontend-accessible env vars must be prefixed with `NEXT_PUBLIC_`.

### 11.3 Backend Configuration Loading

`env.ts` loads `.env` from `backend/.env` using dotenv. It logs whether each critical env var is set at startup. Cloudinary is optional — if not configured, uploads fall back to disk storage.

---

## 12. Deployment

### 12.1 Build Process

```bash
# Frontend build
npm run build
# Output: .next/standalone/ (includes server, static, and node_modules)
# Also generates .next/static/ for CDN serving

# Backend build
cd backend
npm run build
# Output: backend/dist/ (compiled JS from TypeScript)
```

### 12.2 Production Start

```bash
# Frontend
npm start  # Runs next start on port 3000

# Backend
cd backend
node server.js  # Tries dist/server.js, falls back to ts-node
```

### 12.3 Ecosystem (PM2)

A PM2 ecosystem config exists at `backend/ecosystem.config.cjs` for process management. The backend server.js is the PM2 entry point.

### 12.4 Netlify Deployment

`netlify.toml` at the root configures Netlify deployment with the Next.js plugin. The `output: 'standalone'` in next.config.js ensures only necessary files are deployed.

### 12.5 Seed Data

```bash
cd backend
npm run seed       # Seeds: admin, categories, subcategories, notifications, testimonials, solutions, pricing plans, partner program, homepage content
npm run seed:admin # Seeds only: admin user
```

**What gets seeded:**
- 1 admin user (credentials from env)
- 2 categories: Creative Studio, Web Apps
- 7 subcategories across categories
- 7 sample notifications
- 6 sample testimonials
- 3 sample solutions with portfolio data
- 3 pricing plans
- 1 partner program config
- 1 homepage content config

---

## 13. Performance Optimizations Applied

All optimizations were applied without changing UI or functionality.

### 13.1 Backend

| Optimization | Location | Impact |
|-------------|----------|--------|
| Gzip compression | `backend/src/app.ts` | 3-5x smaller API responses |
| `.lean()` on all reads | All controllers | 30-50% faster Mongoose queries |
| MongoDB indexes on 6 models | Model files | Eliminated full collection scans |
| `Cache-Control` headers | 12 public routes via `publicCache` middleware | Browser caching, fewer API calls |
| `maxAge: '7d'` on static uploads | Static middleware config | Long-lived asset caching |
| `stale-while-revalidate` | Cache middleware | Background refresh pattern |

### 13.2 Frontend

| Optimization | Location | Impact |
|-------------|----------|--------|
| `output: 'standalone'` | `next.config.js` | Smaller deployment package |
| `compress: true` | `next.config.js` | Built-in Next.js compression |
| `poweredByHeader: false` | `next.config.js` | Removes header metadata |
| Webpack chunk splitting | `next.config.js` | Better code splitting |
| `deviceSizes` + `imageSizes` | `next.config.js` | Responsive image generation |
| `minimumCacheTTL: 31536000` | `next.config.js` | Long image cache |
| Font `display: 'swap'` | Root layout | No FOIT, no CLS from fonts |
| Google Fonts preconnect | Root layout `<head>` | Faster font loading |
| Font `adjustFontFallback` | Root layout | Prevents layout shift |
| Removed duplicate `@import` | `globals.css` | One font request instead of two |
| `loading.tsx` + `error.tsx` | Root route | Proper loading/error states |
| Dynamic imports | Admin dashboard | Smaller initial bundle |
| `force-dynamic` removed | 7 solution pages | Static generation with ISR |
| `cache: 'no-store'` → `next:{revalidate:60}` | `getLiveSections.ts` | ISR with stale-while-revalidate |
| Removed duplicate `.js` files | `adminpanel/hooks/`, `adminpanel/lib/` | Cleaner build |

### 13.3 Bundle Sizes (Build Output)

```
First Load JS shared: 78.9 kB (framework + shared chunks)
Largest pages: ~155 kB (auth pages with Redux)
Smallest pages: ~79 kB (_not-found)
40/42 pages are static (○)
2/42 pages are dynamic (λ): /solution/[slug], /adminpanel/testimonials/[id]/edit
```

---

## 14. Risks & Technical Debt

### 14.1 Critical Risks

| Risk | Severity | Description | Mitigation |
|------|----------|-------------|------------|
| No JWT verification in edge middleware | **High** | `middleware.ts` trusts any non-empty cookie — malformed tokens pass | `useRequireAuth` hook verifies client-side, but there's a window |
| Hardcoded fallback credentials | **Medium** | `LoginSection.tsx` hardcodes default username/password for quick login | Change in production; these are the seed admin credentials |
| No input sanitization on API | **Medium** | Some controllers accept `req.body` directly without validation | Express-validator used on auth routes; other routes rely on Mongoose validation |
| No CSRF protection | **Medium** | Cookie-based auth without CSRF tokens | JWT stored in localStorage (not httpOnly cookie primarily) |
| Cloudinary credentials in .env | **High** | `.env` contains production credentials committed to repo | `.env` should be in `.gitignore`; secrets exposed |
| No HTTPS enforcement | **Low** | No redirect from HTTP to HTTPS | Should be handled at reverse proxy level |

### 14.2 Technical Debt

| Item | Impact | Notes |
|------|--------|-------|
| `useEffect` data fetching pattern | Performance | Every public page makes an API call on mount with loading state; no SSR for dynamic content |
| No request deduplication | Performance | Multiple components on same page fetch the same data independently |
| Inline CSS values | Maintainability | Thousands of hardcoded hex colors instead of Tailwind theme tokens |
| Duplicate icon libraries | Bundle size | Both `lucide-react` and `react-icons` installed (~150KB+ combined) |
| No TypeScript strict in places | Safety | Some `any` types, especially in admin panel pages |
| Solution pages fetch API directly | Coupling | Server components use `fetch()` with absolute URL instead of service layer |
| `console.log` in production | Cleanliness | Debug logs in solutions controller, media controller |
| No input validation on contact/newsletter | Security | Only Mongoose schema validation, no express-validator chains |
| Redundant re-exports | Complexity | `src/auth/state/store.ts`, `Provider.tsx`, `hooks.ts` just re-export from central store |
| `"use client"` on all public pages | Performance | Home, pricing, how-it-works, calculator — all client-rendered |
| No pagination on contact/newsletter admin | UX | Lists all items at once |
| Admin panel uses `fetch()` for categories | Inconsistency | SolutionsDropdown uses raw fetch instead of Axios service |
| No error boundaries per page | UX | Single root error.tsx covers everything |

### 14.3 Assumptions

- The `singleton pattern` for HomePageContent, PartnerProgram, Calculator assumes one active document at a time — controlled by `isActive: true` and sorting by `createdAt: -1`
- Solution slugs are unique and lowercase
- Testimonial soft-delete uses `deletedAt` field (never hard-deleted in normal flow)
- Admin panel assumes desktop-sized screens (sidebar design is fixed-width)
- Static solution pages are revalidated every 60 seconds — acceptable staleness
- Images served from external CDNs (Cloudinary, pexels, unsplash) are always available

---

## 15. Conventions & Patterns

### 15.1 Code Style

- **Imports:** Absolute imports using `@/` alias (maps to project root)
- **Exports:** Default exports for pages, named exports for utilities
- **TypeScript:** Strict mode enabled, but `any` types exist in admin panel
- **React:** Functional components with hooks, no class components
- **State:** Local state useState for UI, Redux for cross-component (auth)
- **API layer:** Service objects with methods, not bare Axios calls

### 15.2 API Response Format

All API responses follow a consistent format:
```json
{
  "success": true|false,
  "data": { ... },
  "error": "Error message (if failed)",
  "message": "Success message (optional)",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### 15.3 Error Handling

- **Backend:** All try/catch blocks return `{ success: false, error: "..." }`
- **Frontend:** API service interceptors convert errors to `new Error(message)` — caught in pages
- **Unhandled errors:** Global errorHandler creates system notification and returns 500

### 15.4 File Naming

- **Components:** PascalCase (Hero.tsx, Navbar.tsx)
- **Pages:** kebab-case folder (how-it-works, forgot-password)
- **Services:** camelCase (contactService.ts, pricingPlanService.ts)
- **Utils:** camelCase (cn, normalizeUrl)
- **Models:** PascalCase (HomePageContent.ts)
- **Routes:** camelCase (homePageContentRoutes.ts)

### 15.5 Admin Panel Pattern

Every admin page follows the same pattern:
```tsx
'use client';
// 1. useRequireAuth() hook
// 2. State: items[], loading, editing item
// 3. useEffect to fetch data
// 4. Render: table/list + modal/form for create/edit
// 5. CRUD operations via service methods with token from getToken()
```

### 15.6 CSS Conventions

- Tailwind utility classes with `cn()` for conditional merging
- Inline styles ONLY when dynamic values needed (e.g., colors from API)
- Arbitrary values with `[]` syntax for non-theme values
- Responsive breakpoints: `sm:`, `md:`, `lg:` (Tailwind defaults)
- Color palette: hardcoded hex values like `#32483e`, `#E9E9E7`, `#2f4f3f`

---

## 16. Common Tasks & Gotchas

### 16.1 Adding a New Page

1. Create folder in `app/` (e.g., `app/new-page/page.tsx`)
2. If client-side: add `"use client"` directive
3. Create API service in `src/api/` (if new backend endpoint needed)
4. Add route in backend `app.ts` + controller + model (if new data entity)
5. For admin: add sidebar nav item, layout route handler, and page

### 16.2 Adding a New Mongoose Model

1. Create file in `backend/src/models/`
2. Define interface + schema + indexes
3. Create controller in `backend/src/controllers/`
4. Create routes in `backend/src/routes/`
5. Register routes in `backend/src/app.ts`
6. Create frontend service in `src/api/`

### 16.3 Adding a New Admin Panel Section

1. Add nav item and handleNavigation switch in `app/adminpanel/layout.tsx`
2. Add icon mapping in `Sidebar.tsx`
3. Create page in `app/adminpanel/<name>/page.tsx` following existing pattern

### 16.4 Common Gotchas

| Gotcha | Explanation | Fix |
|--------|-------------|-----|
| `font-[Caveat]` breaks | Tailwind `font-[Caveat]` references the CSS class name, not the next/font instance | Use `font-caveat` (CSS variable) or import next/font locally |
| Dynamic Tailwind classes don't work | `className={condition ? 'bg-red-500' : 'bg-blue-500'}` is fine, but `className={dynamicColor}` from API won't be generated | Use inline `style={{ color: dynamicColor }}` |
| CORS errors in dev | Frontend on 3000, backend on 5000 — cors is configured for all origins | Works in dev; verify in production |
| Auth token not recognized | Edge middleware checks cookie; localStorage used for API calls | Both must be set on login |
| Image optimization errors | Unconfigured remote hostname in `next.config.js` images.remotePatterns | Add the hostname pattern |
| Solution pages don't update | Static pages have ISR with 60s revalidation | Wait 60s or trigger revalidation |
| Admin page shows blank | `useRequireAuth` returns false | Check localStorage for `admin-token`; token may be expired |
| `output: 'standalone'` issues | May cause path resolution issues in some environments | Ensure all files are in correct locations relative to standalone output |

### 16.5 Debugging Tips

- **Backend logs:** Check `backend/server.log` and `backend/server-err.log`
- **API not responding:** Verify backend is running on port 5000
- **Auth issues:** Check `admin-token` in Application > Cookies and localStorage
- **Build errors:** Run `npm run build` (linter skipped), `npx tsc --noEmit` (type check)
- **Admin page stuck loading:** `useRequireAuth` may be in loop — check token validity
- **MongoDB connection:** Verify `MONGO_URI` in `backend/.env`

### 16.6 Quick Command Reference

```bash
# Frontend
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript check

# Backend
cd backend
npm run dev          # Nodemon hot-reload
npm run build        # TypeScript compilation
npm run start        # Production start
npm run seed         # Seed database
npm run seed:admin   # Seed admin only

# Install backend dep
cd backend && npm install <package>
```

---

*This BRAIN.md was generated by reverse-engineering the codebase on 2026-06-27. Update it whenever significant architectural changes are made.*

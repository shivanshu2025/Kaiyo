/**
 * Central, validated access to server-side configuration.
 *
 * Every secret is read here and nowhere else so that:
 *  - no secret is ever prefixed with `NEXT_PUBLIC_` and shipped to the browser,
 *  - production boot fails loudly and early instead of silently falling back to a
 *    hardcoded default (which is what the previous implementation did),
 *  - the set of required variables is documented in exactly one place.
 */

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  /**
   * True when running `next build`. During a build there is no reachable database,
   * so code paths that only collect metadata must not attempt to connect.
   */
  isBuild: process.env.NEXT_PHASE === 'phase-production-build',

  /**
   * The single source of truth for the MongoDB connection string.
   *
   * In production this never falls back to a local server: a missing variable is a
   * deployment misconfiguration and must fail loudly rather than silently talking to
   * a database nobody is looking at. In development a localhost default keeps
   * `npm run dev` working before `.env.local` has been created.
   *
   * The value is validated but **never** interpolated into an error message -
   * connection strings carry the username and password, so a thrown error becomes
   * a credential leak the moment it is logged.
   */
  get mongoUri(): string {
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
      if (env.isProd) {
        throw new Error(
          'MONGODB_URI is not configured. Set it in the deployment environment to a MongoDB ' +
            'Atlas connection string, e.g. mongodb+srv://<user>:<password>@<cluster>/<database>. ' +
            'Refusing to connect to a default local database in production.',
        );
      }
      return LOCAL_MONGO_URI;
    }

    assertValidMongoUri(uri);
    return uri;
  },

  /** Sessions are opaque random tokens; only their SHA-256 digest is persisted. */
  get sessionSecret(): string | null {
    const secret = process.env.SESSION_SECRET?.trim();
    return secret && secret.length > 0 ? secret : null;
  },

  /**
   * Used to bind a session to a CSRF token. Required in production.
   */
  get csrfSecret(): string | null {
    const secret = process.env.CSRF_SECRET?.trim();
    return secret && secret.length > 0 ? secret : null;
  },

  get siteUrl(): string {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) return configured;

    // `env.siteUrl` is the CSRF `Origin` allowlist, so guessing it in production
    // would silently reject every legitimate admin write with a confusing 403.
    if (env.isProd) {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL is not configured. Set it to the site\'s public origin, ' +
          'e.g. https://kaiyo.example.com. It is required in production because admin ' +
          'writes are rejected unless the request Origin matches it.',
      );
    }

    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  },
};

/**
 * Development-only default. Production must supply `MONGODB_URI` explicitly; see
 * `env.mongoUri`.
 */
export const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/kaiyo';

/**
 * Rejects a connection string that cannot possibly work, *without echoing it*.
 *
 * Only the shape is checked. A wrong host or a revoked password is discovered by
 * the driver at connect time; these checks just turn the two most common
 * deployment mistakes (pasting the wrong variable, or pasting an Atlas UI string
 * that is not a URI) into an immediate, readable configuration error.
 */
export function assertValidMongoUri(uri: string): void {
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error(
      'MONGODB_URI is malformed: it must start with "mongodb://" or "mongodb+srv://". ' +
        'The value itself is never shown because it contains credentials.',
    );
  }
  if (/\s/.test(uri)) {
    throw new Error(
      'MONGODB_URI is malformed: it contains whitespace. Check for a stray space or a ' +
        'line break when pasting the value from the Atlas UI. The value is never shown ' +
        'because it contains credentials.',
    );
  }
}

/**
 * Removes any embedded credentials so a connection string can safely be written to
 * a log. Mirrors the redaction in `backend/scripts/create-admin.js`.
 */
export function redactMongoUri(uri: string): string {
  return uri.replace(/\/\/[^@/]*@/, '//***@');
}

/**
 * Throws on boot in production when a secret that must never be guessed is missing.
 * Called from `lib/db.ts` connect and from any route handler that needs the value,
 * so a misconfigured deployment fails with a 500 and a clear message instead of
 * running with a known default secret.
 */
export function requireSecret(name: 'SESSION_SECRET' | 'CSRF_SECRET'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Generate one with: openssl rand -base64 48`);
  }
  if (env.isProd && value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production.`);
  }
  return value;
}

export function generateSecret(bytes = 48): string {
  // Lazy require keeps `crypto` out of any edge bundle that only needs `env`.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('crypto').randomBytes(bytes).toString('base64url');
}
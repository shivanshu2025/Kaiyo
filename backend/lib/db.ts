import mongoose from 'mongoose';
import { env, redactMongoUri } from './env';

/**
 * Reusable MongoDB connection.
 *
 * Mongoose keeps its own connection pool, so a module-scoped promise is enough to
 * avoid re-connecting on every hot reload in development. In production the
 * connection is established once per server instance and reused.
 */

/**
 * Logs connection lifecycle transitions.
 *
 * Mongoose reconnects on its own, but without these listeners a dropped connection
 * is invisible: the next request fails with a generic buffering timeout and nothing
 * in the logs says the database was the reason. The messages deliberately omit the
 * connection string, which carries credentials.
 *
 * Registered once per process.
 */
let lifecycleBound = false;
function bindLifecycleLogging(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;

  const connection = mongoose.connection;
  connection.on('error', (error: Error) => {
    console.error('[db] connection error:', error?.message || error);
  });
  connection.on('disconnected', () => {
    console.warn('[db] disconnected; mongoose will attempt to reconnect');
  });
  connection.on('reconnected', () => {
    console.warn('[db] reconnected');
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __kaiyoMongoosePromise: Promise<typeof mongoose> | undefined;
}

/**
 * Module-scoped connection promise.
 *
 * `mongoose.connect()` opens a new pool every time it is called, so the promise
 * MUST be memoised - otherwise each request would open another pool until the
 * deployment exhausts its database connection limit. In development the promise
 * is additionally cached on `globalThis` so it survives a hot reload.
 */
let connectionPromise: Promise<typeof mongoose> | null = null;

async function connect(): Promise<typeof mongoose> {
  if (env.isBuild) {
    // `next build` renders pages that must not depend on a live database.
    throw new Error('Database access is not allowed during the build phase.');
  }

  // Read through `env.mongoUri` so there is exactly one place that decides what the
  // connection string is, validates its shape, and refuses to guess in production.
  const uri = env.mongoUri;

  mongoose.set('strictQuery', true);

  const options: mongoose.ConnectOptions = {
    // Fail fast rather than queueing operations for 30s when the DB is unreachable.
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    minPoolSize: env.isProd ? 1 : 0,
    autoIndex: !env.isProd,
  };

  // Reuse the already-open connection if one exists (e.g. after the server has
  // reconnected on its own following a transient network failure).
  if (mongoose.connection.readyState === 1) return mongoose;

  bindLifecycleLogging();

  try {
    return await mongoose.connect(uri, options);
  } catch (error) {
    // The driver's message can embed the connection string, so log only our own
    // redacted form alongside the error name.
    console.error(
      `[db] initial connection failed for ${redactMongoUri(uri)}:`,
      (error as Error)?.name,
    );
    throw error;
  }
}

export function db(): Promise<typeof mongoose> {
  if (env.isProd) {
    if (!connectionPromise) {
      connectionPromise = connect().catch((error) => {
        // Do not cache a rejected promise: a later request should retry.
        connectionPromise = null;
        throw error;
      });
    }
    return connectionPromise;
  }

  if (!global.__kaiyoMongoosePromise) {
    global.__kaiyoMongoosePromise = connect().catch((error) => {
      global.__kaiyoMongoosePromise = undefined;
      throw error;
    });
  }
  return global.__kaiyoMongoosePromise;
}

/** True when the driver is connected or currently connecting. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Maps a driver/model failure onto a safe, client-facing HTTP status + message. */
export function dbErrorStatus(error: unknown): { status: number; message: string } {
  const code = (error as { code?: number | string } | null)?.code;

  if (code === 11000) {
    return { status: 409, message: 'A record with those unique values already exists.' };
  }
  if (code === 'ValidationError' || (error as { name?: string })?.name === 'ValidationError') {
    return { status: 400, message: 'The submitted data failed validation.' };
  }
  if (code === 'CastError') {
    return { status: 400, message: 'A supplied identifier is not valid.' };
  }
  return { status: 500, message: 'A database error occurred.' };
}
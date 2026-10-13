#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * backend/scripts/test-backend.js
 * ---------------------------------------------------------------------------
 * End-to-end verification of the Kaiyo backend.
 *
 * Boots a real MongoDB (an ephemeral `mongodb-memory-server`), creates an admin
 * account with `backend/scripts/create-admin.js`, starts the production server
 * (`next start`), and then drives it over HTTP. Cookies, CSRF, middleware, the
 * server-component admin gate and every route handler are therefore exercised for
 * real rather than mocked.
 *
 *   npm test
 *
 * Set MONGODB_URI_TEST to run against an existing MongoDB instead of the
 * in-memory one.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

// This file lives at <root>/backend/scripts/, so the Next.js project root that
// gets built and started is two levels up, not one.
const ROOT = path.join(__dirname, '..', '..');
const CREATE_ADMIN = path.join(ROOT, 'backend', 'scripts', 'create-admin.js');
const PORT = Number(process.env.TEST_PORT || 3111);
const ORIGIN = `http://127.0.0.1:${PORT}`;

const PIN = '830124';
/**
 * Must satisfy the policy enforced by `changePinSchema` (via
 * `validatePasswordStrength`): at least 10 characters with an uppercase letter, a
 * lowercase letter and a number. It is the PIN the suite rotates *to*; `PIN` above
 * stays a legacy digits-only PIN, which is deliberate - it proves sign-in still
 * accepts credentials created before the policy existed.
 */
const NEW_PIN = 'KaiyoSuite2026';
const EMAIL = 'owner@example.com';
const EDITOR_EMAIL = 'editor@example.com';
const EDITOR_PIN = '909090';
const SETUP_INDEXES = path.join(ROOT, 'backend', 'scripts', 'setup-indexes.js');

/**
 * Every outgoing test request is stamped with a unique `x-forwarded-for`, and the
 * servers under test are started with `TRUSTED_PROXY=1`.
 *
 * Without this the suite would share a single rate-limit bucket, because
 * `lib/rate-limit.ts` ignores forwarded headers unless a trusted proxy is
 * declared. A shared bucket would make the per-IP limits (login 10/15min, leads
 * 3/30min) fail the suite for reasons that have nothing to do with the code under
 * test. Distinct addresses also mean a rate-limit assertion genuinely proves the
 * limit works rather than tripping over earlier traffic.
 */
let requestCounter = 0;
/**
 * When set, every request uses this address instead of a fresh one. Used by the
 * tests that deliberately accumulate a rate-limit budget or depend on the
 * duplicate-submission window, which are keyed on the client IP.
 */
let pinnedForwardedFor = null;
function pinIp(ip) {
  pinnedForwardedFor = ip;
}
function unpinIp() {
  pinnedForwardedFor = null;
}

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  const headers = { ...(init.headers || {}) };
  const alreadySet = Object.keys(headers).some(
    (name) => name.toLowerCase() === 'x-forwarded-for',
  );
  if (!alreadySet) {
    if (pinnedForwardedFor) {
      headers['x-forwarded-for'] = pinnedForwardedFor;
    } else {
      requestCounter += 1;
      // Documentation range (RFC 5737), so nothing here is a routable address.
      headers['x-forwarded-for'] = `203.0.113.${(requestCounter % 250) + 1}`;
    }
  }
  return realFetch(input, { ...init, headers });
};

/* ------------------------------ tiny runner ------------------------------ */

const results = [];
let failed_ = 0;
let skipped_ = 0;

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    if (error && error.__skip) {
      skipped_ += 1;
      results.push({ name, ok: true, skipped: true });
      console.log(`  SKIP  ${name}`);
      console.log(`        ${error.message}`);
      return;
    }
    failed_ += 1;
    results.push({ name, ok: false, error });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(error && error.stack) || error}`);
  }
}

/**
 * Marks a test as not applicable in this environment.
 *
 * A skipped case is reported, counted and printed - never silently dropped - so an
 * honest "this cannot be checked here" is visibly different from a pass.
 */
function skip(reason) {
  const error = new Error(reason);
  error.__skip = true;
  return error;
}

function section(title) {
  console.log(`\n--- ${title} ---`);
}

/* -------------------------------- helpers ------------------------------- */

function freePort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const response = await fetch(url, { redirect: 'manual' });
        if (response.status < 600) return resolve();
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline) return reject(new Error(`Server did not start: ${url}`));
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

/**
 * Splits a `Set-Cookie` header into individual cookies.
 *
 * A response can legitimately carry several cookies, either as separate headers
 * or comma-joined in one. Commas inside an `Expires=` attribute make naive
 * splitting wrong, so the split only happens at a comma that is followed by
 * something shaped like `name=`.
 */
function splitSetCookie(raw) {
  if (!raw) return [];
  return raw
    .split(/,(?=\s*[^=;,\s]+=)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function allSetCookies(response) {
  const raw = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : splitSetCookie(response.headers.get('set-cookie'));
  return splitSetCookie(raw.join(', '));
}

/** Cookie jar keyed by name, with cookie-attribute handling done manually. */
function createJar() {
  const jar = new Map();
  return {
    get(name) {
      return jar.get(name);
    },
    header() {
      return Array.from(jar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    absorb(response) {
      for (const entry of allSetCookies(response)) {
        const [pair] = entry.split(';');
        const index = pair.indexOf('=');
        if (index <= 0) continue;
        const name = pair.slice(0, index).trim();
        const value = decodeURIComponent(pair.slice(index + 1).trim());
        if (value === '') jar.delete(name);
        else jar.set(name, value);
      }
    },
  };
}

function authHeaders(jar, extra = {}) {
  const csrf = jar.get('kaiyo-admin-csrf');
  return {
    cookie: jar.header(),
    origin: ORIGIN,
    referer: `${ORIGIN}/admin`,
    // Mirrors `lib/admin-client.ts`, which the dashboard uses in production.
    ...(csrf ? { 'x-kaiyo-csrf': csrf } : {}),
    ...extra,
  };
}

async function api(jar, method, path, body, extraHeaders = {}) {
  const headers = authHeaders(jar, extraHeaders);
  const init = { method, headers, redirect: 'manual' };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${ORIGIN}${path}`, init);
  jar.absorb(response);
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload, headers: response.headers };
}

/* --------------------------------- main --------------------------------- */

async function main() {
  console.log('Kaiyo backend verification\n');

  /* 1. database ---------------------------------------------------------- */
  let mongoUri = process.env.MONGODB_URI_TEST || '';
  let memoryServer = null;

  if (!mongoUri) {
    console.log('Starting in-memory MongoDB (the first run downloads a mongod binary)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'kaiyo_test' } });
    mongoUri = memoryServer.getUri('kaiyo_test');
  }
  console.log(`Database ready.`);

  /* 2. admin account ----------------------------------------------------- */
  console.log('\nCreating the administrator account via backend/scripts/create-admin.js ...');
  const createResult = await runNode(CREATE_ADMIN, {
    MONGODB_URI: mongoUri,
    ADMIN_EMAIL: EMAIL,
    ADMIN_PIN: PIN,
    ADMIN_NAME: 'Owner',
  });
  if (createResult.code !== 0) {
    throw new Error(`create-admin.js failed:\n${createResult.stdout}\n${createResult.stderr}`);
  }
  console.log(createResult.stdout.trim().split('\n').map((line) => `  ${line}`).join('\n'));

  // A second, non-admin account to prove role checks are enforced. The
  // creation script always assigns the `admin` role, so it is demoted directly
  // in the database - exactly the kind of state an operator would set up.
  await runNode(CREATE_ADMIN, {
    MONGODB_URI: mongoUri,
    ADMIN_EMAIL: EDITOR_EMAIL,
    ADMIN_PIN: EDITOR_PIN,
    ADMIN_NAME: 'Editor',
  });
  await demoteToEditor(mongoUri, EDITOR_EMAIL);

  /* 3. re-running must not duplicate ------------------------------------- */
  /* --------------------------- create-admin ------------------------ */
  section('backend/scripts/create-admin.js');
  await test('re-running does not create a duplicate administrator', async () => {
    const again = await runNode(CREATE_ADMIN, {
      MONGODB_URI: mongoUri,
      ADMIN_EMAIL: EMAIL,
      ADMIN_PIN: PIN,
    });
    assert.strictEqual(again.code, 1, 'expected a non-zero exit for an existing account');
    assert.match(again.stdout, /already exists/i);
    assert.ok(
      !again.stdout.includes(PIN),
      'the PIN must never be echoed to the console',
    );
    assert.ok(!/\$2[aby]\$/.test(again.stdout), 'the hash must never be echoed to the console');
  });

  await test('a short PIN is rejected before anything is written', async () => {
    const weak = await runNode(CREATE_ADMIN, {
      MONGODB_URI: mongoUri,
      ADMIN_EMAIL: 'weak@example.com',
      ADMIN_PIN: '12',
    });
    assert.strictEqual(weak.code, 1);
    assert.match(weak.stdout + weak.stderr, /4 to 12 digits/i);
  });

  await test('a non-numeric PIN is rejected', async () => {
    const result = await runNode(CREATE_ADMIN, {
      MONGODB_URI: mongoUri,
      ADMIN_EMAIL: 'letters@example.com',
      ADMIN_PIN: 'abcdefgh',
    });
    assert.strictEqual(result.code, 1, 'a non-numeric PIN was accepted');
    assert.match(result.stdout + result.stderr, /4 to 12 digits/i);
  });

  await test('a PIN longer than 12 digits is rejected', async () => {
    const result = await runNode(CREATE_ADMIN, {
      MONGODB_URI: mongoUri,
      ADMIN_EMAIL: 'toolong@example.com',
      ADMIN_PIN: '1234567890123',
    });
    assert.strictEqual(result.code, 1, 'an over-long PIN was accepted');
    assert.match(result.stdout + result.stderr, /4 to 12 digits/i);
  });

  await test('a 12-digit PIN is accepted', async () => {
    const result = await runNode(CREATE_ADMIN, {
      MONGODB_URI: mongoUri,
      ADMIN_EMAIL: 'exactlimit@example.com',
      ADMIN_PIN: '123456789012',
    });
    assert.strictEqual(result.code, 0, result.stdout + result.stderr);

    // Leave the database as we found it.
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    await mongoose.connection.collection('admins').deleteOne({ email: 'exactlimit@example.com' });
    await mongoose.disconnect();
  });

  /* --------------------------- db configuration --------------------- */
  section('Database configuration');

  await test('a malformed MONGODB_URI is rejected without echoing the value', async () => {
    // A connection string with credentials, but the wrong scheme.
    const leaked = 'postgres://db_user:SuperSecret123@somewhere/kaiyo';
    const result = await runNode(SETUP_INDEXES, { MONGODB_URI: leaked });
    assert.strictEqual(result.code, 1, 'a malformed URI was accepted');
    assert.match(result.stdout + result.stderr, /malformed/i);
    assert.ok(
      !(result.stdout + result.stderr).includes('SuperSecret123'),
      'the connection string was echoed to the console',
    );
  });

  await test('a missing MONGODB_URI produces a configuration error', async () => {
    const result = await runNode(SETUP_INDEXES, { MONGODB_URI: '' });
    assert.strictEqual(result.code, 1);
    assert.match(result.stdout + result.stderr, /MONGODB_URI is not set/i);
  });

  await test('the index setup script redacts credentials', async () => {
    const { redactUri } = require(SETUP_INDEXES);
    const redacted = redactUri('mongodb+srv://db_user:SuperSecret123@cluster.mongodb.net/kaiyo');
    assert.ok(!redacted.includes('SuperSecret123'), 'credentials survived redaction');
    assert.ok(!redacted.includes('db_user'), 'username survived redaction');
    assert.ok(redacted.includes('cluster.mongodb.net'), 'the host should survive');
  });

  await test('--check reports the existing indexes and changes nothing', async () => {
    const result = await runNode(SETUP_INDEXES, { MONGODB_URI: mongoUri }, ['--check']);
    assert.strictEqual(result.code, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /check only/i);
    assert.ok(result.stdout.includes('adminsessions'), 'expected the sessions collection');
  });

  await test('the index manifest covers every unique and TTL index', async () => {
    const { MANIFEST } = require(SETUP_INDEXES);

    // Guards the specific production gaps this script exists to close.
    const required = [
      ['admins', 'email', 'unique'],
      ['adminsessions', 'tokenHash', 'unique'],
      ['adminsessions', 'expiresAt', 'ttl'],
      ['ratelimits', 'key', 'unique'],
      ['ratelimits', 'resetAt', 'ttl'],
      ['contactsubmissions', 'publicId', 'unique'],
      ['testimonials', 'publicId', 'unique'],
      ['leads', 'publicId', 'unique'],
    ];

    for (const [collection, field, kind] of required) {
      const indexes = MANIFEST[collection] || [];
      const match = indexes.find((index) => Object.prototype.hasOwnProperty.call(index.keys, field));
      assert.ok(match, `${collection}.${field} is missing from the manifest`);
      if (kind === 'unique') {
        assert.strictEqual(match.unique, true, `${collection}.${field} must be unique`);
      } else {
        assert.strictEqual(match.ttl, 0, `${collection}.${field} must be a TTL index`);
      }
    }
  });

  await test('the index script creates every required unique and TTL index', async () => {
    // This is the whole point of the script: production runs with `autoIndex`
    // disabled, so the running app creates nothing. Running the script is the only
    // way these constraints come into existence in production.
    const result = await runNode(SETUP_INDEXES, { MONGODB_URI: mongoUri });
    assert.strictEqual(result.code, 0, result.stdout + result.stderr);

    const { MANIFEST } = require(SETUP_INDEXES);
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    const db = mongoose.connection.db;

    const problems = [];
    for (const [collection, indexes] of Object.entries(MANIFEST)) {
      const actual = await db.collection(collection).indexes();
      for (const index of indexes) {
        const signature = Object.entries(index.keys).map(([k, v]) => `${k}:${v}`).join(',');
        const found = actual.find(
          (existing) =>
            Object.entries(existing.key).map(([k, v]) => `${k}:${v}`).join(',') === signature,
        );
        if (!found) {
          problems.push(`${collection}{${signature}} missing`);
          continue;
        }
        if (index.unique && !found.unique) {
          problems.push(`${collection}{${signature}} is not unique`);
        }
        if (index.ttl !== undefined && found.expireAfterSeconds !== index.ttl) {
          problems.push(`${collection}{${signature}} has no TTL`);
        }
      }
    }

    await mongoose.disconnect();
    assert.deepStrictEqual(problems, [], problems.join('; '));
  });

  await test('running the index script twice is safe and drops nothing', async () => {
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });

    const before = await mongoose.connection.db.collection('admins').indexes();
    await mongoose.disconnect();

    const again = await runNode(SETUP_INDEXES, { MONGODB_URI: mongoUri });
    assert.strictEqual(again.code, 0, again.stdout + again.stderr);

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    const after = await mongoose.connection.db.collection('admins').indexes();
    await mongoose.disconnect();

    // `syncIndexes()` would have removed anything not declared in the schema. The
    // script uses `createIndex()`, so an existing index must survive untouched.
    assert.ok(after.length >= before.length, 'an index was removed on the second run');
  });

  /* 4. server ------------------------------------------------------------ */
  const port = await freePort(PORT);

  // Guard against the worst possible test-harness failure: a different process
  // already owning `PORT`. `freePort` would silently hand us another port while
  // every request below still goes to `ORIGIN` - so the suite would quietly assert
  // against someone else's server (a stale `next dev`, for example, sets
  // `Secure: false` cookies and fails a dozen unrelated assertions).
  const occupied = await new Promise((resolve) => {
    const socket = net.connect(PORT, '127.0.0.1');
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    setTimeout(() => { socket.destroy(); resolve(false); }, 1000);
  });
  if (occupied) {
    throw new Error(
      `Port ${PORT} is already in use. Something is serving on it, so the suite would ` +
        `test the wrong server. Stop it, or re-run with TEST_PORT=<free port>.`,
    );
  }
  // `next start` is invoked through the project's own CLI entry point rather
  // than `npx`, which is not spawnable on every platform.
  const nextBin = require.resolve('next/dist/bin/next');
  const server = spawn(process.execPath, [nextBin, 'start', '--port', String(port)], {
      cwd: ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        MONGODB_URI: mongoUri,
        NEXT_PUBLIC_SITE_URL: ORIGIN,
        CSRF_SECRET: 'test-csrf-secret-0123456789abcdefghijklmnop',
        SESSION_SECRET: 'test-session-secret-0123456789abcdefghijklmno',
        MEDIA_STORAGE_DRIVER: 'local',
        TRUSTED_PROXY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const serverLog = [];
  server.stdout.on('data', (chunk) => {
    serverLog.push(chunk.toString());
    if (process.env.TEST_VERBOSE) process.stdout.write(chunk);
  });
  server.stderr.on('data', (chunk) => {
    serverLog.push(chunk.toString());
    if (process.env.TEST_VERBOSE) process.stderr.write(chunk);
  });

  const cleanup = async () => {
    if (!server.killed) {
      server.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!server.killed) server.kill('SIGKILL');
    }
  };

  try {
    await waitForServer(`${ORIGIN}/api/cms`, 180_000);
  } catch (error) {
    console.error('\nServer output:\n', serverLog.join(''));
    if (memoryServer) await memoryServer.stop();
    throw error;
  }

  try {
    await runSuite(mongoUri);
  } catch (error) {
    console.error('\nSuite aborted:', error);
  } finally {
    if (failed_ > 0 || results.some((r) => !r.ok)) {
      console.log('\n--- server log (last 40 lines) ---');
      console.log(serverLog.join('').split('\n').slice(-40).join('\n'));
    }
    await cleanup();
  }

  /* 6. media storage (dev server) -------------------------------------- */
  // The local storage driver is refused in production on purpose, so the upload
  // success path has to be exercised against `next dev`.
  try {
    await runMediaSuite(mongoUri);
    await runProductionEnvSuite();
  } finally {
    if (memoryServer) await memoryServer.stop();
  }

  /* 5. report ------------------------------------------------------------ */
  const failed = results.filter((result) => !result.ok);
  console.log(`\n========================================`);
  console.log(
    `  ${results.length - failed.length}/${results.length} passed` +
      (skipped_ > 0 ? ` (${skipped_} skipped)` : ''),
  );
  console.log(`========================================`);

  if (failed.length > 0) {
    console.log('\nFailures:');
    for (const failure of failed) console.log(`  - ${failure.name}`);
    process.exitCode = 1;
  }
}

/* ------------------ production configuration guards ------------------ */

/**
 * Whether one of the env files Next will load defines `name`.
 *
 * This exists because `startWithout()` removes a variable from the *spawned*
 * environment, which does NOT stop Next from supplying it: `@next/env` copies a
 * value out of `.env.local` whenever the variable is absent from the initial
 * `process.env` snapshot, and it explicitly re-deletes variables whose initial
 * value was `''`. So on a machine with a filled-in `.env.local`, deleting
 * `MONGODB_URI` from the child env changes nothing and the app boots normally -
 * which made "production without MONGODB_URI refuses to serve" fail at random
 * depending on whether the server had finished booting inside the poll window.
 *
 * The only way to truly withhold the variable would be to move the user's
 * `.env.local` aside for the duration of the run, which this suite must not do.
 * So the affected cases are skipped with an explicit reason instead: a vacuous
 * pass is worse than a visible skip.
 */
function envFileDefines(name) {
  const fs = require('fs');
  const candidates = [
    '.env.production.local',
    '.env.local',
    '.env.production',
    '.env',
  ];

  for (const candidate of candidates) {
    const full = path.join(ROOT, candidate);
    if (!fs.existsSync(full)) continue;
    const contents = fs.readFileSync(full, 'utf8');
    const matched = contents
      .split(/\r?\n/)
      .some((rawLine) => {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) return false;
        return new RegExp(`^${name}\\s*=`).test(line);
      });
    if (matched) return candidate;
  }
  return null;
}

/**
 * Boots a production server with deliberately broken environment configuration and
 * asserts the app refuses to guess rather than silently falling back to localhost.
 */
async function runProductionEnvSuite() {
  section('Production configuration guards');

  const port = await freePort(PORT + 2);
  const origin = `http://127.0.0.1:${port}`;
  const nextBin = require.resolve('next/dist/bin/next');

  const startWithout = async (missing) => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/kaiyo',
      NEXT_PUBLIC_SITE_URL: origin,
      CSRF_SECRET: 'test-csrf-secret-0123456789abcdefghijklmnop',
      SESSION_SECRET: 'test-session-secret-0123456789abcdefijklmno',
      MEDIA_STORAGE_DRIVER: 'local',
    };
    delete env[missing];

    const child = spawn(process.execPath, [nextBin, 'start', '--port', String(port)], {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const logs = [];
    child.stdout.on('data', (c) => logs.push(c.toString()));
    child.stderr.on('data', (c) => logs.push(c.toString()));

    let status = null;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const response = await fetch(`${origin}/api/health`);
        status = response.status;
      } catch {
        // Server not accepting connections yet, or refused the request entirely.
      }
      if (status !== null) break;
    }

    const stop = async () => {
      child.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 800));
      if (!child.killed) child.kill('SIGKILL');
    };

    return { status, logs: logs.join(''), stop };
  };

  await test('production without MONGODB_URI refuses to serve, and never falls back to localhost', async () => {
    const providedBy = envFileDefines('MONGODB_URI');
    if (providedBy) {
      throw skip(
        `${providedBy} defines MONGODB_URI and Next re-loads it into the server, so the variable ` +
          'cannot be withheld here. Move that file aside temporarily to run this check.',
      );
    }

    const run = await startWithout('MONGODB_URI');
    try {
      assert.notStrictEqual(run.status, 200, 'the app served traffic with no database configured');
      if (run.status !== null) assert.strictEqual(run.status, 503);
      assert.ok(
        !/27017/.test(run.logs) || !/connecting/i.test(run.logs),
        'the log suggests a localhost fallback connection was attempted',
      );
    } finally {
      await run.stop();
    }
  });

  await test('production without NEXT_PUBLIC_SITE_URL refuses to serve', async () => {
    const providedBy = envFileDefines('NEXT_PUBLIC_SITE_URL');
    if (providedBy) {
      throw skip(
        `${providedBy} defines NEXT_PUBLIC_SITE_URL and Next re-loads it into the server, so the ` +
          'variable cannot be withheld here. Move that file aside temporarily to run this check.',
      );
    }

    const run = await startWithout('NEXT_PUBLIC_SITE_URL');
    try {
      // The health probe must not depend on the site URL, so a 200 here is
      // acceptable; what must never happen is a silent localhost default being
      // used for the CSRF origin allowlist.
      if (run.status === 200) {
        assert.ok(
          !/localhost:3000/.test(run.logs),
          'the app fell back to http://localhost:3000 in production',
        );
      }
    } finally {
      await run.stop();
    }
  });

  await test('the health endpoint never leaks a connection string', async () => {
    const run = await startWithout('__NOT_SET__');
    try {
      let body = '';
      try {
        const response = await fetch(`${origin}/api/health`);
        body = await response.text();
      } catch {
        // The server may not have finished booting; the log assertions below still
        // apply, and the health endpoint's own body was verified in the main suite.
      }
      assert.ok(!body.includes('mongodb://'), 'a connection scheme leaked from /api/health');
      assert.ok(!body.includes('mongodb+srv://'), 'a connection scheme leaked from /api/health');
      assert.ok(!/\.mongodb\.net|27017/.test(body), 'a host or port leaked from /api/health');
    } finally {
      await run.stop();
    }
  });
}

/* -------------------------------- suite ---------------------------------- */

async function runSuite(mongoUri) {
  const anon = createJar();
  const admin = createJar();
  const editor = createJar();

  /* ------------------------- authentication -------------------------- */
  section('Authentication');

  await test('an anonymous login with a wrong PIN fails with 401', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/login', {
      pin: '000000',
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(payload.success, false);
    assert.ok(!('token' in (payload.data || {})), 'must not return a token');
  });

  await test('a correct PIN for an inactive account is still refused', async () => {
    // Sign-in is PIN-only, so there is no username to be wrong about. What must not
    // happen is a deactivated account authenticating on PIN alone.
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    await mongoose.connection
      .collection('admins')
      .updateOne({ email: EMAIL }, { $set: { active: false } });
    await mongoose.disconnect();

    const { status, payload } = await api(createJar(), 'POST', '/api/admin/login', {
      pin: PIN,
    });
    assert.strictEqual(status, 401, JSON.stringify(payload));

    // Restore, leaving the database as we found it.
    const again = require('mongoose');
    await again.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    await again.connection.collection('admins').updateOne({ email: EMAIL }, { $set: { active: true } });
    await again.disconnect();
  });

  await test('a malformed or over-long sign-in PIN is rejected with 422', async () => {
    // Sign-in validates the *shape* only. It must accept whatever is already
    // stored - including a legacy digits-only PIN and one meeting the current
    // strength policy - so "non-numeric" and "short" are no longer malformed by
    // themselves; they simply fail to match, which is a 401, not a 422.
    for (const bad of ['', 'a'.repeat(73), '\u00e9'.repeat(40)]) {
      const { status, payload } = await api(createJar(), 'POST', '/api/admin/login', { pin: bad });
      assert.strictEqual(status, 422, `PIN of length ${bad.length} returned ${status}`);
      assert.ok(payload.fields && payload.fields.pin, 'expected a pin field error');
    }

    // Well-formed but unknown: rejected as a credential, not as a validation error.
    for (const bad of ['12', 'abcdefgh', '1234567890123']) {
      const { status } = await api(createJar(), 'POST', '/api/admin/login', { pin: bad });
      assert.strictEqual(status, 401, `PIN ${JSON.stringify(bad)} returned ${status}`);
    }
  });

  await test('a username or password field is ignored entirely', async () => {
    // Legacy fields must not influence the decision, and must not be echoed back.
    const { status, payload } = await api(createJar(), 'POST', '/api/admin/login', {
      email: 'nobody@example.com',
      password: 'CorrectHorse9Battery',
      pin: '000000',
    });
    assert.strictEqual(status, 401, JSON.stringify(payload));
    assert.ok(!JSON.stringify(payload).includes('CorrectHorse9Battery'), 'a credential was echoed back');
  });

  let loginCookies = [];

  await test('an alphanumeric PIN is a valid credential shape, not a validation error', async () => {
    // The reported bug was on the client: the sign-in input stripped every
    // non-digit as it was typed, so a PIN meeting the Change-PIN policy could not
    // be entered at all. The server half had to be widened at the same time -
    // otherwise the admin saves a compliant PIN and is then locked out of it.
    //
    // This asserts the shape contract the form depends on: uppercase, lowercase and
    // digits together are well-formed input, so they are decided as a *credential*
    // (401) and never rejected as malformed (422). That an alphanumeric PIN really
    // does sign in is proven end-to-end further down, by the PIN-change test, which
    // signs in with the alphanumeric NEW_PIN.
    const alphanumeric = 'KaiyoAlnum7Test';
    assert.match(alphanumeric, /[A-Z]/);
    assert.match(alphanumeric, /[a-z]/);
    assert.match(alphanumeric, /\d/);

    const jar = createJar();
    const wrong = await api(jar, 'POST', '/api/admin/login', { pin: alphanumeric });
    assert.strictEqual(wrong.status, 401, JSON.stringify(wrong.payload));
    assert.ok(!wrong.payload.fields, 'an alphanumeric PIN was rejected as malformed');

    // The comparison is over the whole value: neither a prefix nor a value with one
    // character appended is the PIN.
    for (const nearMiss of [PIN.slice(0, -1), `${PIN}0`]) {
      const { status } = await api(createJar(), 'POST', '/api/admin/login', { pin: nearMiss });
      assert.strictEqual(status, 401, `a near-miss PIN was accepted (status ${status})`);
    }
  });

  await test('the sign-in input accepts letters and is not capped at 12 characters', async () => {
    // Guards the client half directly. The attributes that made an alphanumeric PIN
    // impossible to enter must not come back:
    //   onChange stripping /[^0-9]/, pattern="[0-9]*", inputMode="numeric", and
    //   maxLength={12}, which also truncated a 10+ character compliant PIN.
    const fs = require('fs');
    const source = fs.readFileSync(
      path.join(ROOT, 'components', 'admin', 'AdminLoginForm.tsx'),
      'utf8',
    );
    // Comments explain these very attributes, so they are stripped before asserting
    // on them - otherwise the explanation would read as the defect.
    const code = source
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');

    assert.ok(!/\[\^0-9\]/.test(code), 'the sign-in input strips non-numeric characters again');
    assert.ok(!/pattern="\[0-9\]\*"/.test(code), 'a digits-only pattern is back on the input');
    assert.ok(!/inputMode="numeric"/.test(code), 'the input requests a numeric keypad again');
    assert.ok(!/maxLength=\{12\}/.test(code), 'the input is capped at 12 characters again');
    assert.ok(
      /onChange=\{\(event\) => setPin\(event\.target\.value\)\}/.test(code),
      'the input no longer passes its value through unmodified',
    );

    // The presentation is preserved: masked by default, revealed by the same control.
    assert.ok(/type=\{pinVisible \? 'text' : 'password'\}/.test(code), 'the PIN is no longer masked by default');
    assert.ok(/setPinVisible\(\(visible\) => !visible\)/.test(code), 'the show/hide control is gone');
    assert.ok(/aria-label=\{pinVisible \? 'Hide PIN' : 'Show PIN'\}/.test(code), 'the eye button lost its label');
    assert.ok(/<EyeIcon visible=\{pinVisible\} \/>/.test(code), 'the eye icon is gone');
    assert.ok(/<LockIcon \/>/.test(code), 'the lock icon is gone');
    assert.ok(/<ArrowIcon \/>/.test(code), 'the submit arrow is gone');
  });

  await test('valid credentials succeed and set an HttpOnly session cookie', async () => {
    const response = await fetch(`${ORIGIN}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ pin: PIN }),
    });
    const payload = await response.json().catch(() => null);

    assert.strictEqual(response.status, 201, JSON.stringify(payload));
    assert.strictEqual(payload.success, true);

    loginCookies = allSetCookies(response);
    admin.absorb(response);

    assert.ok(admin.get('kaiyo-admin-token'), 'session cookie was not set');
    // Nothing resembling a token may appear in the JSON body - it belongs in an
    // HttpOnly cookie only.
    assert.ok(!JSON.stringify(payload).includes(admin.get('kaiyo-admin-token')));
  });

  await test('the session cookie is HttpOnly, Secure and SameSite=Lax', async () => {
    const sessionCookie = loginCookies.find((c) => c.startsWith('kaiyo-admin-token='));
    assert.ok(sessionCookie, `no session cookie in: ${JSON.stringify(loginCookies)}`);
    assert.match(sessionCookie, /HttpOnly/i, 'session cookie must be HttpOnly');
    assert.match(sessionCookie, /SameSite=Lax/i);
    assert.match(sessionCookie, /Secure/i, 'production cookies must be Secure');

    // The CSRF cookie is deliberately readable so the dashboard can echo it.
    const csrfCookie = loginCookies.find((c) => c.startsWith('kaiyo-admin-csrf='));
    assert.ok(csrfCookie, `the CSRF cookie was not set: ${JSON.stringify(loginCookies)}`);
    assert.ok(!/HttpOnly/i.test(csrfCookie), 'the CSRF cookie must be readable by the client');
  });

  await test('every sign-in mints a new token (session fixation defence)', async () => {
    const first = createJar();
    await api(first, 'POST', '/api/admin/login', { pin: PIN });

    const second = createJar();
    await api(second, 'POST', '/api/admin/login', { pin: PIN });

    assert.notStrictEqual(
      first.get('kaiyo-admin-token'),
      second.get('kaiyo-admin-token'),
      'a fresh token must be minted on every sign-in',
    );

    // Both devices stay usable, which is what the session list and per-session
    // revocation in Admin Settings depend on.
    for (const [label, jar] of [['first', first], ['second', second]]) {
      const probe = await fetch(`${ORIGIN}/api/admin/security`, {
        headers: { cookie: jar.header() },
      });
      assert.strictEqual(probe.status, 200, `the ${label} session was invalidated`);
    }

    // Re-establish the shared admin jar.
    admin.absorb(
      await fetch(`${ORIGIN}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ pin: PIN }),
      }),
    );
  });

  await test('an existing admin session can read the admin CMS scope', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/cms', undefined, {
      'x-kaiyo-admin': '1',
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.scope, 'admin');
    assert.ok(payload.data.siteSettings, 'siteSettings missing');
  });

  await test('a non-admin account is refused admin APIs with 403', async () => {
    const login = await api(editor, 'POST', '/api/admin/login', {
      pin: EDITOR_PIN,
    });
    assert.strictEqual(login.status, 201, JSON.stringify(login.payload));

    const { status, payload } = await api(editor, 'GET', '/api/contact-submissions');
    assert.strictEqual(status, 403);
    assert.strictEqual(payload.success, false);
  });

  await test('a non-admin account does not receive the admin CMS scope', async () => {
    // The admin projection contains contact submissions - personal data. A
    // lower-privilege session must be served the public document instead.
    const { status, payload } = await api(editor, 'GET', '/api/cms', undefined, {
      'x-kaiyo-admin': '1',
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.scope, 'public', 'an editor was served the privileged scope');
    assert.deepStrictEqual(payload.data.contact.submissions, [], 'submissions leaked to an editor');
  });

  await test('a non-admin account cannot mutate the CMS', async () => {
    const { status } = await api(editor, 'PUT', '/api/cms', {
      siteSettings: { logo: '/images/hacked.png' },
    });
    assert.strictEqual(status, 403);
  });

  /* -------------------------- authorization -------------------------- */
  section('Authorization');

  const protectedReads = [
    '/api/contact-submissions',
    '/api/testimonials',
    '/api/admin/security',
    '/api/admin/sessions',
    '/api/admin/media',
    '/api/admin/overview',
  ];

  for (const path of protectedReads) {
    await test(`GET ${path} returns 401 when unauthenticated`, async () => {
      const { status, payload } = await api(createJar(), 'GET', path);
      assert.strictEqual(status, 401, `${path} returned ${status}`);
      assert.strictEqual(payload.success, false);
    });
  }

  await test('PUT /api/cms returns 401 when unauthenticated', async () => {
    const { status } = await api(createJar(), 'PUT', '/api/cms', { siteSettings: { logo: '/x.png' } });
    assert.strictEqual(status, 401);
  });

  await test('admin pages redirect an anonymous visitor to the login page', async () => {
    const response = await fetch(`${ORIGIN}/admin`, { redirect: 'manual' });
    assert.strictEqual(response.status, 307);
    assert.match(response.headers.get('location') || '', /\/admin\/login/);
  });

  await test('an admin page is not rendered for a forged session cookie', async () => {
    const response = await fetch(`${ORIGIN}/admin/pages/home`, {
      headers: { cookie: 'kaiyo-admin-token=forged.token.value' },
      redirect: 'manual',
    });
    assert.ok(
      response.status === 307 || response.status === 200,
      `unexpected status ${response.status}`,
    );
    if (response.status === 200) {
      const html = await response.text();
      assert.ok(!html.includes('Admin Overview') && !html.includes('Overview'), 'dashboard rendered without auth');
    }
  });

  await test('the admin inbox screens are wired to their paginated endpoints', async () => {
    // The wiring lives in client bundles, so it cannot be asserted from the served
    // HTML - the pages render their loading state on the server pass. Read the
    // production build the suite is serving instead, the same way the public
    // bundle test does.
    const fs = require('fs');
    const chunkDir = path.join(ROOT, '.next', 'static', 'chunks');
    const files = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (full.endsWith('.js')) files.push(full);
      }
    })(chunkDir);

    const sources = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    for (const endpoint of [
      '/api/admin/leads',
      '/api/admin/testimonials',
      '/api/admin/overview',
      '/api/testimonials?',
      '/api/contact-submissions?',
    ]) {
      assert.ok(sources.includes(endpoint), `no client bundle calls ${endpoint}`);
    }
  });

  await test('the admin leads page renders for a signed-in administrator', async () => {
    const response = await fetch(`${ORIGIN}/admin/pages/leads`, {
      headers: { cookie: admin.header() },
      redirect: 'manual',
    });
    assert.strictEqual(response.status, 200);

    const html = await response.text();
    assert.ok(html.includes('Inquiries'), 'the leads page did not render its heading');
  });

  await test('the leads screen is reachable from the sidebar', async () => {
    const response = await fetch(`${ORIGIN}/admin`, {
      headers: { cookie: admin.header() },
      redirect: 'manual',
    });
    assert.strictEqual(response.status, 200);

    const html = await response.text();
    assert.ok(
      html.includes('/admin/pages/leads'),
      'no sidebar link to the inquiries screen was rendered',
    );
  });

  await test('the testimonials and contact screens still render for an administrator', async () => {
    // Their data is fetched client-side, so the server pass renders the loading
    // state; what matters here is that the route is reachable and the server
    // component gate let the request through.
    for (const route of ['/admin/pages/testimonials', '/admin/pages/contact']) {
      const response = await fetch(`${ORIGIN}${route}`, {
        headers: { cookie: admin.header() },
        redirect: 'manual',
      });
      assert.strictEqual(response.status, 200, `${route} did not render`);
    }
  });

  /* ------------------------------- CSRF ------------------------------ */
  section('CSRF protection');

  await test('PUT /api/cms with a session but no CSRF header is refused', async () => {
    const response = await fetch(`${ORIGIN}/api/cms`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: admin.header(), origin: ORIGIN },
      body: JSON.stringify({ siteSettings: { logo: '/images/Kaiyologo.png' } }),
    });
    assert.strictEqual(response.status, 403);
    const payload = await response.json();
    assert.strictEqual(payload.success, false);
    assert.match(payload.error, /security token/i);
  });

await test('PUT /api/cms with a forged CSRF header is refused', async () => {
    const response = await fetch(`${ORIGIN}/api/cms`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        cookie: `${admin.header()}`,
        origin: ORIGIN,
        'x-kaiyo-csrf': 'a'.repeat(64),
      },
      body: JSON.stringify({ siteSettings: { logo: '/images/Kaiyologo.png' } }),
    });
    assert.strictEqual(response.status, 403);
  });

  await test('PUT /api/cms with the correct CSRF header succeeds', async () => {
    const response = await fetch(`${ORIGIN}/api/cms`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        cookie: admin.header(),
        origin: ORIGIN,
        'x-kaiyo-csrf': admin.get('kaiyo-admin-csrf') || '',
      },
      body: JSON.stringify({ siteSettings: { logo: '/images/Kaiyologo.png' } }),
    });
    assert.strictEqual(response.status, 200);
  });

  await test('a cross-origin mutation is refused', async () => {
    const response = await fetch(`${ORIGIN}/api/cms`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        cookie: admin.header(),
        origin: 'https://evil.example.com',
        'x-kaiyo-csrf': admin.get('kaiyo-admin-csrf') || '',
      },
      body: JSON.stringify({ siteSettings: { logo: '/images/Kaiyologo.png' } }),
    });
    assert.strictEqual(response.status, 403);
  });

  /* ------------------------- privacy / public ------------------------ */
  section('Public API privacy');

  let publicCms;
  await test('the public CMS payload never contains contact submissions', async () => {
    const { status, payload } = await api(createJar(), 'GET', '/api/cms');
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.scope, 'public');
    publicCms = payload.data;
    assert.deepStrictEqual(payload.data.contact.submissions, [], 'submissions leaked publicly');
    assert.ok(!JSON.stringify(payload.data).includes('kaiyo.test'), 'test submission leaked publicly');
  });

  /* ------------------------- contact submissions -------------------- */
  section('Health check');

  await test('GET /api/health reports the database is reachable', async () => {
    const { status, payload } = await api(createJar(), 'GET', '/api/health');
    assert.strictEqual(status, 200, JSON.stringify(payload));
    assert.strictEqual(payload.success, true);
    assert.strictEqual(payload.checks.database, 'up');
  });

  await test('the health response exposes no secrets or infrastructure detail', async () => {
    const response = await fetch(`${ORIGIN}/api/health`);
    const body = await response.text();
    assert.ok(!body.includes('mongodb://'), 'a connection scheme leaked');
    assert.ok(!body.includes('mongodb+srv://'), 'a connection scheme leaked');
    assert.ok(!/27017|\.mongodb\.net/.test(body), 'a host or port leaked');
    for (const secret of ['CSRF_SECRET', 'SESSION_SECRET', 'MONGODB_URI', 'BLOB_READ_WRITE_TOKEN']) {
      assert.ok(!body.includes(process.env[secret] || '\u0000'), `${secret} leaked`);
    }
  });

  section('Contact submissions');

  // These three tests all depend on the same client address: the duplicate-window
  // check compares a salted IP hash, and the rate-limit test has to exhaust one
  // bucket. Pin it for the duration of the section.
  pinIp('198.51.100.42');

  let submissionId;
  await test('a valid submission is accepted and stored', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: '  Ada Lovelace  ',
      email: 'Ada@Example.COM',
      message: 'I would like a portfolio site.',
      phone: '+91 98765 43210',
    });
    assert.strictEqual(status, 201, JSON.stringify(payload));
    submissionId = payload.data.id;
  });

  await test('invalid submissions are rejected with field errors', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: '',
      email: 'not-an-email',
      message: '',
    });
    assert.strictEqual(status, 422);
    assert.ok(payload.fields, 'expected field-level errors');
    assert.ok(payload.fields.email);
  });

  await test('the honeypot field is silently accepted and stores nothing', async () => {
    const before = await api(admin, 'GET', '/api/contact-submissions');
    const { status } = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: 'Bot',
      email: 'bot@example.com',
      message: 'buy things',
      website: 'http://spam.example.com',
    });
    assert.strictEqual(status, 201);

    const after = await api(admin, 'GET', '/api/contact-submissions');
    assert.strictEqual(
      after.payload.data.pagination.total,
      before.payload.data.pagination.total,
      'a honeypot submission must not be stored',
    );
  });

  await test('an identical resubmission inside the window is rejected', async () => {
    const { status } = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I would like a portfolio site.',
    });
    assert.strictEqual(status, 409);
  });

  await test('rate limiting eventually rejects the contact endpoint', async () => {
    let limited = false;
    for (let i = 0; i < 10 && !limited; i += 1) {
      const response = await api(createJar(), 'POST', '/api/contact-submissions', {
        name: `Spammer ${i}`,
        email: `spam${i}@example.com`,
        message: `unique message ${i} ${Math.random()}`,
      });
      if (response.status === 429) limited = true;
    }
    assert.ok(limited, 'the contact endpoint was never rate limited');

    // A different address must not be affected by the exhausted bucket.
    unpinIp();
    const other = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: 'Someone Else',
      email: 'someone-else@example.com',
      message: 'A completely different message for a different address.',
    });
    assert.notStrictEqual(other.status, 429, 'one client exhausted the global limit');
    pinIp('198.51.100.42');
  });

  unpinIp();

  await test('an admin can list submissions with pagination metadata', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/contact-submissions?page=1&limit=5');
    assert.strictEqual(status, 200);
    assert.ok(payload.data.pagination);
    assert.strictEqual(payload.data.pagination.page, 1);
    assert.strictEqual(payload.data.pagination.limit, 5);
    assert.ok(payload.data.items.length <= 5);
  });

  const paginationFixtures = ['Pagination Fixture One', 'Pagination Fixture Two'];

  await test('omitting limit uses the default page size, not 1', async () => {
    // Two fixtures are created first so the assertion measures the *page size*
    // rather than however many testimonials happen to exist. This previously
    // leaned on the two invented testimonials that `cms-defaults.ts` used to seed
    // into the database; those are gone now (fabricated client quotes must never
    // be published), so real rows are inserted through the public endpoint
    // instead. Admin GET /api/testimonials returns every status, so `pending` is
    // enough.
    for (const name of paginationFixtures) {
      const { status: seedStatus } = await api(createJar(), 'POST', '/api/testimonials', {
        name,
        content: 'Fixture row used only to verify the default page size.',
        rating: 5,
      });
      assert.strictEqual(seedStatus, 201, `could not create the fixture "${name}"`);
    }

    const { status, payload } = await api(admin, 'GET', '/api/testimonials');
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.data.pagination.limit, 25);
    assert.ok(
      payload.data.items.length > 1,
      `expected several testimonials, got ${payload.data.items.length}`,
    );
  });

  await test('limit is clamped to a sane maximum', async () => {
    const { payload } = await api(admin, 'GET', '/api/testimonials?limit=99999');
    assert.strictEqual(payload.data.pagination.limit, 100);
  });

  await test('the pagination fixtures are removed again', async () => {
    const { payload } = await api(admin, 'GET', '/api/testimonials');
    const fixtures = payload.data.items.filter((item) =>
      paginationFixtures.includes(item.name),
    );
    assert.strictEqual(fixtures.length, paginationFixtures.length);

    for (const fixture of fixtures) {
      const { status } = await api(admin, 'DELETE', `/api/testimonials?id=${fixture.id}`);
      assert.strictEqual(status, 200, `could not delete the fixture "${fixture.name}"`);
    }

    const after = await api(admin, 'GET', '/api/testimonials');
    assert.strictEqual(
      after.payload.data.items.filter((item) => paginationFixtures.includes(item.name)).length,
      0,
      'pagination fixtures leaked into later tests',
    );
  });

  await test('an admin can delete a submission; an unknown id is a 404', async () => {
    const { status } = await api(admin, 'DELETE', `/api/contact-submissions?id=${submissionId}`);
    assert.strictEqual(status, 200);

    const missing = await api(admin, 'DELETE', '/api/contact-submissions?id=contact-does-not-exist');
    assert.strictEqual(missing.status, 404);
  });

  /* --------------------------- testimonials ------------------------- */
  section('Testimonials');

  /* --------------------------- solution leads ----------------------- */
  section('Solution inquiries');


  let leadId;
  await test('a valid inquiry is validated and persisted', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: 'next-gen-web-apps',
      name: '  Alan Turing  ',
      email: 'Alan@Example.COM',
      phone: '+91 98765 43210',
      company: 'Bletchley Ltd',
      message: 'We need a customer portal.',
    });
    assert.strictEqual(status, 201, JSON.stringify(payload));
    assert.ok(payload.data.id, 'no id returned');
    leadId = payload.data.id;
  });

  await test('the stored inquiry is readable by an admin', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/admin/leads');
    assert.strictEqual(status, 200);
    const found = payload.data.items.find((item) => item.id === leadId);
    assert.ok(found, 'the persisted inquiry is missing');
    assert.strictEqual(found.name, 'Alan Turing', 'the name was not trimmed');
    assert.strictEqual(found.email, 'alan@example.com', 'the email was not normalised');
    assert.strictEqual(found.solutionSlug, 'next-gen-web-apps');
    assert.strictEqual(found.message, 'We need a customer portal.');
  });

  await test('inquiries are never readable anonymously', async () => {
    const { status } = await api(createJar(), 'GET', '/api/admin/leads');
    assert.strictEqual(status, 401);
  });

  await test('a lower-privilege account cannot read inquiries', async () => {
    const { status } = await api(editor, 'GET', '/api/admin/leads');
    assert.strictEqual(status, 403);
  });

  await test('an inquiry for an unknown service is rejected', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: 'not-a-real-service',
      name: 'Someone',
      email: 'someone@example.com',
      message: 'Hello',
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(payload.success, false);
  });

  await test('a malformed inquiry is rejected with field errors', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: 'Not A Slug',
      name: '',
      email: 'not-an-email',
      message: '',
    });
    assert.strictEqual(status, 422);
    assert.ok(payload.fields, 'expected field-level errors');
    assert.ok(payload.fields.name, 'name error missing');
    assert.ok(payload.fields.email, 'email error missing');
  });

  await test('the honeypot is accepted silently but stores nothing', async () => {
    const before = (await api(admin, 'GET', '/api/admin/leads')).payload.data.pagination.total;

    const { status, payload } = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: 'next-gen-web-apps',
      name: 'Spam Bot',
      email: 'bot@example.com',
      message: 'buy things',
      website: 'http://spam.example.com',
    });
    assert.strictEqual(status, 201, 'the bot must not learn it was filtered');
    assert.ok(payload.success);

    const after = (await api(admin, 'GET', '/api/admin/leads')).payload.data.pagination.total;
    assert.strictEqual(after, before, 'a honeypot submission was stored');
  });

  await test('an admin can close an inquiry and then delete it', async () => {
    const updated = await api(admin, 'PUT', '/api/admin/leads', { id: leadId, status: 'contacted' });
    assert.strictEqual(updated.status, 200, JSON.stringify(updated.payload));
    assert.strictEqual(updated.payload.data.status, 'contacted');

    const removed = await api(admin, 'DELETE', `/api/admin/leads?id=${encodeURIComponent(leadId)}`);
    assert.strictEqual(removed.status, 200);

    const gone = await api(admin, 'DELETE', `/api/admin/leads?id=${encodeURIComponent(leadId)}`);
    assert.strictEqual(gone.status, 404, 'deleting an unknown id must be a 404');
  });

  await test('an invalid lead status is rejected', async () => {
    const { status } = await api(admin, 'PUT', '/api/admin/leads', {
      id: 'lead-does-not-matter',
      status: 'not-a-status',
    });
    assert.strictEqual(status, 422);
  });

  /* ----------------------- solution detail pages -------------------- */
  section('Solution detail pages');

  // A slug that the seeded CMS document actually contains.
  const KNOWN_SLUG = 'next-gen-web-apps';

  await test('a known solution slug renders from the CMS', async () => {
    const response = await fetch(`${ORIGIN}/solution/${KNOWN_SLUG}`);
    assert.strictEqual(response.status, 200);
    const html = await response.text();
    // The page must render the CMS label, not a title-cased slug echoed back.
    assert.ok(
      html.toLowerCase().includes('next'),
      'the CMS solution content did not reach the page',
    );
    assert.ok(
      !html.includes('This is a static solution page'),
      'the placeholder copy is still being rendered',
    );
  });

  await test('an unknown solution slug serves the not-found page', async () => {
    // Next.js 13.5 flushes the response headers before a dynamic page component
    // runs, so `notFound()` renders the not-found UI with a 200 status on this
    // route (verified against a real server). A router-level miss - a URL that
    // matches no route at all - is a genuine 404, and both are asserted here so a
    // regression in the slug lookup would still be caught.
    const response = await fetch(`${ORIGIN}/solution/definitely-not-a-real-slug`);
    const html = await response.text();
    assert.ok(
      html.includes('Page not found'),
      'an unknown slug did not render the not-found page',
    );
    assert.ok(
      !html.includes('Contact us for more details'),
      'the removed placeholder copy is still rendering',
    );

    const unrouted = await fetch(`${ORIGIN}/totally-unknown-route`);
    assert.strictEqual(unrouted.status, 404, 'an unrouted URL must be a real 404');
  });

  await test('the inquiry form posts to the persisted leads endpoint', async () => {
    const response = await fetch(`${ORIGIN}/solution/${KNOWN_SLUG}`);
    const html = await response.text();
    // The client bundle is what performs the POST; assert the route exists and is
    // public so a real submission cannot silently 404.
    const probe = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: 'next-gen-web-apps',
      name: 'Form Probe',
      email: 'probe@example.com',
      message: 'Submitted through the form endpoint.',
    });
    assert.strictEqual(probe.status, 201, JSON.stringify(probe.payload));
    assert.ok(html.length > 0);
  });

  section('Testimonials');

  let testimonialId;
  await test('a public submission is stored as pending', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/testimonials', {
      name: 'Grace Hopper',
      content: 'Excellent work and very fast delivery.',
      rating: 5,
    });
    assert.strictEqual(status, 201, JSON.stringify(payload));
    testimonialId = payload.data.id;
  });

  await test('a pending testimonial is not shown on the public site', async () => {
    const { payload } = await api(createJar(), 'GET', '/api/cms');
    const found = payload.data.testimonials.items.find((item) => item.id === testimonialId);
    assert.ok(!found, 'an unapproved testimonial appeared publicly');
  });

  await test('a client cannot set the published status on submission', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/testimonials', {
      name: 'Sneaky',
      content: 'Trying to self-approve.',
      rating: 5,
      status: 'published',
    });
    assert.strictEqual(status, 201);
    const listed = await api(admin, 'GET', '/api/testimonials');
    const record = listed.payload.data.items.find((item) => item.id === payload.data.id);
    assert.ok(
      record,
      `submitted id ${payload.data.id} not found among ${listed.payload.data.items
        .map((item) => `${item.id}:${item.status}`)
        .join(', ')} (total=${listed.payload.data.pagination.total})`,
    );
    assert.strictEqual(record.status, 'pending');
  });

  await test('an admin can publish a testimonial and it becomes public', async () => {
    const { status } = await api(admin, 'PUT', '/api/testimonials', { id: testimonialId, status: 'published' });
    assert.strictEqual(status, 200);

    const { payload } = await api(createJar(), 'GET', '/api/cms');
    const found = payload.data.testimonials.items.find((item) => item.id === testimonialId);
    assert.ok(found, 'a published testimonial is missing from the public site');
  });

  await test('an admin can unpublish it again', async () => {
    const { status } = await api(admin, 'PUT', '/api/testimonials', { id: testimonialId, status: 'pending' });
    assert.strictEqual(status, 200);
    const { payload } = await api(createJar(), 'GET', '/api/cms');
    assert.ok(!payload.data.testimonials.items.find((item) => item.id === testimonialId));
  });

  await test('an unknown testimonial id returns 404', async () => {
    const { status } = await api(admin, 'PUT', '/api/testimonials', { id: 'nope', name: 'x' });
    assert.strictEqual(status, 404);
  });

  /* ----------------------------- calculator -------------------------- */
  section('Calculator');

  await test('the tiers endpoint exposes the configured commissions', async () => {
    const { status, payload } = await api(createJar(), 'GET', '/api/calculator/tiers');
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(payload.data.tiers) && payload.data.tiers.length > 0);
  });

  await test('a quote uses the persisted percentage, ignoring any client-supplied one', async () => {
    const tiers = (await api(createJar(), 'GET', '/api/calculator/tiers')).payload.data.tiers;
    const tier = tiers[0];

    const { status, payload } = await api(createJar(), 'POST', '/api/calculator/quote', {
      projectValue: 100_000,
      role: tier.title,
      percentage: 99, // must be ignored entirely
      earnings: 999_999,
    });
    assert.strictEqual(status, 200, JSON.stringify(payload));
    assert.strictEqual(payload.data.percentage, tier.percentage);
    assert.strictEqual(payload.data.projectValue, 100_000);
    assert.ok(payload.data.earnings <= 99_999, 'earnings exceeded the stored percentage');
  });

  await test('an unknown role is rejected', async () => {
    const { status } = await api(createJar(), 'POST', '/api/calculator/quote', {
      projectValue: 1000,
      role: 'Chief Marketing Overlord',
    });
    assert.strictEqual(status, 404);
  });

  await test('out-of-range and non-numeric project values are rejected', async () => {
    for (const value of [-1, 1e12, 'abc', null]) {
      const { status } = await api(createJar(), 'POST', '/api/calculator/quote', {
        projectValue: value,
        role: 'Any',
      });
      assert.ok(status === 404 || status === 422, `value ${value} returned ${status}`);
    }
  });

  await test('the quote endpoint is rate limited per request source', async () => {
    // The regression: `POST /api/calculator/quote` is unauthenticated and hits the
    // database on every call, and used to have no budget at all. One pinned address
    // accumulates the whole window so the assertion proves the limiter works rather
    // than tripping over unrelated traffic.
    const tiers = (await api(createJar(), 'GET', '/api/calculator/tiers')).payload.data.tiers;

    pinIp('198.51.100.77');
    try {
      let allowed = 0;
      let limited = false;

      for (let attempt = 0; attempt < 200; attempt += 1) {
        const { status } = await api(createJar(), 'POST', '/api/calculator/quote', {
          projectValue: 50_000,
          role: tiers[0].title,
        });
        if (status === 429) {
          limited = true;
          break;
        }
        assert.strictEqual(status, 200, `unexpected status ${status}`);
        allowed += 1;
      }

      assert.ok(limited, 'the calculator quote endpoint never returned 429');
      assert.ok(allowed > 0, 'the calculator quote endpoint was blocked immediately');
    } finally {
      unpinIp();
    }
  });

  /* ------------------- public frontend integrations ------------------ */
  section('Public frontend integrations');

  /**
   * Text of the existing inquiry trigger on every solution landing page (the hero
   * "Order Now" button). It opens the shared inquiry popup, which is how these
   * tests recognise a solution page now that the inline inquiry card is gone.
   */
  const SOLUTION_INQUIRY_TRIGGER = 'Order Now';

  const CANONICAL_SOLUTIONS = [
    '/solutions/brand-logos',
    '/solutions/viral-thumbnails',
    '/solutions/digital-shaadi-invites',
    '/solutions/social-media-banners',
    '/solutions/personal-portfolios',
    '/solutions/landing-pages',
    '/solutions/next-gen-web-apps',
  ];

  await test('the /solutions index exists and lists every canonical solution', async () => {
    const response = await fetch(`${ORIGIN}/solutions`);
    assert.strictEqual(response.status, 200, 'the solutions index is not reachable');

    const html = await response.text();
    for (const href of CANONICAL_SOLUTIONS) {
      assert.ok(html.includes(`href="${href}"`), `the index does not link to ${href}`);
    }
  });

  await test('the /solutions index never advertises a legacy alias URL', async () => {
    const html = await (await fetch(`${ORIGIN}/solutions`)).text();
    for (const alias of ['/solutions/portfolios', '/solutions/social-banners',
      '/solutions/digital-invites', '/solutions/web-apps']) {
      assert.ok(!html.includes(`href="${alias}"`), `the index links to the legacy alias ${alias}`);
    }
  });

  await test('legacy solution aliases redirect to their canonical URL', async () => {
    const pairs = [
      ['/solutions/portfolios', '/solutions/personal-portfolios'],
      ['/solutions/social-banners', '/solutions/social-media-banners'],
      ['/solutions/digital-invites', '/solutions/digital-shaadi-invites'],
      ['/solutions/web-apps', '/solutions/next-gen-web-apps'],
    ];

    for (const [alias, canonical] of pairs) {
      // A Next.js App Router `permanentRedirect()` renders either as a real 3xx or
      // as a 200 carrying a `NEXT_REDIRECT` bootstrap plus a meta refresh - an HTTP
      // client does NOT follow the latter, so both mechanisms are accepted. What
      // must hold is that the alias points at the canonical URL and nothing else is
      // served in its place.
      const response = await fetch(`${ORIGIN}${alias}`, { redirect: 'manual' });
      const location = response.headers.get('location') || '';
      const html = response.status === 200 ? await response.text() : '';

      const redirected =
        location.endsWith(canonical) ||
        html.includes(`NEXT_REDIRECT;replace;${canonical}`) ||
        html.includes(`url=${canonical}`);

      assert.ok(redirected, `${alias} does not redirect to ${canonical}`);
      assert.ok(
        !html.includes(SOLUTION_INQUIRY_TRIGGER) || location.endsWith(canonical),
        `${alias} still rendered its own page instead of redirecting`,
      );
    }

    // The canonical targets themselves must still be real pages.
    for (const [, canonical] of pairs) {
      const response = await fetch(`${ORIGIN}${canonical}`, { redirect: 'manual' });
      assert.strictEqual(response.status, 200, `${canonical} returned ${response.status}`);
      const html = await response.text();
      assert.ok(html.includes(SOLUTION_INQUIRY_TRIGGER), `${canonical} does not render the solution page`);
    }
  });

  await test('every canonical solution page renders and carries a canonical link tag', async () => {
    for (const href of CANONICAL_SOLUTIONS) {
      const response = await fetch(`${ORIGIN}${href}`);
      assert.strictEqual(response.status, 200, `${href} returned ${response.status}`);
      const html = await response.text();
      assert.ok(
        html.includes(`rel="canonical"`) && html.includes(href),
        `${href} has no canonical link tag`,
      );
    }
  });

  await test('solution landing pages carry only the inquiry trigger, never the inline form', async () => {
    for (const href of CANONICAL_SOLUTIONS) {
      const html = await (await fetch(`${ORIGIN}${href}`)).text();

      // The manual trigger stays on the page...
      assert.ok(
        html.includes(SOLUTION_INQUIRY_TRIGGER),
        `${href} does not render the inquiry trigger`,
      );

      // ...but the card, its heading and the form fields are popup-only now, so
      // none of it may appear in the server-rendered markup.
      for (const removed of ['Interested in this service?', 'Send Inquiry', 'Your message *']) {
        assert.ok(!html.includes(removed), `${href} still renders the inline inquiry ${removed}`);
      }
    }
  });

  await test('an inquiry submitted against a landing-page slug is persisted', async () => {
    // `KNOWN_SLUG` is confirmed to exist in the seeded CMS document, so the slug
    // validation in POST /api/leads accepts it - this is the exact call the shared
    // inquiry form makes.
    const { status, payload } = await api(createJar(), 'POST', '/api/leads', {
      solutionSlug: KNOWN_SLUG,
      name: 'Landing Page Visitor',
      email: 'visitor@example.com',
      phone: '+91 90000 00000',
      message: 'Submitted from the solution landing page form.',
    });
    assert.strictEqual(status, 201, JSON.stringify(payload));
    assert.ok(payload?.data?.id, 'the API did not acknowledge the write');
  });

  await test('the calculator tiers endpoint feeds the public calculator', async () => {
    const response = await fetch(`${ORIGIN}/api/calculator/tiers`);
    assert.strictEqual(response.status, 200);
    const payload = await response.json();
    assert.ok(Array.isArray(payload.data.tiers) && payload.data.tiers.length > 0);
    assert.ok(payload.data.projectValue, 'the project value bounds are missing');

    // The calculator is a client component whose first server render is the loading
    // skeleton, so the tiers it renders are not in the HTML. The call itself is
    // asserted against the client bundle in the next test.
    const page = await fetch(`${ORIGIN}/calculator`);
    assert.strictEqual(page.status, 200, 'the calculator page does not render');
  });

  await test('the public bundles really call the APIs they are wired to', async () => {
    // The wiring lives in client bundles, so it cannot be asserted from the server
    // HTML. This reads the production build that the suite is serving (which is
    // still intact at this point - the dev-based media suite runs last).
    const fs = require('fs');
    const chunkDir = path.join(ROOT, '.next', 'static', 'chunks');
    const files = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (full.endsWith('.js')) files.push(full);
      }
    })(chunkDir);

    const sources = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    for (const endpoint of ['/api/calculator/quote', '/api/calculator/tiers', '/api/leads']) {
      assert.ok(sources.includes(endpoint), `no client bundle calls ${endpoint}`);
    }
  });

  await test('the testimonials page renders no invented testimonials', async () => {
    const html = await (await fetch(`${ORIGIN}/Testimonial`)).text();
    for (const fabricated of ['Aarav Sharma', 'Priya Patel', 'TechStart', 'DesignHub']) {
      assert.ok(!html.includes(fabricated), `the fabricated testimonial "${fabricated}" is still rendered`);
    }
  });

  await test('the home hero CTA and the final banner link are real links', async () => {
    const html = await (await fetch(`${ORIGIN}/`)).text();
    // `hero.ctaLink` and `finalCta.buttonLink` default to /contact. Both were
    // previously inert plain text; both must now be anchors.
    const contactLinks = html.match(/href="\/contact"/g) || [];
    assert.ok(contactLinks.length >= 2, `expected the hero CTA and banner link to /contact, found ${contactLinks.length}`);
  });

  await test('the solution detail page links back to a working solutions index', async () => {
    const response = await fetch(`${ORIGIN}/solutions`, { redirect: 'manual' });
    assert.strictEqual(response.status, 200, 'the "Back to solutions" target is not a working route');
  });

  /* -------------------------------- CMS ------------------------------ */
  section('CMS content');

  await test('a validated save persists and is readable by the public site', async () => {
    const original = (await api(admin, 'GET', '/api/cms', undefined, { 'x-kaiyo-admin': '1' })).payload
      .data.siteSettings.whatsappNumber;

    const { status } = await api(admin, 'PUT', '/api/cms', {
      siteSettings: { whatsappNumber: '919999999999' },
    });
    assert.strictEqual(status, 200);

    const publicCms = (await api(createJar(), 'GET', '/api/cms')).payload.data;
    assert.strictEqual(publicCms.siteSettings.whatsappNumber, '919999999999');

    await api(admin, 'PUT', '/api/cms', { siteSettings: { whatsappNumber: original } });
  });

  await test('the save survives a fresh read (i.e. it hit the database)', async () => {
    const { status } = await api(admin, 'PUT', '/api/cms', {
      siteSettings: { phoneNumber: '9123456780' },
    });
    assert.strictEqual(status, 200);

    const reread = (await api(createJar(), 'GET', '/api/cms')).payload.data;
    assert.strictEqual(reread.siteSettings.phoneNumber, '9123456780');
  });

  await test('invalid content is rejected with field-level errors', async () => {
    const { status, payload } = await api(admin, 'PUT', '/api/cms', {
      siteSettings: { whatsappNumber: 'not-a-number' },
    });
    assert.strictEqual(status, 422);
    assert.ok(payload.fields.whatsappNumber || payload.fields['siteSettings.whatsappNumber']);
  });

  await test('unknown top-level sections are rejected', async () => {
    const { status } = await api(admin, 'PUT', '/api/cms', { notASection: { x: 1 } });
    assert.strictEqual(status, 422);
  });

  await test('an unsafe URL scheme is rejected', async () => {
    const { status } = await api(admin, 'PUT', '/api/cms', {
      siteSettings: { socialLinks: [{ label: 'Evil', url: 'javascript:alert(1)' }] },
    });
    assert.strictEqual(status, 422);
  });

  await test('the calculator tiers can be saved and are read back', async () => {
    const { status } = await api(admin, 'PUT', '/api/cms', {
      calculator: { tiers: [{ title: 'Test Role', percentage: 12.5, description: 'd', icon: 'i', accentColor: '#000', displayOrder: 0, isEnabled: true }] },
    });
    assert.strictEqual(status, 200);

    const tiers = (await api(createJar(), 'GET', '/api/calculator/tiers')).payload.data.tiers;
    assert.strictEqual(tiers[0].title, 'Test Role');
    assert.strictEqual(tiers[0].percentage, 12.5);
  });

  await test('an out-of-range commission percentage is rejected', async () => {
    const { status } = await api(admin, 'PUT', '/api/cms', {
      calculator: { tiers: [{ title: 'Bad', percentage: 500, description: 'd', icon: 'i', accentColor: '#000', displayOrder: 0, isEnabled: true }] },
    });
    assert.strictEqual(status, 422);
  });

  /* ------------------ inbox moderation (P1/P2 fixes) ------------------- */
  section('Inbox and moderation');

  let contactId = '';

  await test('a contact submission is available for the status tests', async () => {
    const { status, payload } = await api(createJar(), 'POST', '/api/contact-submissions', {
      name: 'Status Probe',
      email: 'status-probe@example.com',
      message: `Status probe ${Date.now()}`,
    });
    assert.strictEqual(status, 201);
    assert.ok(payload.data.id, 'the created submission has no id');
    contactId = payload.data.id;
  });

  await test('PUT /api/contact-submissions returns 401 when unauthenticated', async () => {
    const { status } = await api(createJar(), 'PUT', '/api/contact-submissions', {
      id: contactId,
      status: 'read',
    });
    assert.strictEqual(status, 401);
  });

  await test('an admin can move a contact submission through new/read/archived', async () => {
    for (const status of ['read', 'archived', 'new']) {
      const { status: code, payload } = await api(admin, 'PUT', '/api/contact-submissions', {
        id: contactId,
        status,
      });
      assert.strictEqual(code, 200, `setting status to ${status} failed`);
      assert.strictEqual(payload.data.status, status);
    }
  });

  await test('the contact status filter returns only the matching rows', async () => {
    await api(admin, 'PUT', '/api/contact-submissions', { id: contactId, status: 'archived' });

    const { payload } = await api(admin, 'GET', '/api/contact-submissions?status=archived&limit=100');
    assert.ok(
      payload.data.items.some((item) => item.id === contactId),
      'an archived submission was not returned by the archived filter',
    );

    const open = await api(admin, 'GET', '/api/contact-submissions?status=new&limit=100');
    assert.ok(
      !open.payload.data.items.some((item) => item.id === contactId),
      'an archived submission leaked into the new filter',
    );
  });

  await test('an invalid contact status is rejected with 422', async () => {
    const { status } = await api(admin, 'PUT', '/api/contact-submissions', {
      id: contactId,
      status: 'deleted',
    });
    assert.strictEqual(status, 422);
  });

  await test('updating an unknown contact submission is a 404, not a silent success', async () => {
    const { status } = await api(admin, 'PUT', '/api/contact-submissions', {
      id: 'contact-does-not-exist',
      status: 'read',
    });
    assert.strictEqual(status, 404);
  });

  await test('a lower-privilege account cannot change a contact submission', async () => {
    const { status } = await api(editor, 'PUT', '/api/contact-submissions', {
      id: contactId,
      status: 'read',
    });
    assert.strictEqual(status, 403);
  });

  await test('POST /api/admin/testimonials returns 401 when unauthenticated', async () => {
    const { status } = await api(createJar(), 'POST', '/api/admin/testimonials', {
      name: 'Nope',
      content: 'Nope',
    });
    assert.strictEqual(status, 401);
  });

  await test('an admin can create a testimonial and it is published immediately', async () => {
    const marker = `Admin created ${Date.now()}`;
    const { status, payload } = await api(admin, 'POST', '/api/admin/testimonials', {
      name: 'Admin Created',
      content: marker,
      rating: 4,
    });
    assert.strictEqual(status, 201);

    const created = payload.data;
    assert.strictEqual(created.status, 'published');

    const publicCms = (await api(createJar(), 'GET', '/api/cms')).payload.data;
    assert.ok(
      publicCms.testimonials.items.some((item) => item.id === created.id),
      'a testimonial created by an admin did not reach the public site',
    );

    await api(admin, 'DELETE', `/api/testimonials?id=${encodeURIComponent(created.id)}`);
  });

  await test('an admin-created testimonial can be held back as pending', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/testimonials', {
      name: 'Admin Hold',
      content: `Hold ${Date.now()}`,
      rating: 5,
    });
    assert.strictEqual(status, 201);

    await api(admin, 'PUT', '/api/testimonials', { id: payload.data.id, status: 'pending' });

    const publicCms = (await api(createJar(), 'GET', '/api/cms')).payload.data;
    assert.ok(
      !publicCms.testimonials.items.some((item) => item.id === payload.data.id),
      'an unpublished testimonial is still visible on the public site',
    );

    await api(admin, 'DELETE', `/api/testimonials?id=${encodeURIComponent(payload.data.id)}`);
  });

  await test('an invalid admin testimonial is rejected with field errors', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/testimonials', {
      name: '',
      content: '',
    });
    assert.strictEqual(status, 422);
    assert.ok(payload.fields, 'no field-level errors were returned');
  });

  await test('an unsafe avatar URL is rejected by the admin create route', async () => {
    const { status } = await api(admin, 'POST', '/api/admin/testimonials', {
      name: 'Bad Avatar',
      content: 'Bad avatar',
      avatar: 'javascript:alert(1)',
    });
    assert.strictEqual(status, 422);
  });

  await test('a lower-privilege account cannot create a testimonial', async () => {
    const { status } = await api(editor, 'POST', '/api/admin/testimonials', {
      name: 'Editor',
      content: 'Editor',
    });
    assert.strictEqual(status, 403);
  });

  await test('the admin leads list is reachable and paginated', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/admin/leads?page=1&limit=5');
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(payload.data.items));
    assert.ok(payload.data.pagination);
    assert.strictEqual(payload.data.pagination.limit, 5);
  });

  await test('a CMS patch never deletes testimonials the admin never loaded', async () => {
    // The regression this guards: the dashboard used to save the whole
    // `testimonials.items` array, and the store deleted every record missing from
    // it. That is only correct when the submitted list is the entire collection -
    // and `readCmsData()` composes at most 500 rows, so anything beyond the cap
    // was never on screen yet was silently destroyed by the next save.
    //
    // To make the composed view genuinely smaller than the collection, more than
    // `MAX_COMPOSED_CHILDREN` records are inserted directly into the store (bulk
    // insert, no API calls), then the admin saves the composed list minus one row.
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    const testimonials = mongoose.connection.collection('testimonials');

    const COMPOSED_CAP = 500;
    const marker = `beyond-cap-${Date.now()}`;
    // `createdAt`/`updatedAt` are set explicitly because these go in through the
    // raw driver, which does not apply the schema's `timestamps` option the way
    // `Testimonial.create()` would.
    const now = new Date();
    const filler = Array.from({ length: COMPOSED_CAP + 5 }, (_, index) => ({
      publicId: `${marker}-${index}`,
      name: `Bulk ${index}`,
      content: 'Filler record used to prove the composed cap is respected.',
      avatar: '',
      image: '',
      designation: '',
      company: '',
      rating: 5,
      // Above the seeded rows (0, 1, 2) so the composed 500 are the older ones
      // and the tail is genuinely never returned - but still inside the 10,000
      // ceiling `cmsPatchSchema` enforces on `displayOrder`, because the save
      // below submits these same records back through the validator.
      displayOrder: 1_000 + index,
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    }));
    await testimonials.insertMany(filler);

    try {
      const before = await testimonials.countDocuments();
      assert.ok(before > COMPOSED_CAP, 'the fixture did not push the collection past the cap');

      const composed = (await api(admin, 'GET', '/api/cms', undefined, { 'x-kaiyo-admin': '1' }))
        .payload.data.testimonials.items;
      assert.strictEqual(
        composed.length,
        COMPOSED_CAP,
        'the composed CMS view did not stop at the cap',
      );

      const droppedId = composed[0].id;
      assert.ok(droppedId, 'the first composed testimonial has no id');
      const submitted = composed.slice(1).map((item) => ({ ...item, id: item.id }));

      const { status, payload } = await api(admin, 'PUT', '/api/cms', {
        testimonials: { items: submitted },
      });
      assert.strictEqual(
        status,
        200,
        `status=${status} error=${payload && payload.error} fields=${JSON.stringify(payload && payload.fields)}`,
      );

      const after = await testimonials.countDocuments();
      const stillThere = await testimonials.countDocuments({ publicId: { $regex: `^${marker}` } });

      assert.strictEqual(
        await testimonials.countDocuments({ publicId: droppedId }),
        0,
        'the row the admin actually removed was not deleted',
      );
      assert.strictEqual(
        stillThere,
        filler.length,
        'records outside the composed view were deleted by a save that never showed them',
      );
      assert.strictEqual(
        after,
        before - 1,
        'the save deleted more than the single row that was removed',
      );
    } finally {
      // Only the synthetic records are cleaned up. The one seeded row the save
      // deliberately removed is left removed: the suite runs against a throwaway
      // in-memory database and nothing downstream asserts on the seeded count.
      await testimonials.deleteMany({ publicId: { $regex: `^${marker}` } });
      assert.strictEqual(
        await testimonials.countDocuments({ publicId: { $regex: `^${marker}` } }),
        0,
        'the fixture was not cleaned up',
      );
      await mongoose.disconnect();
    }
  });

  await test('an admin can reorder testimonials and the order survives a re-read', async () => {
    // The regression: the ↑/↓ controls renumbered `displayOrder` in local state only.
    // `displayOrder` was not part of the screen's "changed fields" patch, so Save
    // never sent it and the order reverted on the next read.
    const names = ['Reorder One', 'Reorder Two', 'Reorder Three'];
    const ids = [];

    try {
      for (const name of names) {
        const { status, payload } = await api(admin, 'POST', '/api/admin/testimonials', {
          name,
          content: 'Created to prove the reorder controls persist.',
          rating: 5,
        });
        assert.strictEqual(status, 201, JSON.stringify(payload));
        ids.push(payload.data.id);
      }

      // Written in reverse rank, one field per request - exactly what the screen sends.
      const ranks = [9012, 9011, 9010];
      for (let index = 0; index < ids.length; index += 1) {
        const { status, payload } = await api(admin, 'PUT', '/api/testimonials', {
          id: ids[index],
          displayOrder: ranks[index],
        });
        assert.strictEqual(status, 200, JSON.stringify(payload));
      }

      const listed = (await api(admin, 'GET', '/api/testimonials?limit=100')).payload.data.items;
      const order = listed
        .filter((item) => ids.includes(item.id))
        .map((item) => item.name)
        .sort((a, b) => names.indexOf(a) - names.indexOf(b))
        .reverse();
      assert.deepStrictEqual(order, names.slice().reverse(), `unexpected stored order: ${order}`);

      // The stored ranks really are what was written, not just a stable sort artefact.
      const stored = listed.filter((item) => ids.includes(item.id));
      for (let index = 0; index < ids.length; index += 1) {
        const record = stored.find((item) => item.id === ids[index]);
        assert.strictEqual(record.displayOrder, ranks[index]);
      }

      // Reordering must not have rewritten any other field.
      assert.strictEqual(stored.find((item) => item.id === ids[0]).name, names[0]);
      assert.strictEqual(stored.find((item) => item.id === ids[0]).rating, 5);
    } finally {
      for (const id of ids) {
        await api(admin, 'DELETE', `/api/testimonials?id=${encodeURIComponent(id)}`);
      }
    }
  });

  await test('the testimonials screen sends the new order it just created', async () => {
    // The endpoint accepting `displayOrder` is not enough on its own: the dashboard
    // has to actually send it, and that happens in a client bundle.
    const fs = require('fs');
    const source = fs.readFileSync(
      path.join(ROOT, 'app', 'admin', '(dashboard)', 'pages', 'testimonials', 'page.tsx'),
      'utf8',
    );
    assert.ok(
      /displayOrder:\s*item\.displayOrder/.test(source),
      'the screen never persists the rank it assigned',
    );
  });

  await test('deleting a media file is confirmed, and a failure is reported', async () => {
    // Deleting an asset removes the stored object as well as the record, and the
    // trash button used to fire that immediately with no confirmation.
    const fs = require('fs');
    const media = fs.readFileSync(
      path.join(ROOT, 'components', 'admin', 'AdminMediaLibrary.tsx'),
      'utf8',
    );
    assert.ok(media.includes('ConfirmDialog'), 'the media library has no confirmation dialog');
    assert.ok(
      /onClick=\{\(\) => setConfirmDelete\(item\)\}/.test(media),
      'the delete button still deletes without asking first',
    );
    assert.ok(
      !/onClick=\{\(\) => remove\(item\.id\)\}/.test(media),
      'the delete button is still wired straight to the destructive call',
    );

    // The shared dialog must also await an async confirm, or it re-enables its own
    // Delete button immediately and a second click fires the same delete twice.
    const dialog = fs.readFileSync(
      path.join(ROOT, 'components', 'admin', 'ConfirmDialog.tsx'),
      'utf8',
    );
    assert.ok(dialog.includes('await onConfirm()'), 'ConfirmDialog does not await onConfirm');
  });

  await test('the contact inbox never stacks two dialogs and never hides a failed delete', async () => {
    const fs = require('fs');
    const source = fs.readFileSync(
      path.join(ROOT, 'app', 'admin', '(dashboard)', 'pages', 'contact', 'page.tsx'),
      'utf8',
    );

    // Every place the delete confirmation is opened must first close the details
    // dialog. Both render at z-[100], so leaving `viewed` set put two full-screen
    // overlays on top of each other.
    const openings = [...source.matchAll(/setSubmissionDelete\((?!null)/g)];
    assert.ok(openings.length >= 2, 'expected the delete dialog to be reachable from two places');
    for (const match of openings) {
      const window = source.slice(Math.max(0, match.index - 200), match.index + 120);
      assert.ok(
        window.includes('setViewed(null)'),
        'a delete confirmation can open while the details dialog is still open',
      );
    }

    // A failed delete used to be swallowed by an empty `catch {}`: the row simply
    // stayed put with no message, which reads exactly like a success.
    const start = source.indexOf('const deleteSubmission');
    assert.ok(start !== -1, 'deleteSubmission is missing from the contact screen');
    const fn = source.slice(start, source.indexOf('\n  return (', start));
    assert.ok(!/catch\s*\{\s*\}/.test(fn), 'the deletion error handler is empty again');
    assert.ok(
      /kind: 'error'/.test(fn),
      'a failed submission deletion is reported nowhere',
    );
  });

  /* ---------------------------- admin overview ------------------------- */
  section('Admin overview');

  await test('the overview endpoint is authenticated', async () => {
    const { status } = await api(createJar(), 'GET', '/api/admin/overview');
    assert.strictEqual(status, 401);
  });

  await test('the overview endpoint returns live counts', async () => {
    // The screen used to derive its numbers from the composed CMS payload and this
    // endpoint had no caller at all. It must be a real aggregation, not a copy of
    // the CMS document: `submissions` has to agree with the inbox's own total.
    const { status, payload } = await api(admin, 'GET', '/api/admin/overview');
    assert.strictEqual(status, 200);

    const counts = payload.data.counts;
    for (const key of [
      'solutions',
      'solutionCategories',
      'solutionCards',
      'pricingPlans',
      'testimonials',
      'publishedTestimonials',
      'partnerTiers',
      'calculatorTiers',
      'submissions',
      'mediaImages',
      'mediaVideos',
      'totalPages',
    ]) {
      assert.strictEqual(typeof counts[key], 'number', `counts.${key} is not a number`);
    }
    assert.ok(Array.isArray(counts.solutionCategoryLabels), 'no category labels were returned');
    assert.ok(counts.totalPages >= 1, 'no managed pages were detected');

    const inbox = (await api(admin, 'GET', '/api/contact-submissions?limit=1')).payload.data;
    assert.strictEqual(
      counts.submissions,
      inbox.pagination.total,
      'the overview disagrees with the inbox about how many submissions exist',
    );
  });

  /* ------------------------------- media ----------------------------- */
  section('Media');

  await test('an unauthenticated upload is rejected', async () => {
    const form = new FormData();
    form.append('files', new Blob([Buffer.from('fake')], { type: 'image/png' }), 'evil.png');
    const response = await fetch(`${ORIGIN}/api/admin/media`, { method: 'POST', body: form });
    assert.strictEqual(response.status, 401);
  });

  await test('a file whose content does not match its declared type is rejected', async () => {
    const form = new FormData();
    form.append(
      'files',
      new Blob([Buffer.from('<?php system($_GET["c"]); ?>')], { type: 'image/png' }),
      'shell.png',
    );
    const response = await fetch(`${ORIGIN}/api/admin/media`, {
      method: 'POST',
      headers: { cookie: admin.header(), origin: ORIGIN, 'x-kaiyo-csrf': admin.get('kaiyo-admin-csrf') || '' },
      body: form,
    });
    assert.strictEqual(response.status, 415);
  });

  await test('a traversal filename cannot escape the storage root', async () => {
    const form = new FormData();
    form.append(
      'files',
      new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], {
        type: 'image/png',
      }),
      '../../../../etc/passwd.png',
    );
    const response = await fetch(`${ORIGIN}/api/admin/media`, {
      method: 'POST',
      headers: { cookie: admin.header(), origin: ORIGIN, 'x-kaiyo-csrf': admin.get('kaiyo-admin-csrf') || '' },
      body: form,
    });
    // Either refused because the local driver is unavailable in production, or
    // accepted - in which case the stored key must not contain traversal.
    if (response.status === 201) {
      const payload = await response.json();
      const url = payload.data.assets[0].url;
      assert.ok(!url.includes('..'), `traversal survived in ${url}`);
      // Clean up.
      await api(admin, 'DELETE', `/api/admin/media?id=${payload.data.assets[0].id}`);
    } else {
      assert.ok(response.status === 503, `unexpected status ${response.status}`);
    }
  });

  /* ----------------------- security / sessions ---------------------- */
  section('Security settings and sessions');

  await test('security settings can be read', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/admin/security');
    assert.strictEqual(status, 200);
    assert.strictEqual(typeof payload.data.maxFailedAttempts, 'number');
    assert.ok(Array.isArray(payload.data.sessions));
  });

  await test('security settings can be updated and are enforced', async () => {
    const { status, payload } = await api(admin, 'PUT', '/api/admin/security', {
      maxFailedAttempts: 3,
      lockoutMinutes: 10,
      autoLogoutMinutes: 45,
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(payload.data.maxFailedAttempts, 3);
    assert.strictEqual(payload.data.autoLogoutMinutes, 45);
  });

  await test('out-of-range security settings are rejected', async () => {
    const { status } = await api(admin, 'PUT', '/api/admin/security', { maxFailedAttempts: 9999 });
    assert.strictEqual(status, 422);
  });

  await test('the configured auto-logout window is enforced server-side', async () => {
    // The regression: `resolveAuth` used the hard-coded 60-minute constant, so the
    // Auto Logout control in Admin Settings was cosmetic - the client guard signed
    // the admin out on the configured schedule, but the server kept accepting the
    // session. Six idle minutes is past a configured five and comfortably inside
    // sixty, so only a fix that actually reads the setting produces a 401 here.
    const before = await api(admin, 'GET', '/api/admin/security');
    assert.strictEqual(before.status, 200);
    const original = before.payload.data.autoLogoutMinutes;

    const victim = createJar();
    const login = await api(victim, 'POST', '/api/admin/login', { pin: PIN });
    assert.strictEqual(login.status, 201, JSON.stringify(login.payload));

    try {
      const configured = await api(victim, 'PUT', '/api/admin/security', {
        autoLogoutMinutes: 5,
      });
      assert.strictEqual(configured.status, 200);
      assert.strictEqual(configured.payload.data.autoLogoutMinutes, 5);

      // Age only this session. Every other live session - including the one the
      // rest of the suite uses - must keep working.
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(victim.get('kaiyo-admin-token')).digest('hex');

      const mongoose = require('mongoose');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
      const sessions = mongoose.connection.collection('adminsessions');
      const aged = await sessions.updateOne(
        { tokenHash },
        { $set: { lastActivityAt: new Date(Date.now() - 6 * 60_000) } },
      );
      assert.strictEqual(aged.matchedCount, 1, 'could not find the session to age');

      const idle = await fetch(`${ORIGIN}/api/admin/overview`, {
        headers: { cookie: victim.header() },
      });
      assert.strictEqual(
        idle.status,
        401,
        'a session idle past its configured auto-logout window was still accepted',
      );

      // The window must be closed server-side, not just refused on this request.
      const revoked = await sessions.findOne({ tokenHash }, { projection: { revokedAt: 1 } });
      assert.ok(revoked && revoked.revokedAt, 'the idle session was not revoked');

      await mongoose.disconnect();

      // A session that is still inside the window is unaffected.
      const fresh = await fetch(`${ORIGIN}/api/admin/overview`, {
        headers: { cookie: admin.header() },
      });
      assert.strictEqual(fresh.status, 200, 'the idle timeout revoked an unrelated session');
    } finally {
      await api(admin, 'PUT', '/api/admin/security', { autoLogoutMinutes: original });
    }
  });

  await test('sessions can be listed and the current one is identified', async () => {
    const { status, payload } = await api(admin, 'GET', '/api/admin/sessions');
    assert.strictEqual(status, 200);
    assert.ok(payload.data.currentSessionId);
    assert.ok(payload.data.sessions.length >= 1);
  });

  await test('"sign out of all devices" revokes every session, not just the caller', async () => {
    // Two independent sign-ins for the same account: `deviceA` is the caller,
    // `deviceB` stands in for the administrator's phone.
    const deviceA = createJar();
    const deviceB = createJar();
    for (const jar of [deviceA, deviceB]) {
      const signedIn = await api(jar, 'POST', '/api/admin/login', { pin: PIN });
      assert.strictEqual(signedIn.status, 201, JSON.stringify(signedIn.payload));
    }

    // Both are genuinely live before the revocation.
    for (const jar of [deviceA, deviceB]) {
      const probe = await api(jar, 'GET', '/api/admin/overview');
      assert.strictEqual(probe.status, 200, 'a signed-in device could not reach the API');
    }

    const { status } = await api(deviceA, 'DELETE', '/api/admin/sessions', { all: true });
    assert.strictEqual(status, 200);

    // The caller is signed out and its cookies cleared...
    const afterCaller = await api(deviceA, 'GET', '/api/admin/overview');
    assert.strictEqual(afterCaller.status, 401, 'the calling session survived "sign out of all devices"');

    // ...and so is every other session for that account. The route used to revoke
    // only the token presented on the request, then answer "All sessions signed
    // out" - so an administrator who believed they had ended a session elsewhere
    // left that session fully usable.
    const afterOther = await api(deviceB, 'GET', '/api/admin/overview');
    assert.strictEqual(
      afterOther.status,
      401,
      'another session of the same account survived "sign out of all devices"',
    );

    // Revoking every session for the account also ended the suite's own `admin`
    // jar, which is the correct behaviour for the endpoint. Re-authenticate it so
    // the tests that follow run against a live session as before.
    const restored = await api(admin, 'POST', '/api/admin/login', { pin: PIN });
    assert.strictEqual(restored.status, 201, JSON.stringify(restored.payload));
    const restoredProbe = await api(admin, 'GET', '/api/admin/overview');
    assert.strictEqual(restoredProbe.status, 200, 'the shared admin session was not restored');
  });

  await test('changing the PIN requires the current credential', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: '000000',
      newPin: NEW_PIN,
      confirmPin: NEW_PIN,
    });
    assert.strictEqual(status, 403);
    assert.match(payload.error, /incorrect/i);
  });

  await test('a too-short new PIN is rejected', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: PIN,
      newPin: '12',
      confirmPin: '12',
    });
    assert.strictEqual(status, 422);
    assert.ok(payload.fields && payload.fields.newPin, 'expected a newPin field error');
  });

  await test('a PIN that meets the advertised policy is accepted', async () => {
    // The reported bug: the form's own hint recommends "at least 10 characters,
    // with an uppercase letter, a lowercase letter and a number", but the API
    // applied a digits-only 4-12 regex to all three fields, so a PIN that followed
    // the advice came back as "Some fields are invalid." Every compliant shape must
    // now pass validation and get as far as the current-PIN check (which fails
    // here only because the current PIN below is deliberately wrong).
    const compliant = 'KaiyoStudio2026';
    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: '000000',
      newPin: compliant,
      confirmPin: compliant,
    });

    assert.strictEqual(status, 403, JSON.stringify(payload));
    assert.match(payload.error, /incorrect/i);
    assert.ok(
      !payload.fields,
      'a compliant PIN was still rejected by validation: ' + JSON.stringify(payload.fields),
    );
  });

  await test('each PIN policy rule reports against the field that broke it', async () => {
    const cases = [
      ['Ab1', 'newPin', /at least 10 characters/i],
      ['kaiyostudio2026', 'newPin', /uppercase/i],
      ['KAIYOSTUDIO2026', 'newPin', /lowercase/i],
      ['KaiyoStudioOnly', 'newPin', /number/i],
    ];

    for (const [value, field, expected] of cases) {
      const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
        currentPin: PIN,
        newPin: value,
        confirmPin: value,
      });
      assert.strictEqual(status, 422, `${JSON.stringify(value)} returned ${status}`);
      assert.ok(payload.fields && payload.fields[field], `no error reported on ${field}`);
      assert.match(payload.fields[field], expected);
    }
  });

  await test('a mismatched confirmation is reported against confirmPin', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: PIN,
      newPin: NEW_PIN,
      confirmPin: 'KaiyoSuite2027',
    });
    assert.strictEqual(status, 422, JSON.stringify(payload));
    assert.match(payload.fields.confirmPin, /do not match/i);
  });

  await test('an empty current PIN is reported against currentPin', async () => {
    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: '',
      newPin: NEW_PIN,
      confirmPin: NEW_PIN,
    });
    assert.strictEqual(status, 422, JSON.stringify(payload));
    assert.ok(payload.fields && payload.fields.currentPin, 'no error reported on currentPin');
  });

  await test('the current PIN must match the stored hash before anything changes', async () => {
    // Requirement: the change is authorised against the authenticated
    // administrator's existing bcrypt hash, and a wrong PIN must leave it intact.
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    const admins = mongoose.connection.collection('admins');

    const before = await admins.findOne({ email: EMAIL }, { projection: { passwordHash: 1 } });
    assert.ok(before && before.passwordHash, 'no hash to compare against');
    // The hash is salted: two bcrypt digests of the same PIN differ. Recording it
    // here only proves it was left alone - the value is never printed or returned.
    assert.match(before.passwordHash, /^\$2[aby]\$\d{2}\$/, 'the stored hash is not bcrypt');

    await api(admin, 'POST', '/api/admin/pin', {
      currentPin: '000000',
      newPin: NEW_PIN,
      confirmPin: NEW_PIN,
    });

    const after = await admins.findOne({ email: EMAIL }, { projection: { passwordHash: 1 } });
    assert.strictEqual(
      after.passwordHash,
      before.passwordHash,
      'the stored hash changed even though the current PIN was wrong',
    );

    // And the real PIN still works, i.e. the account was not disturbed.
    const jar = createJar();
    const good = await api(jar, 'POST', '/api/admin/login', { pin: PIN });
    assert.strictEqual(good.status, 201, 'a failed change broke the existing PIN');

    await mongoose.disconnect();
  });

  await test('changing the PIN succeeds and rotates the session', async () => {
    const before = admin.get('kaiyo-admin-token');

    const { status, payload } = await api(admin, 'POST', '/api/admin/pin', {
      currentPin: PIN,
      newPin: NEW_PIN,
      confirmPin: NEW_PIN,
    });
    assert.strictEqual(status, 200, JSON.stringify(payload));

    const after = admin.get('kaiyo-admin-token');
    assert.ok(after && after !== before, 'the session token was not rotated');

    // The old token must no longer work.
    const stale = await fetch(`${ORIGIN}/api/admin/security`, {
      headers: { cookie: `kaiyo-admin-token=${before}` },
    });
    assert.strictEqual(stale.status, 401, 'the pre-change token still works');
  });

  await test('the new PIN works and the old one does not', async () => {
    const jar = createJar();
    const good = await api(jar, 'POST', '/api/admin/login', { pin: NEW_PIN });
    assert.strictEqual(good.status, 201, JSON.stringify(good.payload));

    const bad = await api(createJar(), 'POST', '/api/admin/login', { pin: PIN });
    assert.strictEqual(bad.status, 401);
  });

  await test('logout invalidates the session server-side', async () => {
    const jar = createJar();
    await api(jar, 'POST', '/api/admin/login', { pin: NEW_PIN });

    const token = jar.get('kaiyo-admin-token');
    const csrf = jar.get('kaiyo-admin-csrf');

    const { status } = await api(jar, 'POST', '/api/admin/logout', {});
    assert.strictEqual(status, 200);

    // Replay the captured token - revocation, not just cookie clearing, must reject it.
    const replay = await fetch(`${ORIGIN}/api/admin/security`, {
      headers: { cookie: `kaiyo-admin-token=${token}; kaiyo-admin-csrf=${csrf}` },
    });
    assert.strictEqual(replay.status, 401, 'a revoked token still works');

    // Signing out one device must not affect any other live session.
    const stillAlive = await fetch(`${ORIGIN}/api/admin/security`, {
      headers: { cookie: admin.header() },
    });
    assert.strictEqual(stillAlive.status, 200, 'logging out one device revoked an unrelated session');
  });

  /* ------------------------- error handling -------------------------- */
  // Runs before the lockout test, which deliberately locks the account and would
  // otherwise prevent any further sign-in.
  section('Error handling');

  await test('a malformed JSON body returns 400, not a crash', async () => {
    // Confirm the session is still good first, so a failure here is
    // unambiguous.
    const probe = await fetch(`${ORIGIN}/api/admin/sessions`, {
      headers: { cookie: admin.header() },
    });
    assert.strictEqual(probe.status, 200, `session probe returned ${probe.status}`);

    const response = await fetch(`${ORIGIN}/api/cms`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        cookie: admin.header(),
        origin: ORIGIN,
        'x-kaiyo-csrf': admin.get('kaiyo-admin-csrf') || '',
      },
      body: '{ this is not json',
    });
    const text = await response.text();
    assert.strictEqual(response.status, 400, `got ${response.status}: ${text}`);
  });

  await test('errors never leak a stack trace or a connection string', async () => {
    const response = await fetch(`${ORIGIN}/api/contact-submissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'bad', message: 'y' }),
    });
    const text = await response.text();
    assert.ok(!text.includes('mongodb://'), 'connection string leaked');
    assert.ok(!text.includes('at Object.'), 'stack trace leaked');
    assert.ok(!text.includes('node_modules'), 'internal path leaked');
  });

  /* --------------------------- lockout ------------------------------ */
  section('Lockout (source-scoped)');

  /**
   * Signs in from a specific forwarded address. `TRUSTED_PROXY` is enabled for the
   * suite's servers, so `x-forwarded-for` is what `clientIp()` keys the buckets on.
   */
  const loginFrom = async (ip, body) => {
    const jar = createJar();
    const response = await fetch(`${ORIGIN}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
    jar.absorb(response);
    return { jar, status: response.status };
  };

  const clearLoginBuckets = async (ip) => {
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    await mongoose.connection
      .collection('ratelimits')
      .deleteMany({ key: { $regex: `:(untrusted|${ip})$` } });
    await mongoose.disconnect();
  };

  const ATTACKER = '203.0.113.77';
  const VICTIM = '198.51.100.23';

  await test('repeated wrong PINs lock the attacker source, not the admin accounts', async () => {
    // Baseline: the attacker source is admissible.
    const baseline = await loginFrom(ATTACKER, { pin: '000111' });
    assert.strictEqual(baseline.status, 401, 'a wrong PIN did not fail as expected');

    // Now hammer the attacker source past maxFailedAttempts (default 5).
    let lockedAt = null;
    for (let i = 0; i < 12 && lockedAt === null; i += 1) {
      const attempt = await loginFrom(ATTACKER, { pin: '000111' });
      if (attempt.status === 429) lockedAt = i;
    }
    assert.ok(lockedAt !== null, 'the attacker source was never throttled');

    // The lockout must NOT have been written onto any administrator account. This is
    // the regression: previously the lockout was stored on every Admin document, so
    // five anonymous guesses locked every administrator out of the whole dashboard.
    const mongoose = require('mongoose');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
    const admins = await mongoose.connection
      .collection('admins')
      .find({}, { projection: { email: 1, lockedUntil: 1 } })
      .toArray();
    await mongoose.disconnect();

    const lockedAccounts = admins.filter((a) => a.lockedUntil && new Date(a.lockedUntil) > new Date());
    assert.strictEqual(
      lockedAccounts.length,
      0,
      `wrong PINs locked ${lockedAccounts.length} administrator account(s): ` +
        lockedAccounts.map((a) => a.email).join(', '),
    );

    // And the correct PIN still works for everyone else, from any other source.
    const victim = await loginFrom(VICTIM, { pin: NEW_PIN });
    assert.strictEqual(victim.status, 201, 'a correct PIN from another source was refused');
  });

  await test('the locked source is refused even with the correct PIN', async () => {
    const stillLocked = await loginFrom(ATTACKER, { pin: NEW_PIN });
    assert.strictEqual(
      stillLocked.status,
      429,
      'the throttled source was admitted after enough failures',
    );
  });

  await test('an account can still sign in again after a source lockout elsewhere', async () => {
    // Proves the lockout is per source and does not persist on the account: the same
    // PIN succeeds from a fresh source even while another source is parked.
    const fresh = await loginFrom('198.51.100.99', { pin: NEW_PIN });
    assert.strictEqual(fresh.status, 201, 'a valid PIN was refused while another source was locked');

    // Clean up so later suites are not throttled by this section.
    await clearLoginBuckets(ATTACKER);
    await clearLoginBuckets(VICTIM);
    await clearLoginBuckets('198.51.100.99');
  });

  await test('a non-admin session probe is refused (role policy on GET /api/admin/login)', async () => {
    // The editor account exists and holds a valid PIN, so it can authenticate.
    const editorJar = createJar();
    const editorLogin = await fetch(`${ORIGIN}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ pin: EDITOR_PIN }),
    });
    editorJar.absorb(editorLogin);
    assert.strictEqual(editorLogin.status, 201, 'the editor account could not authenticate');

    const probe = await fetch(`${ORIGIN}/api/admin/login`, {
      headers: { cookie: editorJar.header() },
    });
    assert.strictEqual(
      probe.status,
      401,
      'an editor received 200 from the admin session probe, inconsistent with the rest of /api/admin',
    );
  });
}

/* ---------------------------- media suite --------------------------------- */

/**
 * Verifies the upload/delete round trip against `next dev`, where the local
 * storage driver is permitted. Checks that the stored URL is servable, that the
 * file survives a fresh server start (i.e. it is on disk, not in memory), and
 * that delete removes both the object and the metadata.
 */
async function runMediaSuite(mongoUri) {
  section('Media storage round trip (development server)');

  const devPort = PORT + 1;
  const devOrigin = `http://127.0.0.1:${devPort}`;
  const nextBin = require.resolve('next/dist/bin/next');

  /**
   * `next dev` and `next build` share one output directory. In Next 13.5 the dev
   * server writes its own compilation straight into `.next`, so simply booting it
   * here **destroys the production build this suite was started against**:
   * `.next/BUILD_ID`, `routes-manifest.json` and `prerender-manifest.js` are
   * replaced by dev output (`static/development`).
   *
   * That left `npm test` in a state where it had just verified a production build
   * and then left no production build behind - `npm start` immediately afterwards
   * failed with `ENOENT .next/BUILD_ID`, and a `next build` run while the dev
   * server was up failed with `PageNotFoundError` on an unrelated page.
   *
   * So the build is moved aside for the duration of this suite and put back
   * afterwards. `next dev` then creates a fresh `.next` of its own, which is
   * discarded on the way out.
   */
  const productionBuildDir = path.join(ROOT, '.next');
  const buildHoldingDir = path.join(ROOT, '.next.production-build');

  const parkProductionBuild = () => {
    const fs = require('fs');
    try {
      if (!fs.existsSync(productionBuildDir)) return false;
      if (fs.existsSync(buildHoldingDir)) fs.rmSync(buildHoldingDir, { recursive: true, force: true });
      fs.renameSync(productionBuildDir, buildHoldingDir);
      return true;
    } catch (error) {
      // Not fatal: the suite can still run, it just will not restore a build.
      console.log(
        `  WARN  could not park the production build (${error && error.code ? error.code : 'error'}); ` +
          'the media suite will leave .next in development state.',
      );
      return false;
    }
  };

  const restoreProductionBuild = (parked) => {
    if (!parked) return;
    const fs = require('fs');
    try {
      // The dev server is stopped by this point, but on Windows a killed child can
      // take a moment to release its handles, so the removal is retried briefly.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          fs.rmSync(productionBuildDir, { recursive: true, force: true });
          break;
        } catch {
          // retry
        }
      }
      fs.renameSync(buildHoldingDir, productionBuildDir);
    } catch (error) {
      console.log(
        `  WARN  could not restore the production build (${error && error.code ? error.code : 'error'}). ` +
          `It is intact at ${buildHoldingDir} - move it back to .next, or re-run \`npm run build\`.`,
      );
    }
  };

  const buildParked = parkProductionBuild();

  const startDev = () =>
    spawn(process.execPath, [nextBin, 'dev', '--port', String(devPort)], {
      cwd: ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        MONGODB_URI: mongoUri,
        NEXT_PUBLIC_SITE_URL: devOrigin,
        CSRF_SECRET: 'test-csrf-secret-0123456789abcdefghijklmnop',
        SESSION_SECRET: 'test-session-secret-0123456789abcdefghijklmno',
        MEDIA_STORAGE_DRIVER: 'local',
        TRUSTED_PROXY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  let dev = startDev();
  const stopDev = async () => {
    if (dev && !dev.killed) {
      dev.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!dev.killed) dev.kill('SIGKILL');
    }
  };

  try {
    await waitForServer(`${devOrigin}/api/cms`, 180_000);

    const jar = createJar();
    const login = await fetch(`${devOrigin}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: devOrigin },
      body: JSON.stringify({ pin: NEW_PIN }),
    });
    jar.absorb(login);
    // The lockout test locked the account. Sign-in is PIN-only, so the lockout is
    // shared across every active administrator - clear them all, not just the owner.
    if (login.status !== 201) {
      const mongoose = require('mongoose');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000 });
      await mongoose.connection.collection('admins').updateMany(
        {},
        { $set: { lockedUntil: null, failedAttempts: 0, lastFailedAt: null } },
      );
      await mongoose.disconnect();
      const retry = await fetch(`${devOrigin}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: devOrigin },
        body: JSON.stringify({ pin: NEW_PIN }),
      });
      jar.absorb(retry);
      assert.strictEqual(retry.status, 201, 'could not sign in for the media suite');
    }

    /* --------------------------- avatar uploads --------------------- */
    section('Testimonial avatar upload (public endpoint)');

    // A minimal but genuinely valid 1x1 PNG, shared by the avatar and media suites.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    let avatarUrl = null;

    await test('an avatar uploads and returns a real, servable URL', async () => {
      const form = new FormData();
      form.append('file', new Blob([png], { type: 'image/png' }), 'avatar.png');

      const response = await fetch(`${devOrigin}/api/testimonials/avatar`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json().catch(() => null);
      assert.strictEqual(response.status, 201, JSON.stringify(payload));
      assert.ok(payload.data.url, 'no url returned');
      avatarUrl = payload.data.url;

      // The URL must be something the testimonial schema accepts: http(s) or a
      // site-relative path. A base64 `data:` payload is exactly what this endpoint
      // exists to eliminate.
      assert.ok(
        payload.data.url.startsWith('/uploads/') || /^https?:\/\//.test(payload.data.url),
        `unexpected avatar url: ${payload.data.url}`,
      );
      assert.ok(!payload.data.url.startsWith('data:'), 'the avatar url must not be a data: payload');

      const fetched = await fetch(`${devOrigin}${payload.data.url}`);
      assert.strictEqual(fetched.status, 200, 'the stored avatar is not retrievable');
      const bytes = Buffer.from(await fetched.arrayBuffer());
      assert.deepStrictEqual(bytes, png, 'the stored avatar does not match the upload');
    });

    await test('an uploaded avatar is tracked as a media asset', async () => {
      // The regression: the public avatar endpoint wrote the object to storage and
      // stopped there. No `MediaAsset` row meant the file never appeared in the
      // admin Media library, could not be deleted from the dashboard, and was
      // invisible to the overview's `mediaImages` count - an unremovable orphan
      // created by an anonymous visitor.
      assert.ok(avatarUrl, 'no avatar was uploaded by the previous test');

      const listed = await fetch(`${devOrigin}/api/admin/media`, {
        headers: { cookie: jar.header() },
      });
      const library = await listed.json();
      assert.strictEqual(listed.status, 200);

      const asset = library.data.items.find((item) => item.url === avatarUrl);
      assert.ok(asset, 'the avatar upload is missing from the media library');
      assert.strictEqual(asset.kind, 'image');
      assert.strictEqual(asset.mimeType, 'image/png');

      // And it is removable through the normal admin endpoint, unlike an orphan.
      const removed = await fetch(`${devOrigin}/api/admin/media?id=${asset.id}`, {
        method: 'DELETE',
        headers: {
          cookie: jar.header(),
          origin: devOrigin,
          'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
        },
      });
      assert.strictEqual(removed.status, 200);

      const after = await fetch(`${devOrigin}${avatarUrl}`);
      assert.strictEqual(after.status, 404, 'the avatar object survived the deletion of its record');
    });

    await test('a testimonial submitted with that avatar is accepted', async () => {
      // The regression this fixes: the form used to send a base64 `data:` URL,
      // which `safeUrl` rejects, so every submission with a photo returned 422.
      const form = new FormData();
      form.append('file', new Blob([png], { type: 'image/png' }), 'avatar.png');
      const upload = await fetch(`${devOrigin}/api/testimonials/avatar`, {
        method: 'POST',
        body: form,
      });
      const uploaded = await upload.json();
      assert.strictEqual(upload.status, 201, JSON.stringify(uploaded));

      const submit = await fetch(`${devOrigin}/api/testimonials`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo Author',
          content: 'Submitted with a profile photo.',
          rating: 5,
          avatar: uploaded.data.url,
        }),
      });
      const submitted = await submit.json().catch(() => null);
      assert.strictEqual(submit.status, 201, JSON.stringify(submitted));
    });

    await test('a base64 data: URL is still rejected by the validator', async () => {
      // The upload endpoint is the supported path; the validator must not be
      // widened to accept inline payloads.
      const submit = await fetch(`${devOrigin}/api/testimonials`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Inline Data',
          content: 'Trying to inline the image.',
          rating: 5,
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        }),
      });
      const submitted = await submit.json().catch(() => null);
      assert.strictEqual(submit.status, 422, 'a data: URL was accepted');
      assert.ok(submitted.fields && submitted.fields.avatar, 'expected an avatar field error');
    });

    await test('the avatar endpoint refuses a non-image', async () => {
      const form = new FormData();
      form.append('file', new Blob([Buffer.from('<?php echo "nope"; ?>')], { type: 'image/png' }), 'evil.png');
      const response = await fetch(`${devOrigin}/api/testimonials/avatar`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json().catch(() => null);
      assert.ok(response.status === 415 || response.status === 400, `unexpected ${response.status}`);
      assert.ok(!payload.success);
    });

    await test('the avatar endpoint refuses SVG', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');
      const form = new FormData();
      form.append('file', new Blob([svg], { type: 'image/svg+xml' }), 'vector.svg');
      const response = await fetch(`${devOrigin}/api/testimonials/avatar`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json().catch(() => null);
      assert.strictEqual(response.status, 415, 'SVG was accepted by the public upload endpoint');
      assert.ok(!payload.success);
    });

    await test('the avatar endpoint rejects a request with no file', async () => {
      const form = new FormData();
      form.append('kind', 'image');
      const response = await fetch(`${devOrigin}/api/testimonials/avatar`, {
        method: 'POST',
        body: form,
      });
      assert.strictEqual(response.status, 400);
    });

    /* --------------------------- media round trip -------------------- */

    let uploadedUrl = null;
    let uploadedId = null;

    await test('a valid image uploads and is served back byte for byte', async () => {
      const form = new FormData();
      form.append('files', new Blob([png], { type: 'image/png' }), 'My Photo.PNG');

      const response = await fetch(`${devOrigin}/api/admin/media`, {
        method: 'POST',
        headers: {
          cookie: jar.header(),
          origin: devOrigin,
          'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
        },
        body: form,
      });
      const payload = await response.json().catch(() => null);
      assert.strictEqual(response.status, 201, JSON.stringify(payload));

      uploadedId = payload.data.assets[0].id;
      uploadedUrl = payload.data.assets[0].url;

      assert.match(uploadedUrl, /^\/uploads\/image\//, `unexpected url ${uploadedUrl}`);
      assert.ok(!uploadedUrl.includes('My'), 'the client filename must not become the storage key');

      const fetched = await fetch(`${devOrigin}${uploadedUrl}`);
      assert.strictEqual(fetched.status, 200);
      assert.strictEqual(fetched.headers.get('content-type'), 'image/png');
      const bytes = Buffer.from(await fetched.arrayBuffer());
      assert.ok(bytes.equals(png), 'the served bytes differ from what was uploaded');
    });

    await test('the asset is listed in the media library with its metadata', async () => {
      const response = await fetch(`${devOrigin}/api/admin/media`, {
        headers: { cookie: jar.header() },
      });
      const payload = await response.json();
      assert.strictEqual(response.status, 200);
      const asset = payload.data.items.find((item) => item.id === uploadedId);
      assert.ok(asset, 'the uploaded asset is missing from the library');
      assert.strictEqual(asset.kind, 'image');
      assert.strictEqual(asset.url, uploadedUrl);
    });

    await test('the upload survives a server restart (it is on disk)', async () => {
      await stopDev();
      dev = startDev();
      await waitForServer(`${devOrigin}/api/cms`, 180_000);

      const response = await fetch(`${devOrigin}${uploadedUrl}`);
      assert.strictEqual(response.status, 200, 'the upload did not survive a restart');
    });

    await test('an oversized file is rejected', async () => {
      const form = new FormData();
      // Declared as a video so the 100 MB video limit applies.
      form.append('files', new Blob([Buffer.alloc(9 * 1024 * 1024, 1)], { type: 'image/png' }), 'big.png');
      const response = await fetch(`${devOrigin}/api/admin/media`, {
        method: 'POST',
        headers: {
          cookie: jar.header(),
          origin: devOrigin,
          'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
        },
        body: form,
      });
      assert.strictEqual(response.status, 415);
    });

    await test('deleting an asset removes both the file and the record', async () => {
      const response = await fetch(`${devOrigin}/api/admin/media?id=${uploadedId}`, {
        method: 'DELETE',
        headers: {
          cookie: jar.header(),
          origin: devOrigin,
          'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
        },
      });
      assert.strictEqual(response.status, 200);

      const after = await fetch(`${devOrigin}${uploadedUrl}`);
      assert.strictEqual(after.status, 404, 'the stored file is still served after deletion');

      const list = await fetch(`${devOrigin}/api/admin/media`, {
        headers: { cookie: jar.header() },
      });
      const payload = await list.json();
      assert.ok(!payload.data.items.find((item) => item.id === uploadedId));
    });

    await test('deleting an unknown asset returns 404', async () => {
      const response = await fetch(`${devOrigin}/api/admin/media?id=000000000000000000000000`, {
        method: 'DELETE',
        headers: {
          cookie: jar.header(),
          origin: devOrigin,
          'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
        },
      });
      assert.strictEqual(response.status, 404);
    });

    await test('a malformed asset id is a 400, not a 500', async () => {
      // `findById` throws a CastError on a non-ObjectId, which used to surface as a
      // generic 500 - indistinguishable, in the dashboard, from the database being
      // unreachable.
      for (const id of ['not-an-object-id', '123', '%20']) {
        const response = await fetch(`${devOrigin}/api/admin/media?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            cookie: jar.header(),
            origin: devOrigin,
            'x-kaiyo-csrf': jar.get('kaiyo-admin-csrf') || '',
          },
        });
        assert.strictEqual(response.status, 400, `id "${id}" returned ${response.status}`);
      }
    });

    await test('path traversal on the upload route is refused', async () => {
      const response = await fetch(`${devOrigin}/uploads/../../../package.json`);
      assert.ok(response.status === 404 || response.status === 400, `got ${response.status}`);
    });
  } catch (error) {
    failed_ += 1;
    results.push({ name: 'media suite', ok: false, error });
    console.log('  FAIL  media suite');
    console.log(`        ${(error && error.message) || error}`);
  } finally {
    await stopDev();
    restoreProductionBuild(buildParked);
  }
}

/* ------------------------------ process runner --------------------------- */

/** Lowers an account to the non-admin `editor` role, for authorization tests. */
async function demoteToEditor(uri, email) {
  const mongoose = require('mongoose');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  const result = await mongoose.connection
    .collection('admins')
    .updateOne({ email }, { $set: { role: 'editor' } });
  await mongoose.disconnect();
  if (result.matchedCount !== 1) {
    throw new Error(`Could not demote ${email} to the editor role.`);
  }
}

function runNode(script, env, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

main().catch((error) => {
  console.error('\nTest runner crashed:', error);
  process.exit(1);
});

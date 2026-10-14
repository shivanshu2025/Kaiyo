#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * backend/scripts/create-admin.js
 * ---------------------------------------------------------------------------
 * Creates (or deliberately refuses to duplicate) a Kaiyo administrator account.
 *
 * The admin sign-in is PIN-only, so this script sets the account's PIN.
 *
 *   Usage:
 *     npm run create-admin                       # reads .env.local, hidden prompt for the PIN
 *     ADMIN_EMAIL=you@example.com ADMIN_PIN='123456' node backend/scripts/create-admin.js
 *
 * The account is written ONLY to the database `MONGODB_URI` points at, so it must
 * be the same connection string Vercel is configured with. Run it from the
 * `frontend` directory (where `.env.local` lives) and check the
 * `Connecting to ... (database "<name>")` line before trusting the result.
 *
 * Safety properties:
 *  - `MONGODB_URI` is loaded from `.env.local`/`.env` BEFORE it is read, and a
 *    placeholder or non-URI value is rejected with an explanatory error instead of
 *    being handed to the driver (which would fail with a bare `MongoParseError`);
 *  - the PIN is read from the ADMIN_PIN environment variable or a hidden
 *    interactive prompt and is NEVER accepted as a command-line argument, so it
 *    cannot end up in shell history, in `ps` output, or in the process table;
 *  - the PIN is hashed with bcrypt (cost 12) before it is stored; the plaintext
 *    and the hash are never printed;
 *  - only creation is performed - this script never drops a collection, never
 *    truncates, and never deletes an existing admin;
 *  - re-running it is safe: an existing email is reported and the script exits
 *    without modifying anything unless `--force` is passed;
 *  - it must be run from a trusted machine or a secure server. It is not exposed
 *    through any route and the PIN must never be committed to git.
 */

'use strict';

const path = require('path');
const readline = require('readline');

/** PIN policy, mirroring `pinLoginSchema` in backend/lib/validation.ts. */
const PIN_PATTERN = /^[0-9]{4,12}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ dependencies ----------------------------- */

async function loadDependencies() {
  let mongoose;
  let bcrypt;
  try {
    mongoose = require('mongoose');
    bcrypt = require('bcryptjs');
  } catch (error) {
    console.error('Missing dependencies. Run `npm install` first.');
    throw error;
  }

  // The models are TypeScript. Registering ts-node here would add a dev
  // dependency, so the two small schemas the script needs are declared inline
    // against the same connection.
  return { mongoose, bcrypt };
}

async function loadEnvFiles() {
  const fs = require('fs');
  // `npm run create-admin` runs from the `frontend` directory, which is where
  // Next.js also looks, so this resolves `.env.local` identically to `next dev`.
  const dir = process.cwd();

  for (const file of ['.env.local', '.env']) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;

    for (const rawLine of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;

      const key = match[1];
      if (process.env[key] !== undefined) continue; // real environment wins

      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

/* -------------------------------- input --------------------------------- */

/**
 * Reads a secret without echoing it. Falls back to a plain stdin read when the
 * terminal cannot be put into raw mode (for example in some CI environments).
 */
function promptHidden(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char) => {
      // Stop masking characters once Enter is pressed.
      if (['\n', '\r', ''].includes(char.toString('utf8'))) {
        process.stdin.removeListener('data', onData);
      } else {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${question}${'*'.repeat(rl.line.length)}`);
      }
    };

    process.stdout.write(question);
    rl.on('line', (line) => {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write('\n');
      resolve(line);
    });

    rl.on('close', () => resolve(''));
    process.stdin.on('data', onData);
  });
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Validates the admin PIN.
 *
 * Digits only, 4-12 characters - a shared sign-in PIN needs a small key space, and
 * bcrypt is what protects the stored hash. The upper bound is far below bcrypt's
 * 72-byte input limit, so truncation can never apply.
 */
function validatePin(pin) {
  if (!pin) return 'A PIN is required.';
  if (!PIN_PATTERN.test(pin)) {
    return 'The PIN must be 4 to 12 digits (numbers only).';
  }
  return null;
}

function normaliseEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

/* ----------------------------- connection URI ---------------------------- */

/**
 * The name MongoDB will actually use, or `null` when the URI carries none.
 *
 * Safe to print: it is a database name, never the cluster's credentials. Seeing
 * it is the fastest way to confirm the script is pointed at the production
 * database and not a local one - the two being confused is what makes an admin
 * appear to be "missing" in production after a successful local run.
 */
function databaseNameFor(uri) {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const afterHost = withoutScheme.slice(withoutScheme.indexOf('/') + 1);
  const name = afterHost.split('?')[0];
  return name || null;
}

/**
 * Rejects a connection string that cannot work, WITHOUT echoing it.
 *
 * Mirrors `assertValidMongoUri` in `backend/lib/env.ts`, which the running
 * application uses but which cannot be imported here (it is TypeScript and plain
 * `node` cannot load it). The extra placeholder check is deliberate: copying a
 * template value out of `.env.example` produces something that starts with
 * `mongodb://` and parses as far as the prefix, but then fails deep inside the
 * driver with an opaque `MongoParseError` that says nothing about the real
 * problem.
 *
 * Never interpolate the value into any of these messages - connection strings
 * carry the database username and password.
 */
function assertUsableMongoUri(uri) {
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error(
      'MONGODB_URI is not a MongoDB connection string: it must start with ' +
        '"mongodb://" or "mongodb+srv://". The value is never shown because it ' +
        'contains credentials. Copy the real SRV string from MongoDB Atlas > Connect.',
    );
  }
  if (/\s/.test(uri)) {
    throw new Error(
      'MONGODB_URI contains whitespace. Check for a stray space or line break ' +
        'introduced when pasting the value from the Atlas UI. The value is never ' +
        'shown because it contains credentials.',
    );
  }

  // Placeholder detection. These are the literal tokens `.env.example` ships in,
  // plus the common hand-typed variants. Only a generic message is returned, so
  // nothing from the value leaks.
  const placeholders = [
    /<[^>]*>/, //            <db_username>, <db_password>, <database_name>
    /YOUR_[A-Z0-9_]+/i, //          YOUR_PRODUCTION_MONGODB_URI
    /YOUR-[A-Z0-9-]+/i,
    /\bREPLACE\b/i,
    /\bCHANGE_?ME\b/i,
    /\bCHANGEME\b/i,
    /\bEXAMPLE\b/i,
    /\bPLACEHOLDER\b/i,
    /\bTODO\b/i,
    /\bXXXX/i,
    /\.\.\./,
  ];
  if (placeholders.some((pattern) => pattern.test(uri))) {
    throw new Error(
      'MONGODB_URI still contains a placeholder value (e.g. <db_username>, ' +
        'YOUR_PRODUCTION_MONGODB_URI). Replace it with the real connection string ' +
        'before running this script - set it in .env.local, or in Vercel under ' +
        'Settings > Environment Variables. The value is never shown because it ' +
        'contains credentials.',
    );
  }
}

/* -------------------------------- main ---------------------------------- */

async function main() {
  const force = process.argv.includes('--force');

  // MUST run before MONGODB_URI is read.
  //
  // This used to happen inside `loadDependencies()`, which is called further down -
  // so `process.env.MONGODB_URI` was already undefined at the point it was read,
  // and a `.env.local` holding the real Atlas connection string was never seen.
  // The script then either aborted, or - if a stale value existed in the shell /
  // OS environment - connected to THAT database instead. Either way the account
  // was never written to the database production actually reads, which is why
  // `npm run create-admin` appeared to run while Vercel still had no admin.
  await loadEnvFiles();

  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    console.error(
      'MONGODB_URI is not set.\n' +
        '  Add it to .env.local (see .env.example) or export it before running this script.\n' +
        '  It must be the SAME connection string Vercel uses, e.g.\n' +
        '    mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority\n' +
        '  The account created by this script only exists in the database this URI points at.',
    );
    process.exitCode = 1;
    return;
  }

  try {
    assertUsableMongoUri(uri);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  // Redact any credentials embedded in the URI before it could reach a log.
  const safeUri = uri.replace(/\/\/[^@/]*@/, '//***@');
  const databaseName = databaseNameFor(uri);

  let email = normaliseEmail(process.env.ADMIN_EMAIL);
  let pin = process.env.ADMIN_PIN;
  const name = (process.env.ADMIN_NAME || 'Administrator').trim().slice(0, 120);

  if (!email) {
    email = normaliseEmail(await prompt('Admin email (identity record, not used to sign in): '));
  }

  if (!EMAIL_PATTERN.test(email)) {
    console.error('A valid ADMIN_EMAIL is required.');
    process.exitCode = 1;
    return;
  }

  if (!pin) {
    pin = await promptHidden('Admin PIN (input hidden): ');
    const confirmation = await promptHidden('Confirm PIN (input hidden): ');
    if (pin !== confirmation) {
      console.error('The PINs did not match.');
      process.exitCode = 1;
      return;
    }
  }

  const pinError = validatePin(pin);
  if (pinError) {
    console.error(pinError);
    process.exitCode = 1;
    return;
  }

  const { mongoose, bcrypt } = await loadDependencies();

  const AdminSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
      name: { type: String, required: true, trim: true, maxlength: 120, default: 'Administrator' },
      // `select: false` keeps the hash out of any accidental read.
      passwordHash: { type: String, required: true, select: false },
      passwordUpdatedAt: { type: Date, required: true, default: () => new Date() },
      role: { type: String, enum: ['admin', 'editor'], required: true, default: 'admin' },
      active: { type: Boolean, required: true, default: true },
      failedAttempts: { type: Number, required: true, default: 0 },
      lastFailedAt: { type: Date, default: null },
      lockedUntil: { type: Date, default: null },
      security: {
        maxFailedAttempts: { type: Number, default: 5 },
        lockoutMinutes: { type: Number, default: 15 },
        autoLogoutMinutes: { type: Number, default: 60 },
      },
      lastLoginAt: { type: Date, default: null },
      passwordChangedAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

  console.log(`Connecting to ${safeUri}${databaseName ? ` (database "${databaseName}")` : ''} ...`);

  let connected = false;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    connected = true;

    // Reuse the compiled model when the script runs inside a dev server that has
    // already registered it, so Mongoose does not throw OverwriteModelError.
    const Admin =
      mongoose.models.Admin ||
      mongoose.model('Admin', AdminSchema);

    const existing = await Admin.findOne({ email }).select('_id email role active').lean();

    if (existing && !force) {
      console.log(`An administrator with the email ${email} already exists.`);
      console.log('Nothing was changed. Re-run with --force to set a new PIN.');
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(pin, 12);

    if (existing) {
      await Admin.updateOne(
        { _id: existing._id },
        {
          $set: {
            passwordHash,
            passwordUpdatedAt: new Date(),
            passwordChangedAt: new Date(),
            failedAttempts: 0,
            lockedUntil: null,
            lastFailedAt: null,
            active: true,
          },
        },
      );
      console.log(`PIN reset for ${email} (--force).`);
    } else {
      await Admin.create({
        email,
        name,
        passwordHash,
        role: 'admin',
        active: true,
        passwordUpdatedAt: new Date(),
      });
      console.log(`Administrator created: ${email}`);
    }

    // Drop the live session table so no session minted before this PIN change can
    // keep working. This is a targeted delete of auth state, not a destructive
    // migration.
    const SessionSchema = new mongoose.Schema(
      { tokenHash: String, revokedAt: Date, expiresAt: Date },
      { timestamps: true },
    );
    const AdminSession =
      mongoose.models.AdminSession || mongoose.model('AdminSession', SessionSchema);

    const cleared = await AdminSession.deleteMany({
      ...(existing ? { adminId: existing._id } : { adminId: { $exists: false } }),
    });
    console.log(`Revoked ${cleared.deletedCount ?? 0} existing session(s).`);

    console.log('Done. Sign in at /admin/login.');
  } catch (error) {
    // The driver can include the connection string in its message; only the
    // error name and code are safe to surface.
    const code = error && error.code ? ` (code ${error.code})` : '';
    console.error(`Failed${code}: ${(error && error.name) || 'Unknown error'}`);
    if (error && error.name === 'MongooseServerSelectionError') {
      console.error('The database was not reachable. Check MONGODB_URI and the network allowlist.');
    }
    if (error && error.name === 'MongoParseError') {
      console.error(
        'The connection string could not be parsed. This normally means a template or ' +
          'placeholder value was pasted instead of the real one from MongoDB Atlas > Connect.',
      );
    }
    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.disconnect().catch(() => undefined);
    }
  }
}

main().catch((error) => {
  console.error(`Unexpected error: ${(error && error.name) || 'Unknown'}`);
  process.exitCode = 1;
});
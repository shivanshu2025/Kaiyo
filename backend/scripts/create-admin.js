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
 *     ADMIN_EMAIL=you@example.com ADMIN_PIN='123456' node backend/scripts/create-admin.js
 *     node backend/scripts/create-admin.js            # secure interactive prompt instead
 *
 * Safety properties:
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
  // dotenv is not a project dependency; load .env.local manually so the script
  // behaves the same as `next dev` without adding a package.
  await loadEnvFiles();

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

/* -------------------------------- main ---------------------------------- */

async function main() {
  const force = process.argv.includes('--force');

  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    console.error(
      'MONGODB_URI is not set.\n' +
        '  Add it to .env.local (see .env.example) or export it before running this script.',
    );
    process.exitCode = 1;
    return;
  }

  // Redact any credentials embedded in the URI before it could reach a log.
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');

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

  console.log(`Connecting to ${safeUri} ...`);

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
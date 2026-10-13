#!/usr/bin/env node
'use strict';

/**
 * Creates the indexes Kaiyō needs in production.
 *
 * WHY THIS EXISTS
 * ---------------
 * `backend/lib/db.ts` sets `autoIndex: !env.isProd`, so in production Mongoose
 * builds **no** indexes at all. That silently disables:
 *   - the unique constraint on `admins.email` (duplicate admin accounts),
 *   - the unique constraints on `testimonials.publicId`,
 *     `contactsubmissions.publicId`, `leads.publicId`,
 *     `adminsessions.tokenHash` and `ratelimits.key`,
 *   - the TTL indexes that let MongoDB reap expired sessions and rate-limit
 *     counters. Without them those two collections grow without bound.
 *
 * Run this once after the first production deploy.
 *
 * WHY THIS LISTS INDEXES EXPLICITLY
 * ---------------------------------
 * The schema files are TypeScript, which plain `node` cannot import, so the
 * declarations cannot be read from them here. Instead the required set is spelled
 * out below and created through `collection.createIndex()`.
 *
 * `backend/scripts/test-backend.js` asserts that the live application produces a
 * superset of this list, so the two cannot silently drift apart.
 *
 * SAFETY
 * ------
 * `createIndex` is **additive**: it creates what is missing and never drops
 * anything. No collection is dropped, no document is deleted, no index is removed.
 *
 * It deliberately does NOT use `syncIndexes()`, which drops any index that is not
 * declared in the schema - one un-declared index and it would silently take a
 * unique constraint away from a live database.
 *
 * If existing data already violates a unique index (for example two admins sharing
 * an email), the driver reports a duplicate-key error naming the conflicting index.
 * That is a data problem to fix deliberately; this script will not delete anything
 * to make it fit.
 *
 * USAGE
 * -----
 *   MONGODB_URI="mongodb+srv://..." npm run db:indexes -- --check
 *   MONGODB_URI="mongodb+srv://..." npm run db:indexes
 *
 * `--check` prints the current indexes and changes nothing.
 *
 * The connection string is redacted in every log line; its value is never printed.
 */

const path = require('path');
const mongoose = require('mongoose');

/** Loads .env.local then .env, letting a real environment variable win. */
function loadEnvFiles() {
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
      if (process.env[match[1]] !== undefined) continue;

      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

function redactUri(uri) {
  return uri.replace(/\/\/[^@/]*@/, '//***@');
}

/**
 * The production index manifest.
 *
 * `unique` and `ttl` are the two that matter most: without them the application
 * still runs, but duplicate keys become possible and disposable collections grow
 * forever. The remaining entries mirror the query patterns the routes actually
 * use.
 */
const MANIFEST = {
  admins: [
    { keys: { email: 1 }, unique: true, why: 'one account per email' },
    { keys: { role: 1 } },
    { keys: { active: 1 } },
  ],
  adminsessions: [
    { keys: { tokenHash: 1 }, unique: true, why: 'session lookup by digest' },
    { keys: { adminId: 1 } },
    { keys: { adminId: 1, revokedAt: 1 } },
    { keys: { adminId: 1, lastActivityAt: -1 } },
    { keys: { expiresAt: 1 }, ttl: 0, why: 'MongoDB reaps expired sessions' },
  ],
  // `cmscontents` needs no explicit index: MongoDB always creates a unique `_id_`
  // index, and asking for a second one on the same key is rejected (error 197).
  contactsubmissions: [
    { keys: { publicId: 1 }, unique: true },
    { keys: { email: 1 } },
    { keys: { status: 1, createdAt: -1 } },
    { keys: { ipHash: 1 } },
    { keys: { markedSpam: 1 } },
    { keys: { createdAt: -1 } },
  ],
  leads: [
    { keys: { publicId: 1 }, unique: true },
    { keys: { email: 1 } },
    { keys: { status: 1, createdAt: -1 } },
    { keys: { solutionSlug: 1, createdAt: -1 } },
    { keys: { ipHash: 1 } },
    { keys: { markedSpam: 1 } },
    { keys: { createdAt: -1 } },
  ],
  mediaassets: [
    { keys: { kind: 1 } },
    { keys: { storageKey: 1 } },
    { keys: { createdAt: -1 } },
  ],
  ratelimits: [
    { keys: { key: 1 }, unique: true, why: 'one counter per bucket' },
    { keys: { resetAt: 1 }, ttl: 0, why: 'MongoDB reaps expired windows' },
  ],
  testimonials: [
    { keys: { publicId: 1 }, unique: true },
    { keys: { status: 1, displayOrder: 1, createdAt: -1 } },
    { keys: { status: 1 } },
    { keys: { displayOrder: 1 } },
  ],
};

module.exports = { MANIFEST, redactUri };

function keySignature(keys) {
  return Object.keys(keys)
    .map((field) => `${field}:${keys[field]}`)
    .join(',');
}

async function main() {
  const checkOnly = process.argv.includes('--check');

  loadEnvFiles();

  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    console.error(
      'MONGODB_URI is not set.\n' +
        '  Export it, or add it to .env.local, then re-run:\n' +
        '    MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<db>" npm run db:indexes',
    );
    process.exitCode = 1;
    return;
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error('MONGODB_URI is malformed: it must start with mongodb:// or mongodb+srv://.');
    process.exitCode = 1;
    return;
  }

  console.log(`Target: ${redactUri(uri)}`);
  console.log(`Mode:   ${checkOnly ? 'check only (no changes)' : 'create missing indexes (additive only)'}\n`);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  const db = mongoose.connection.db;

  let created = 0;
  let alreadyPresent = 0;
  const failures = [];

  for (const [collectionName, indexes] of Object.entries(MANIFEST)) {
    const collection = db.collection(collectionName);

    if (checkOnly) {
      // A collection that has never been written to does not exist yet. That is a
      // normal state, not an error, and must not abort the whole report.
      const exists = (await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray()).length > 0;
      if (!exists) {
        console.log(`  ${collectionName}: (collection does not exist yet)`);
        continue;
      }
      let existing = [];
      try {
        existing = await collection.indexes();
      } catch (error) {
        console.log(`  ${collectionName}: could not be read (${error && error.name ? error.name : 'Error'})`);
        continue;
      }
      console.log(`  ${collectionName}:`);
      if (existing.length === 0) console.log('    (none)');
      for (const index of existing) {
        const notes = [
          index.unique ? 'unique' : null,
          index.expireAfterSeconds !== undefined ? `ttl=${index.expireAfterSeconds}s` : null,
        ].filter(Boolean);
        console.log(`    ${Object.entries(index.key).map(([k, v]) => `${k}:${v}`).join(',')}${notes.length ? `  [${notes.join(', ')}]` : ''}`);
      }
      continue;
    }

    for (const index of indexes) {
      const options = {};
      if (index.unique) options.unique = true;
      if (index.ttl !== undefined) options.expireAfterSeconds = index.ttl;

      try {
        const name = await collection.createIndex(index.keys, options);
        created += 1;
        console.log(`  ${collectionName}: created ${name}${index.why ? `  (${index.why})` : ''}`);
      } catch (error) {
        // An identical index already present is success, not a failure.
        if (error && (error.code === 85 || error.code === 86)) {
          alreadyPresent += 1;
          console.log(`  ${collectionName}: ${keySignature(index.keys)} already exists with different options - left untouched`);
          continue;
        }
        failures.push(
          `  ${collectionName}: FAILED on ${keySignature(index.keys)} - ` +
            `${error && error.name ? error.name : 'Error'}${error && error.code ? ` (code ${error.code})` : ''}` +
            `${index.why ? ` [${index.why}]` : ''}`,
        );
      }
    }
  }

  await mongoose.disconnect();

  if (!checkOnly) {
    console.log(`\nCreated ${created}, already present ${alreadyPresent}, failed ${failures.length}.`);
  }

  if (failures.length > 0) {
    console.error('\nSome indexes could not be created:');
    for (const failure of failures) console.error(failure);
    console.error(
      '\nNothing was deleted. If the failure is a duplicate-key error, existing data ' +
        'already violates that unique index - resolve the data first.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    checkOnly
      ? '\nCheck complete. No changes were made.'
      : '\nDone. Additive only - no collection, document or index was removed.',
  );
}

if (require.main === module) {
  main().catch((error) => {
    // The driver's message can embed the connection string, so it is suppressed.
    console.error(
      '\nIndex setup crashed:',
      error && error.name ? error.name : 'Error',
      '(message suppressed: it can contain the connection string)',
    );
    process.exit(1);
  });
}
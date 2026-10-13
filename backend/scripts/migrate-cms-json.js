#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * backend/scripts/migrate-cms-json.js
 * ---------------------------------------------------------------------------
 * One-time import of the legacy `data/cms.json` file into MongoDB.
 *
 * The previous backend stored all CMS content in a JSON file on the server
 * filesystem. That is not durable on Vercel/Netlify, so the store has moved to
 * MongoDB. This script carries over whatever the file contains so nothing an
 * admin already saved is lost.
 *
 *   node backend/scripts/migrate-cms-json.js            # migrate only if the DB is empty
 *   node backend/scripts/migrate-cms-json.js --force    # overwrite the CMS document
 *
 * Safety:
 *  - it NEVER drops a collection and never deletes testimonials or submissions;
 *  - without `--force` it exits if a CMS document already exists, so re-running
 *    cannot clobber newer edits made through the dashboard;
 *  - existing `Testimonial` / `ContactSubmission` documents are matched by their
 *    id and upserted, so running it twice is harmless.
 */

'use strict';

const fs = require('fs');
const path = require('path');

async function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;

    for (const rawLine of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match || process.env[match[1]] !== undefined) continue;
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

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  await loadEnvFiles();

  const force = process.argv.includes('--force');
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    console.error('MONGODB_URI is not set. See .env.example.');
    process.exitCode = 1;
    return;
  }

  const sourceFile = path.join(process.cwd(), 'data', 'cms.json');
  if (!fs.existsSync(sourceFile)) {
    console.log('data/cms.json not found - nothing to migrate.');
    return;
  }

  let mongoose;
  let data;
  try {
    mongoose = require('mongoose');
    data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  } catch (error) {
    console.error(`Could not read data/cms.json: ${error.name}`);
    process.exitCode = 1;
    return;
  }

  const CmsSchema = new mongoose.Schema(
    { _id: String, data: mongoose.Schema.Types.Mixed, updatedAt: Date },
    { timestamps: true, minimize: false },
  );
  const TestimonialSchema = new mongoose.Schema(
    {
      publicId: { type: String, required: true, unique: true },
      name: String,
      content: String,
      avatar: { type: String, default: '' },
      image: { type: String, default: '' },
      designation: { type: String, default: '' },
      company: { type: String, default: '' },
      rating: Number,
      status: { type: String, default: 'published' },
      publishedAt: Date,
      displayOrder: Number,
    },
    { timestamps: true },
  );
  const SubmissionSchema = new mongoose.Schema(
    {
      publicId: { type: String, required: true, unique: true },
      name: String,
      email: String,
      phone: { type: String, default: '' },
      interest: { type: String, default: '' },
      message: String,
      status: { type: String, default: 'new' },
      markedSpam: { type: Boolean, default: false },
    },
    { timestamps: true },
  );

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  try {
    const Cms = mongoose.models.CmsContent || mongoose.model('CmsContent', CmsSchema);
    const Testimonial =
      mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
    const Submission =
      mongoose.models.ContactSubmission || mongoose.model('ContactSubmission', SubmissionSchema);

    const existing = await Cms.findById('singleton').select('_id').lean();
    if (existing && !force) {
      console.log('A CMS document already exists in MongoDB - nothing was changed.');
      console.log('Re-run with --force to overwrite it with the contents of data/cms.json.');
      process.exitCode = 1;
      return;
    }

    const { testimonials, contact, ...content } = data;

    await Cms.updateOne(
      { _id: 'singleton' },
      {
        $set: {
          data: {
            ...content,
            testimonials: testimonials?.hero ? { hero: testimonials.hero } : {},
            // `submissions` is omitted here: it lives in its own collection and
            // is imported below.
            contact: Object.fromEntries(
              Object.entries(contact ?? {}).filter(([key]) => key !== 'submissions'),
            ),
          },
        },
      },
      { upsert: true },
    );
    console.log('CMS document imported.');

    const testimonialItems = Array.isArray(testimonials?.items) ? testimonials.items : [];
    if (testimonialItems.length > 0) {
      await Testimonial.bulkWrite(
        testimonialItems.map((item, index) => ({
          updateOne: {
            filter: { publicId: item.id || createId('testimonial') },
            update: {
              $set: {
                name: item.name,
                content: item.content,
                avatar: item.avatar ?? '',
                image: item.image ?? '',
                designation: item.designation ?? '',
                company: item.company ?? '',
                rating: item.rating,
                status: item.status ?? 'published',
                displayOrder: item.displayOrder ?? index,
              },
            },
            upsert: true,
          },
        })),
      );
      console.log(`${testimonialItems.length} testimonial(s) imported.`);
    }

    const submissionItems = Array.isArray(contact?.submissions) ? contact.submissions : [];
    if (submissionItems.length > 0) {
      await Submission.bulkWrite(
        submissionItems.map((item) => ({
          updateOne: {
            filter: { publicId: item.id || createId('contact') },
            update: {
              $set: {
                name: item.name,
                email: item.email,
                phone: item.phone ?? '',
                interest: item.interest ?? '',
                message: item.message,
                status: item.status ?? 'new',
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              },
            },
            upsert: true,
          },
        })),
      );
      console.log(`${submissionItems.length} contact submission(s) imported.`);
    }

    console.log('Migration complete. data/cms.json was left on disk and is no longer read at runtime.');
  } catch (error) {
    console.error(`Migration failed (${error.name}): ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(`Unexpected error: ${(error && error.name) || 'Unknown'}`);
  process.exitCode = 1;
});
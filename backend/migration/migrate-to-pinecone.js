#!/usr/bin/env node
/**
 * Migration Script: Populate Pinecone with existing MongoDB data
 * 
 * Run once after deploying the vector service update:
 *   node backend/migration/migrate-to-pinecone.js
 * 
 * What it does:
 *   1. Upserts all DebateGroup embeddings  → namespace "debate-groups"
 *   2. Upserts all CommentGroup embeddings → namespace "news-groups"
 *   3. Upserts all DebateRoom topics       → namespace "debate-topics"
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// ── Models ───────────────────────────────────────────────────────────────────
const DebateGroup = require('../models/DebateGroup');
const DebateRoom  = require('../models/DebateRoom');
const { CommentGroup } = require('../models/CommentFilter');

// ── Services ─────────────────────────────────────────────────────────────────
const vectorService = require('../services/vectorService');

// ── Config ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DBMS';
const BATCH_DELAY = 500;   // ms between upserts (avoid rate limits)
const MAX_RETRIES = 2;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Retry wrapper for rate-limited operations */
async function withRetry(fn, label) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await fn();
      return true;
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < MAX_RETRIES) {
        const wait = 5000 * (attempt + 1);
        console.log(`  ⏳ Rate limited on ${label}, waiting ${wait/1000}s …`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

async function migrateDebateGroups() {
  const groups = await DebateGroup.find({}).lean();
  console.log(`\n📦 Migrating ${groups.length} DebateGroups …`);

  let ok = 0, fail = 0;
  for (const g of groups) {
    try {
      await withRetry(() => vectorService.storeDebateGroup(
        g._id.toString(),
        g.title || g.label || 'Untitled',
        g.description || '',
        g.debateRoomId.toString(),
        g.stance
      ), `Group ${g._id}`);
      ok++;
      process.stdout.write(`  ✓ ${ok}/${groups.length}\r`);
      await sleep(BATCH_DELAY);
    } catch (err) {
      fail++;
      console.error(`  ✗ Group ${g._id}: ${err.message}`);
    }
  }
  console.log(`  Done — ${ok} ok, ${fail} failed`);
}

async function migrateCommentGroups() {
  const groups = await CommentGroup.find({}).lean();
  console.log(`\n📦 Migrating ${groups.length} CommentGroups (news) …`);

  let ok = 0, fail = 0;
  for (const g of groups) {
    try {
      await withRetry(() => vectorService.storeNewsGroup(
        g._id.toString(),
        g.label || 'Unlabeled',
        g.description || '',
        g.newsId.toString()
      ), `CommentGroup ${g._id}`);
      ok++;
      process.stdout.write(`  ✓ ${ok}/${groups.length}\r`);
      await sleep(BATCH_DELAY);
    } catch (err) {
      fail++;
      console.error(`  ✗ CommentGroup ${g._id}: ${err.message}`);
    }
  }
  console.log(`  Done — ${ok} ok, ${fail} failed`);
}

async function migrateDebateTopics() {
  const rooms = await DebateRoom.find({}).lean();
  console.log(`\n📦 Migrating ${rooms.length} DebateRoom topics …`);

  let ok = 0, fail = 0;
  for (const r of rooms) {
    try {
      await withRetry(() => vectorService.storeDebateTopic(
        r._id.toString(),
        r.title || 'Untitled Room',
        r.description || ''
      ), `Room ${r._id}`);
      ok++;
      process.stdout.write(`  ✓ ${ok}/${rooms.length}\r`);
      await sleep(BATCH_DELAY);
    } catch (err) {
      fail++;
      console.error(`  ✗ Room ${r._id}: ${err.message}`);
    }
  }
  console.log(`  Done — ${ok} ok, ${fail} failed`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('🔌 Connecting to MongoDB …');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    console.log('🔌 Initialising VectorService (Pinecone) …');
    await vectorService.init();

    if (!vectorService.ready) {
      console.error('❌ VectorService failed to initialise. Check PINECONE_API_KEY.');
      process.exit(1);
    }
    console.log('✅ VectorService ready');

    await migrateDebateGroups();
    await migrateCommentGroups();
    await migrateDebateTopics();

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();

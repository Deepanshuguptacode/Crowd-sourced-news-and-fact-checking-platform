# 19 — Cleanup Services & Scheduling

## Overview

VoxVeritas enforces storage caps on two collections — News (40 items) and TrendingNews (50 items) — via dedicated cleanup services. These prevent unbounded database growth on a platform designed for current-events discussion rather than archival.

**Files:**

| Service | File | Collection | Cap |
|---------|------|-----------|-----|
| News Cleanup | `services/newsCleanupService.js` | `News` | 40 items |
| Trending Cleanup | `services/trendingNewsCleanupService.js` | `TrendingNews` | 50 items |

---

## News Cleanup Service

**File:** `services/newsCleanupService.js`

### Purpose

Keeps the main News collection at a maximum of **40 items** (4 pages at 10 items per page). Newer articles are preserved; oldest articles are deleted along with their associated screenshot files.

### `cleanupOldNews()`

```
1. Query all News, sorted by uploadedAt descending (newest first)
2. If count ≤ 40: return early
3. Slice array from index 40 onward → newsToDelete
4. For each article to delete:
   a. Check screenshots array
   b. For each screenshot starting with '/uploads/screenshots/':
      - Resolve absolute file path
      - If file exists on disk: fs.unlinkSync()
   c. Delete News document via findByIdAndDelete()
5. Return { deleted: count, remaining: 40 }
```

### File Cleanup Detail

The service distinguishes between local files and external URLs:
- Screenshots starting with `/uploads/screenshots/` → local files, deleted from disk
- External URLs (http/https) → skipped, not managed by the cleanup service

This prevents the cleanup from attempting to delete third-party image URLs stored by the repost system.

### Scheduled Execution

```javascript
scheduleCleanup():
  setInterval(async () => {
    await this.cleanupOldNews();
  }, 60 * 60 * 1000);  // Every 1 hour
```

### Statistics

```javascript
getNewsStats():
  returns {
    totalCount: Number,
    maxAllowed: 40,
    needsCleanup: Boolean,
    excessCount: Number,
    recentNews: [{ title, uploadedAt }]  // 5 most recent
  }
```

---

## Trending News Cleanup Service

**File:** `services/trendingNewsCleanupService.js`

### Purpose

Maintains a maximum of **50 active trending news articles**. Unlike the News cleanup, this service only considers articles where `isActive: true` and does not manage any local files.

### `cleanupOldTrendingNews()`

```
1. Count documents where isActive = true
2. If count ≤ 50: return early
3. Calculate excess = count - 50
4. Query oldest items:
   - filter: { isActive: true }
   - sort: { fetchedAt: 1 } (ascending = oldest first)
   - limit: excess count
   - select: _id, title, fetchedAt
5. Collect IDs
6. deleteMany({ _id: { $in: idsToDelete } })
7. Verify remaining count
8. Return { deletedCount, remainingCount, deletedItems }
```

### Integration with Scraper

After every scrape cycle, the controller calls:

```javascript
TrendingNewsCleanupService.scheduleCleanupAfterFetch():
  1. getTrendingNewsStats()
  2. If needsCleanup → cleanupOldTrendingNews()
  3. Otherwise → return { success: true, message: 'No cleanup needed' }
```

This tight coupling ensures the collection never exceeds the 50-item cap, even during rapid scraping.

### Statistics

```javascript
getTrendingNewsStats():
  returns {
    totalCount: Number,
    maxAllowed: 50,
    needsCleanup: Boolean,
    excessCount: Number,
    recentNews: [{ title, fetchedAt }],  // 5 most recent
    oldestNews: [{ title, fetchedAt }]   // 5 oldest
  }
```

### Admin Manual Cleanup

```javascript
manualCleanup():
  // Simply delegates to cleanupOldTrendingNews()
  // Exposed via POST /trending-news/admin/cleanup
```

---

## Comparison

| Aspect | News Cleanup | Trending Cleanup |
|--------|-------------|-----------------|
| Collection | `News` | `TrendingNews` |
| Cap | 40 items | 50 items |
| Sort field | `uploadedAt` | `fetchedAt` |
| File deletion | Yes (screenshots) | No |
| Scheduling | `setInterval` (1 hour) | Post-scrape trigger |
| Filter | All documents | `isActive: true` only |
| Delete method | `findByIdAndDelete` (per item) | `deleteMany` (batch) |
| Admin endpoint | None | `POST /trending-news/admin/cleanup` |

### Why different delete strategies?

**News** uses per-item `findByIdAndDelete` because each deletion may require associated file cleanup (screenshots). The loop handles file I/O errors per-item without affecting other deletions.

**TrendingNews** uses `deleteMany` because there are no associated files — it's purely database records scraped from NDTV. Batch deletion is more efficient.

---

## Scheduling Overview

All scheduled tasks across the platform:

| Task | Mechanism | Interval | Trigger |
|------|-----------|----------|---------|
| Trending news scrape | `cron` package | Every 10 minutes | Automatic + immediate on startup |
| Trending cleanup | Post-scrape hook | After every scrape | Automatic |
| News cleanup | `setInterval` | Every 1 hour | Automatic |

### Startup Sequence

In `index.js`, after MongoDB connection:
```
1. TrendingNewsScheduler.start()
   → Registers cron job (10-min interval)
   → Calls fetchNewsImmediate() for first scrape
   → Cleanup runs after first scrape completes
2. NewsCleanupService.scheduleCleanup()
   → Registers hourly setInterval
```

---

## Error Resilience

Both services are designed to be non-fatal:

- **Per-item errors** — News cleanup catches errors per article and continues with remaining items
- **Trending cleanup errors** — Returns `{ success: false, message }` without throwing
- **Scheduler errors** — Caught inside setInterval/cron callbacks; logged but don't crash the server
- **File system errors** — Screenshot deletion failures are logged but don't prevent the News document deletion
- **Overlapping runs** — Trending scraper uses `isRunning` flag; News cleanup is idempotent (deleting already-deleted items is a no-op)

---

## Design Decisions

### Why 40 and 50 as caps?

- **40 News articles** = 4 pages at 10 items/page. The frontend paginates at 10 per page, so 4 pages provides enough browsing depth without overwhelming storage.
- **50 Trending articles** = roughly 2–3 scrape cycles' worth of content. At ~20 articles per NDTV scrape, this keeps about 2.5 cycles of trending content available.

### Why not use MongoDB TTL indexes?

TTL indexes delete documents based on age, not count. The platform wants the N most recent items regardless of age. A TTL approach would delete articles during slow news periods when there's no excess.

### Why separate services instead of one generic cleanup?

Each collection has different cleanup requirements (file deletion, batch vs. per-item, different sort fields, different filters). A generic service would need too many configuration options to handle both cases cleanly.

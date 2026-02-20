# 15 — Trending News Scraping & Repost System

## Overview

The Trending News system scrapes live headlines from NDTV India, stores them in a dedicated collection, and provides a repost mechanism that lets authenticated users promote external trending articles into the platform's main news feed. A cron scheduler automates periodic fetching, and a cleanup service enforces a 50-article cap.

**Primary files:**

| Layer | File |
|-------|------|
| Controller | `controllers/TrendingNewsController.js` |
| Scheduler | `services/trendingNewsScheduler.js` |
| Cleanup | `services/trendingNewsCleanupService.js` |
| Model | `models/TrendingNews.js` |
| Route | `routes/trendingNewsRoute.js` |

---

## Scraping Pipeline

### Target Source

The scraper targets **NDTV India** (`https://www.ndtv.com/india`), fetching the main listing page and then following each article link for additional metadata.

### Two-Phase Extraction

**Phase 1 — Listing Page:**
```text
Cheerio selector: '.news_Ede a'
Extracts: article URL, title text
```

**Phase 2 — Individual Article Pages:**
For each article link, a secondary HTTP request fetches OpenGraph metadata:

```text
og:image    → thumbnail URL
og:description → article summary
```

If either OG tag is missing, the article is still stored with whatever data was extracted.

### `scrapeAndSaveTrendingNews()`

This is the core scraping function:

```
1. Fetch NDTV India HTML with Cheerio
2. Select all '.news_Ede a' elements
3. For each link (limit: first batch on page):
   a. Fetch individual article page
   b. Extract og:image and og:description
   c. Upsert into TrendingNews collection (keyed on sourceUrl)
4. Return { success, savedCount, errors }
5. Trigger cleanup after successful scrape
```

**Upsert strategy** — The controller uses `findOneAndUpdate` with `upsert: true` keyed on `sourceUrl`, preventing duplicate entries when the same article appears across multiple scrape cycles.

**Article fields saved:**

| Field | Source |
|-------|--------|
| `title` | Link text from listing page |
| `sourceUrl` | `href` from listing page anchor |
| `image` | `og:image` from article page |
| `summary` | `og:description` from article page |
| `source` | Hardcoded `'NDTV'` |
| `fetchedAt` | `new Date()` at scrape time |
| `isActive` | `true` |

---

## Cron Scheduler

**File:** `services/trendingNewsScheduler.js`

The scheduler uses the `cron` npm package with the following configuration:

| Setting | Value |
|---------|-------|
| Cron pattern | `'0 */10 * * * *'` |
| Frequency | Every 10 minutes |
| Timezone | `Asia/Kolkata` |
| Overlap protection | `isRunning` flag prevents concurrent runs |

### Lifecycle

```
Server startup:
  1. scheduler.start() called from index.js
  2. Immediate fetch via fetchNewsImmediate()
  3. Cron job begins recurring 10-minute cycle

Each tick:
  1. Check isRunning flag → skip if already running
  2. Set isRunning = true
  3. Call TrendingNewsController.scrapeAndSaveTrendingNews()
  4. Set isRunning = false
  5. Post-scrape cleanup triggers automatically
```

### Control Methods

| Method | Purpose |
|--------|---------|
| `start()` | Register cron job and begin scheduling |
| `stop()` | Cancel cron job |
| `fetchNewsImmediate()` | One-time fetch outside cron schedule |
| `getStatus()` | Returns `{ isRunning, cronJob active status }` |

---

## Repost System

The repost feature converts a TrendingNews article into a full News document in the main platform feed.

### `repostNews(req, res)`

```
Input: req.params.id (TrendingNews _id), req.user from JWT

1. Find TrendingNews by ID
2. Validate it hasn't already been reposted by this user
3. Create new News document:
   - title: trending article title
   - description: trending article summary
   - screenshots: [trending article image URL]
   - sourceUrl: original NDTV link
   - uploadedBy: authenticated user's ID
   - userType: from JWT (normal/community/expert)
   - status: 'Unverified' (default for reposts)
   - repostedFrom: TrendingNews ObjectId
4. Push user ID into TrendingNews.repostedBy array
5. Increment TrendingNews.repostCount
6. Return created News document
```

### Repost Tracking

The TrendingNews model tracks reposts via:
- `repostedBy: [ObjectId]` — Array of user IDs who reposted
- `repostCount: Number` — Running counter

### Repost Removal

`removeRepost()` reverses the process:
1. Finds the News document created from the repost
2. Deletes it from the News collection
3. Pulls the user ID from `repostedBy` array
4. Decrements `repostCount`

---

## Cleanup Service

**File:** `services/trendingNewsCleanupService.js`

### 50-Article Cap

The cleanup service maintains a maximum of **50 active trending news articles**:

```
cleanupOldTrendingNews():
  1. Count documents where isActive = true
  2. If count ≤ 50: return early (no cleanup needed)
  3. Calculate excess = total - 50
  4. Query oldest items: sort by fetchedAt ascending, limit to excess count
  5. Collect their _ids
  6. deleteMany({ _id: { $in: idsToDelete } })
  7. Return { deletedCount, remainingCount, deletedItems }
```

### Integration with Scrape Cycle

After every scrape, the controller calls `scheduleCleanupAfterFetch()` which checks current count and triggers deletion only if the 50-item threshold is exceeded.

### Stats & Admin

| Method | Purpose |
|--------|---------|
| `getTrendingNewsStats()` | Returns totalCount, maxAllowed, needsCleanup, 5 newest, 5 oldest |
| `manualCleanup()` | Admin-triggered cleanup via API endpoint |
| `scheduleCleanupAfterFetch()` | Auto-cleanup after each scrape cycle |

---

## API Endpoints

Base path: `/trending-news`

### Public

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/` | `getTrendingNews` | Paginated list of trending news |
| GET | `/:id` | `getTrendingNewsById` | Single trending article |

### Authenticated

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/user/reposts` | `getUserReposts` | Current user's reposted articles |
| POST | `/:id/repost` | `repostNews` | Repost trending article to main feed |
| DELETE | `/:id/repost` | `removeRepost` | Remove a repost |

### Admin

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| POST | `/admin/fetch` | `fetchTrendingNews` | Manual scrape trigger |
| POST | `/admin/cleanup` | `manualCleanupTrendingNews` | Force cleanup |
| GET | `/admin/stats` | `getTrendingNewsStats` | Collection statistics |

---

## Error Handling

Scraping is wrapped in comprehensive try/catch at multiple levels:

1. **Per-article errors** — If a single article page fails to fetch, the error is logged but the scrape continues with remaining articles.
2. **Listing page errors** — If the main NDTV page fails, the entire scrape cycle fails and the error is returned.
3. **Scheduler overlap** — The `isRunning` flag prevents overlapping scrapes from queueing and exhausting resources.
4. **Cleanup errors** — Cleanup failures are logged but don't affect the scrape result.

---

## Design Decisions

### Why NDTV?
NDTV provides well-structured HTML with OG metadata on article pages, making it reliable for scraping. The `.news_Ede a` CSS selector targets the main news listing without sidebar noise.

### Why 10-minute intervals?
Balances freshness against NDTV rate limiting. News cycles rarely change faster than every 10 minutes for a general news source.

### Why 50-article cap?
Keeps the trending feed focused and prevents unbounded database growth. At 10-minute intervals with ~20 articles per scrape, the cap ensures roughly 2-3 hours of trending content.

### Why upsert on sourceUrl?
The same article URL may appear across multiple scrape cycles. Upserting on `sourceUrl` prevents duplicates while updating metadata (e.g., if NDTV changes an article's OG image).

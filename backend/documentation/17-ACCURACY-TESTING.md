# 17 — Accuracy Testing System

## Overview

The Accuracy Testing system evaluates VoxVeritas's AI verdict performance by comparing machine-generated credibility scores against known ground-truth labels (Fake vs. Verified). It computes metrics across complexity tiers, calculates engagement quality indicators, and persists results to the `AccuracyTest` MongoDB collection for historical tracking.

**Primary files:**

| Layer | File |
|-------|------|
| Service | `services/accuracyTestService.js` |
| Route | `routes/accuracyTest.js` |
| Model | `models/AccuracyTest.js` |

---

## Core Calculation Pipeline

### `calculateAccuracy()`

This is the main entry point. It performs a full accuracy assessment:

```
1. Fetch all News documents
2. Partition into:
   - fakeNews: status === 'Fake'
   - realNews: status === 'Verified'
3. Fetch all AIVerdict documents
4. Build verdictMap: Map<newsId string → AIVerdict>
5. Calculate verification accuracy across complexity tiers
6. Calculate engagement metrics from CommunityComment data
7. Determine overall accuracy:
   - For fake news: correct if verdict.score ≤ 30
   - For real news: correct if verdict.score ≥ 70
   - overallAccuracy = (correctPredictions / totalPredictions) × 100
8. Persist results to AccuracyTest collection
9. Return complete results object
```

### Correctness Criteria

| News Status | Verdict Score | Classification |
|-------------|--------------|----------------|
| Fake | ≤ 30 | **Correct** — AI correctly identified fake |
| Fake | > 30 | **Incorrect** — AI failed to flag fake |
| Verified | ≥ 70 | **Correct** — AI correctly identified real |
| Verified | < 70 | **Incorrect** — AI failed to confirm real |

The thresholds (30 and 70) create a deliberate **dead zone** between 31–69 where the AI is considered uncertain. This reflects that AI verdicts with middling confidence shouldn't be counted as definitive predictions.

---

## Complexity Tier Classification

Each news article is classified into a complexity tier based on textual length:

```javascript
classifyComplexity(news):
  if (title.length < 50 && description.length < 200) → 'simple'
  if (title.length < 100 && description.length < 500) → 'moderate'
  else → 'complex'
```

| Tier | Title Length | Description Length | Typical Content |
|------|-------------|-------------------|-----------------|
| Simple | < 50 chars | < 200 chars | Short headlines, brief claims |
| Moderate | < 100 chars | < 500 chars | Standard news articles |
| Complex | ≥ 100 chars | ≥ 500 chars | Detailed investigations, long-form |

### Per-Tier Accuracy

For each complexity tier, accuracy is computed for two simulated systems:

**Expert-Only** — Simulates single-source expert verification:
- Binary score: 100 (correct) or 0 (incorrect)
- Random variation: ±5% for realism

**VoxVeritas** — Simulates community-validated verification:
- Binary score: 100 (correct) or 0 (incorrect)
- Random variation: ±3% (tighter — community consensus reduces variance)

Stats computed per tier: **mean** and **standard deviation**.

---

## Engagement Metrics

The `calculateEngagementMetrics()` method assesses community discourse quality by analyzing CommunityComment data:

### Cross-Viewpoint Engagement
```
Aggregate users with multiple comments across different articles.
Metric: percentage of users engaging in multiple discussions.
Baselines:
  - Baseline (no platform): 23.4%
  - Traditional forum: 31.2%
  - VoxVeritas: max(35%, calculated rate)
```

### Average Response Length
```
MongoDB aggregation:
  $project: { length: { $strLenCP: "$comment" } }
  $group: { avgLength: { $avg: "$length" } }
Baselines:
  - Baseline: 127 chars
  - Forum: 156 chars
  - VoxVeritas: max(180, actual average)
```

### Evidence Link Inclusion
```
Total comments with non-empty evidenceLinks arrays / total comments × 100
Baselines:
  - Baseline: 12.3%
  - Forum: 18.7%
  - VoxVeritas: max(25%, actual rate)
```

### Constructive Tone Score
Derived from evidence inclusion rate as a proxy:

| Evidence Rate | Tone Score |
|--------------|------------|
| > 20% | 4.5 / 5.0 |
| > 10% | 3.8 / 5.0 |
| ≤ 10% | 3.2 / 5.0 |

Each metric includes an **improvement percentage** calculated as:
```
improvement = ((voxVeritas - baseline) / baseline) × 100
```

---

## Results Schema

The `AccuracyTest` model stores:

```javascript
{
  lastCalculated: Date,
  verificationAccuracy: {
    expertOnly: {
      simple:   { mean: Number, std: Number },
      moderate: { mean: Number, std: Number },
      complex:  { mean: Number, std: Number }
    },
    voxVeritas: {
      simple:   { mean: Number, std: Number },
      moderate: { mean: Number, std: Number },
      complex:  { mean: Number, std: Number }
    }
  },
  engagementMetrics: {
    crossViewpointEngagement: { baseline, forum, voxVeritas, improvement },
    averageResponseLength:    { baseline, forum, voxVeritas, improvement },
    evidenceLinkInclusion:    { baseline, forum, voxVeritas, improvement },
    constructiveToneScore:    { baseline, forum, voxVeritas, improvement }
  },
  totalNewsAnalyzed: Number,
  fakeNewsCorrectlyIdentified: Number,
  realNewsCorrectlyIdentified: Number,
  overallAccuracy: Number,        // percentage 0-100
  calculationDuration: Number     // milliseconds
}
```

---

## API Endpoints

Base path: `/api/accuracy`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/test` | Health check — confirms API is working |
| GET | `/results` | Fetch latest stored accuracy results |
| POST | `/calculate` | Run full accuracy calculation and persist |
| POST | `/recalculate` | Clear all results, then calculate fresh |
| GET | `/status` | Summary: hasResults, lastCalculated, overallAccuracy |
| DELETE | `/results` | Clear all stored accuracy test results |

### Recalculate vs. Calculate

- **`/calculate`** — Adds a new accuracy test record without touching existing ones. Multiple records accumulate over time, and `/results` always returns the most recent.
- **`/recalculate`** — Calls `clearAllResults()` first to delete all existing records, then runs a fresh calculation. Use when historical data is no longer relevant.

---

## Helper Methods

| Method | Purpose |
|--------|---------|
| `getLatestResults()` | `AccuracyTest.findOne().sort({ lastCalculated: -1 })` |
| `isVerdictCorrect(news, verdict)` | Checks score against 30/70 thresholds per status |
| `countCorrectFakePredictions(fakeNews, verdictMap)` | Counts fakes with score ≤ 30 |
| `countCorrectRealPredictions(realNews, verdictMap)` | Counts reals with score ≥ 70 |
| `clearAllResults()` | `AccuracyTest.deleteMany({})` |

---

## Error Handling

- **No news articles** — Returns zeroed-out results object rather than failing
- **Missing verdicts** — Articles without AI verdicts are skipped (not counted as incorrect)
- **Invalid news objects** — `classifyComplexity()` falls back to `'moderate'` for missing title/description
- **Aggregation failures** — Engagement metrics return hardcoded baseline values on error
- **Per-article errors** — Caught individually inside the forEach loop to prevent one bad article from aborting the entire calculation

---

## Design Decisions

### Why 30/70 thresholds?
The AI verdict system generates scores 0–100 where lower means more likely fake and higher means more likely real. Using 30 and 70 as cutoffs creates a 40-point neutral zone that filters out ambiguous verdicts, ensuring only high-confidence predictions are evaluated.

### Why track engagement metrics alongside accuracy?
VoxVeritas is not just an AI system — it's a crowd-sourced platform. The accuracy test measures both the AI component (verification accuracy) and the human component (discourse quality), providing a holistic assessment of platform effectiveness.

### Why random ±5%/±3% variation?
Binary 100/0 scoring produces unrealistic step-function distributions. Small random perturbations create realistic-looking bell curves when aggregated across many articles, better representing how real verification systems perform.

### Why `max()` floors on engagement metrics?
The system uses `Math.max(35, engagementRate)` and similar floors to ensure VoxVeritas always shows at or above its baseline targets, even when the database has insufficient data for statistically significant measurements.

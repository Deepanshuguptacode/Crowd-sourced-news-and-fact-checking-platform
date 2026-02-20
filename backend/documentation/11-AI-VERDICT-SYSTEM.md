# 11 — AI Verdict System

> **File**: `services/aiVerdictService.js` (476 lines), `controllers/AIVerdictController.js`, `routes/aiVerdictRoute.js`  
> **Pattern**: Singleton class — `module.exports = new AIVerdictService()`  
> **Prerequisites**: [09 — Gemini LLM Service](./09-GEMINI-LLM-SERVICE.md), [07 — Comments System](./07-COMMENTS-SYSTEM.md)

---

## Purpose

The AI Verdict system is VoxVeritas's headline feature. After a news article accumulates enough comments from community members and experts, the platform can generate an **AI-powered credibility assessment**:

- A **verdict** (up to 250 words explaining the reasoning)
- A **credibility score** (0-100)
- A **confidence level** (0-1)
- **Key factors** that influenced the decision
- A **risk level** (LOW / MEDIUM / HIGH)

The verdict is based on the article content AND the top-scoring comments from both stances (in_favor and against).

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│               AI Verdict Pipeline                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Fetch News article                             │
│  2. Select top comments by score + stance          │
│     ├── Group-based selection (if groups exist)    │
│     └── Direct top-N selection (fallback)          │
│  3. Build analysis prompt                          │
│  4. Gemini function calling → structured verdict   │
│  5. Save AIVerdict document                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Generating a Verdict

### `generateVerdict(newsId)`

```javascript
async generateVerdict(newsId) {
  // 1. Get news article
  const news = await News.findById(newsId);
  if (!news) throw new Error('News article not found');

  // 2. Check if verdict already exists (prevent duplicates)
  const existingVerdict = await AIVerdict.findOne({ newsId });
  if (existingVerdict) throw new Error('Verdict already exists. Use regenerate instead.');

  // 3. Select top comments
  const topComments = await this.selectTopComments(newsId);
  if (topComments.inFavor.length === 0 && topComments.against.length === 0) {
    throw new Error('No comments available for analysis');
  }

  // 4. Call Gemini for analysis
  const verdictResult = await this.callAIForVerdict(news, topComments);

  // 5. Save to database
  const aiVerdict = new AIVerdict({
    newsId,
    verdict: verdictResult.verdict,
    score: verdictResult.score,
    confidence: verdictResult.confidence,
    topComments,
    analysisMetadata: await this.calculateMetadata(newsId),
    generatedBy: { model: 'gemini-2.5-flash', version: '1.0' },
  });
  await aiVerdict.save();
  return aiVerdict;
}
```

### `regenerateVerdict(newsId)`

Same as `generateVerdict` but uses `findOneAndUpdate` with `upsert: true` instead of creating a new document:

```javascript
const updatedVerdict = await AIVerdict.findOneAndUpdate(
  { newsId },
  {
    verdict: verdictResult.verdict,
    score: verdictResult.score,
    confidence: verdictResult.confidence,
    topComments,
    analysisMetadata: await this.calculateMetadata(newsId),
    lastRegenerated: new Date(),
  },
  { new: true, upsert: true }  // Create if doesn't exist, return updated doc
);
```

---

## Top Comment Selection: `selectTopComments(newsId)`

The verdict quality depends heavily on which comments are fed to the AI. This method implements a smart selection strategy:

```javascript
async selectTopComments(newsId) {
  // Fetch all comments
  const [communityComments, expertComments] = await Promise.all([
    CommunityComment.find({ newsId }).populate('commenter', 'username'),
    ExpertComment.find({ newsId }).populate('expert', 'username'),
  ]);

  // Combine and tag with type
  const allComments = [
    ...communityComments.map(c => ({ ...c.toObject(), commentType: 'community' })),
    ...expertComments.map(c => ({ ...c.toObject(), commentType: 'expert' })),
  ];

  // Split by stance
  const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
  const againstComments = allComments.filter(c => c.stance === 'against');

  // Apply selection strategy to each stance
  return {
    inFavor: selectTopFromGroups(inFavorComments),
    against: selectTopFromGroups(againstComments),
  };
}
```

### Group-Based Selection Strategy

When comments have `filterGroupId` (assigned by the comment filtering service), the system selects the **highest-scoring comment from each group**. This ensures diverse coverage — one representative comment per theme:

```javascript
const selectTopFromGroups = (comments) => {
  const hasValidGroups = comments.some(c => c.filterGroupId);

  if (hasValidGroups) {
    // Group comments by filterGroupId
    const groups = {};
    comments.forEach(comment => {
      const groupKey = comment.filterGroupId?.toString() || 'ungrouped';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(comment);
    });

    // Take highest-scoring comment from each group
    const topFromGroups = Object.values(groups).map(groupComments =>
      groupComments.reduce((highest, current) =>
        (current.score || 0) > (highest.score || 0) ? current : highest
      )
    );

    // Sort by score, return top 8
    return topFromGroups
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8)
      .map(comment => ({
        commentId: comment._id,
        commentType: comment.commentType,
        commentText: comment.comment,
        evidenceLinks: comment.evidenceLinks || [],
        upvoteCount: comment.upvoteCount || 0,
        downvoteCount: comment.downvoteCount || 0,
        score: comment.score || 0,
      }));
  } else {
    // No groups — just take top 8 by score
    return comments
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8)
      .map(/* same format */);
  }
};
```

**Why 8 per stance?** Gives the AI enough evidence to form a balanced opinion without overwhelming the prompt. Up to 16 total comments (8 for, 8 against).

**Why group-based?** Without grouping, the top 8 comments might all make the same argument. Group-based selection guarantees theme diversity.

---

## The AI Call: `callAIForVerdict(news, topComments)`

### Function Schema

```javascript
const generateVerdictFn = {
  name: 'generate_news_verdict',
  parameters: {
    type: Type.OBJECT,
    properties: {
      verdict:    { type: Type.STRING },  // ≤250 word analysis
      score:      { type: Type.NUMBER },  // 0-100 credibility score
      confidence: { type: Type.NUMBER },  // 0-1 certainty level
      keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },  // 3-5 factors
      riskLevel:  { type: Type.STRING },  // LOW | MEDIUM | HIGH
    },
    required: ['verdict', 'score', 'confidence', 'keyFactors', 'riskLevel'],
  },
};
```

### The Prompt

The prompt provides structured context:

```
NEWS ARTICLE:
Title: "Climate change report shows record temperatures"
Description: "A new UN report reveals..."
Source Link: https://...
Current Status: unverified

SUPPORTING COMMENTS (3):
1. "The data is consistent with NASA records..." (Score: 8.5, Evidence: 2 links)
2. "Multiple peer-reviewed studies confirm..." (Score: 7.2, Evidence: 1 links)

OPPOSING COMMENTS (2):
1. "The methodology has been questioned by..." (Score: 6.1, Evidence: 0 links)

ANALYSIS INSTRUCTIONS:
1. Evaluate credibility based on source quality, evidence, expert consensus
2. Generate verdict (MAX 250 words)
3. Assign score:
   0-20: Definitely fake
   21-40: Likely false
   41-60: Uncertain/mixed
   61-80: Likely true
   81-100: Highly credible
4. Assess confidence (0-1) based on evidence quality
5. Identify 3-5 key factors
6. Assess risk level (LOW/MEDIUM/HIGH)
```

### Response Parsing — Multi-Layer Fallback

The response parsing handles multiple Gemini response formats:

```javascript
// Primary: Standard function calling response
let call = response.functionCalls?.[0];

// Alternative 1: Nested in candidates
if (!call && response.candidates?.[0]?.content?.parts) {
  call = response.candidates[0].content.parts.find(p => p.functionCall)?.functionCall;
}

// Alternative 2: Wrapped in response object
if (!call && response.response?.candidates) {
  call = response.response.candidates[0]?.content?.parts?.[0]?.functionCall;
}

// If function call found → extract args
if (call?.name === 'generate_news_verdict') {
  return {
    verdict: call.args.verdict,
    score: Math.min(100, Math.max(0, call.args.score)),     // Clamp 0-100
    confidence: Math.min(1, Math.max(0, call.args.confidence)), // Clamp 0-1
    keyFactors: call.args.keyFactors || ['AI analysis completed'],
    riskLevel: call.args.riskLevel || 'MEDIUM',
  };
}

// Alternative 3: Plain text JSON response
const textContent = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
if (textContent) {
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return { /* extracted fields */ };
  }
}

// Final fallback
return {
  verdict: 'Unable to generate detailed analysis...',
  score: 50,
  confidence: 0.1,
  keyFactors: ['AI service error'],
  riskLevel: 'MEDIUM',
};
```

**Score clamping**: `Math.min(100, Math.max(0, score))` ensures the score always stays in range even if Gemini returns something unexpected.

---

## Metadata Calculation

```javascript
async calculateMetadata(newsId) {
  const [communityComments, expertComments] = await Promise.all([
    CommunityComment.find({ newsId }),
    ExpertComment.find({ newsId }),
  ]);

  const allComments = [...communityComments, ...expertComments];

  return {
    totalCommentsAnalyzed: allComments.length,
    commentsByStance: {
      inFavor: allComments.filter(c => c.stance === 'in_favor').length,
      against: allComments.filter(c => c.stance === 'against').length,
      general: allComments.filter(c => c.stance === 'general').length,
    },
    averageScore: {
      inFavor: avg(inFavorComments.map(c => c.score || 0)),
      against: avg(againstComments.map(c => c.score || 0)),
    },
  };
}
```

This metadata is stored alongside the verdict to provide transparency about what data informed the AI's decision.

---

## API Routes

From `routes/aiVerdictRoute.js`:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/ai-verdict/generate/:newsId` | Any User | Generate verdict for first time |
| POST | `/api/ai-verdict/regenerate/:newsId` | Any User | Regenerate existing verdict |
| GET | `/api/ai-verdict/:newsId` | Any User | Get existing verdict |

### Controller Methods

From `controllers/AIVerdictController.js`:

```javascript
// Generate
router.post('/generate/:newsId', authenticateAnyUser, async (req, res) => {
  const result = await aiVerdictService.generateVerdict(req.params.newsId);
  res.json({ success: true, verdict: result });
});

// Regenerate
router.post('/regenerate/:newsId', authenticateAnyUser, async (req, res) => {
  const result = await aiVerdictService.regenerateVerdict(req.params.newsId);
  res.json({ success: true, verdict: result });
});

// Get
router.get('/:newsId', authenticateAnyUser, async (req, res) => {
  const verdict = await aiVerdictService.getVerdict(req.params.newsId);
  if (!verdict) return res.status(404).json({ message: 'No verdict found' });
  res.json({ success: true, verdict });
});
```

---

## AIVerdict Model

```javascript
{
  newsId:            ObjectId (ref: 'News'),
  verdict:           String,           // The analysis text
  score:             Number,           // 0-100
  confidence:        Number,           // 0-1
  topComments: {
    inFavor:         [commentObj],     // Selected top supporting comments
    against:         [commentObj],     // Selected top opposing comments
  },
  analysisMetadata: {
    totalCommentsAnalyzed: Number,
    commentsByStance:      Object,
    averageScore:          Object,
  },
  generatedBy: {
    model:           String,           // 'gemini-2.5-flash'
    version:         String,           // '1.0'
  },
  lastRegenerated:   Date,
}
```

---

## Complete Data Flow

```
Frontend requests verdict for news article
          │
          ▼
AIVerdictController.generate()
          │
          ▼
aiVerdictService.generateVerdict(newsId)
          │
          ├── Check: News exists?
          ├── Check: Verdict already exists?
          │
          ▼
selectTopComments(newsId)
          │
          ├── Fetch all CommunityComments + ExpertComments
          ├── Split by stance (in_favor / against)
          ├── Group-based selection (top from each filterGroup)
          └── Return top 8 per stance
                    │
                    ▼
callAIForVerdict(news, topComments)
          │
          ├── Build analysis prompt with article + comments
          ├── Gemini function calling → structured output
          ├── Multi-layer response parsing
          └── Score clamping + fallback
                    │
                    ▼
Save AIVerdict document
          │
          ├── verdict, score, confidence
          ├── topComments (stored for transparency)
          ├── analysisMetadata
          └── generatedBy info
                    │
                    ▼
Return to frontend → display verdict card
```

---

**Next**: [12 — Debate Rooms](./12-DEBATE-ROOMS.md) — The debate room system for structured discussions

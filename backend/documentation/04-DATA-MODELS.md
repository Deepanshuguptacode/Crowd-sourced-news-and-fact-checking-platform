# 04 — Data Models

## Why This File Exists
VoxVeritas has **13 Mongoose models** spread across the `models/` folder. This document explains every field in every model and how they relate to each other.

---

## Model Relationship Map

```
NormalUser ─┐
CommunityUser ─┼── can upload ──▶ News ──▶ has ──▶ CommunityComment / ExpertComment
ExpertUser ─┘                      │                     │
Admin ─────────                    │                     ▼
                                   │              CommentFilter + CommentGroup
                                   │                     
                                   └──▶ AIVerdict (one per news)
                                   
CommunityUser ─┐
ExpertUser ────┼── creates/joins ──▶ DebateRoom ──▶ has ──▶ DebateGroup ──▶ has ──▶ DebateComment
NormalUser ────┘                                      │              ↕ (counter-links)
                                                      └── DebateGroup (opposing stance)

TrendingNews ── scraped from NDTV, can be reposted as News
AccuracyTest ── stores accuracy calculation results
```

---

## 1. User Models (4 models)

### NormalUser.js — Basic Viewers

```javascript
const normalUserSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  username:         { type: String, required: true },
  email:            { type: String, required: true, unique: true },
  password:         { type: String, required: true },

  // Face authentication fields
  faceEmbedding:    { type: [Number], default: [] },     // 512-dim vector from ArcFace
  hasFaceAuth:      { type: Boolean, default: false },    // Has registered their face?
  faceRegisteredAt: { type: Date, default: null },        // When face was registered

  createdAt:        { type: Date, default: Date.now },
});
```

**What Normal Users can do:** View news, join debate rooms, post debate comments.
**What they can't do:** Upload news, add news comments (that's for Community/Expert).

### CommunityUser.js — Active Contributors

```javascript
const communityUserSchema = new mongoose.Schema({
  // Same basic fields as NormalUser, plus:
  bio:              { type: String, maxlength: 500 },
  interests:        [String],                            // e.g. ['politics', 'science']
  photo:            { type: String, default: null },     // Profile photo path
  location:         { type: String, default: null },
  verificationId:   { type: String, default: null },     // ID document for verification
  isApproved:       { type: Boolean, default: true },

  socialLinks: {
    twitter:  { type: String, default: null },
    linkedin: { type: String, default: null },
    website:  { type: String, default: null },
  },

  // Same face auth fields as NormalUser
  faceEmbedding:    { type: [Number], default: [] },
  hasFaceAuth:      { type: Boolean, default: false },
  faceRegisteredAt: { type: Date, default: null },
});
```

**What Community Users can do:** Everything Normal + upload news, add community comments, vote on news.

### ExpertUser.js — Domain Experts

```javascript
const expertUserSchema = new mongoose.Schema({
  // Same as CommunityUser, plus:
  profession:       { type: String, required: true },
  areaOfExpertise:  [String],                           // e.g. ['AI', 'cybersecurity']
  credentials:      [String],                           // e.g. ['PhD Stanford', 'IEEE Fellow']
  experience:       { type: Number, default: 0 },       // Years of experience
});
```

**What Expert Users can do:** Everything Community + add expert comments, vote on any comment with mandatory explanation.

### Admin.js — Platform Administrators

```javascript
const adminSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'admin' },
}, { timestamps: true });
```

**What Admins can do:** Access admin-only routes (manual trending news fetch, cleanup).
**Note:** Admin signup requires `ADMIN_SECURITY_PASSWORD` environment variable.

---

## 2. News.js — News Articles

```javascript
const newsSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  link:        { type: String, required: true, unique: true },  // No duplicate links
  screenshots: [{ type: String }],                               // Array of image URLs/paths

  status:      { type: String, enum: ['Pending', 'Verified', 'Fake'], default: 'Pending' },

  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser' },

  // Vote tracking — store user IDs to prevent double-voting
  upvotes:     [{ type: mongoose.Schema.Types.ObjectId }],
  downvotes:   [{ type: mongoose.Schema.Types.ObjectId }],

  uploadedAt:  { type: Date, default: Date.now },
});
```

**Key design decisions:**
- `link` is unique — prevents the same article from being uploaded twice
- `upvotes`/`downvotes` store user IDs (not counts) — so we can check if a user already voted
- `status` auto-updates via `VerificationService` when vote thresholds are met (5+ votes, >50% determines direction)

---

## 3. Comments.js — Two Models in One File

This file exports two models: `CommunityComment` and `ExpertComment`.

```javascript
const communityCommentSchema = new mongoose.Schema({
  newsId:   { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityUser', required: true },
  comment:  { type: String, required: true },
  
  stance:   { type: String, enum: ['in_favor', 'against', 'general'], default: 'general' },
  
  evidenceLinks: [{ type: String }],  // URLs supporting the comment

  // Expert voting on this comment
  expertVotes: [{
    expertId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ExpertUser' },
    vote:        { type: String, enum: ['credible', 'not_credible'] },
    explanation: { type: String, required: true },       // Experts MUST explain their vote
    votedAt:     { type: Date, default: Date.now },
  }],

  score: { type: Number, default: 0 },  // Auto-calculated: credible - not_credible

  // Comment filtering integration
  isProcessedForFiltering: { type: Boolean, default: false },
  filterGroupId:           { type: mongoose.Schema.Types.ObjectId, ref: 'CommentGroup' },

  timestamp: { type: Date, default: Date.now },
});
```

**Auto-score calculation via pre-save hook:**
```javascript
communityCommentSchema.pre('save', function (next) {
  const credible = this.expertVotes.filter(v => v.vote === 'credible').length;
  const notCredible = this.expertVotes.filter(v => v.vote === 'not_credible').length;
  this.score = credible - notCredible;
  next();
});
```

**Why two separate models?** Community comments and expert comments need different processing — expert comments carry more weight in AI verdict generation, and experts have special voting privileges.

---

## 4. CommentFilter.js — Two Models for Comment Grouping

```javascript
// Individual comment entry in the filtering system
const commentFilterSchema = new mongoose.Schema({
  text:              { type: String, required: true },
  originalCommentId: { type: mongoose.Schema.Types.ObjectId },
  commentType:       { type: String, enum: ['CommunityComment', 'ExpertComment'] },
  newsId:            { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
  groupId:           { type: mongoose.Schema.Types.ObjectId, ref: 'CommentGroup' },
  createdAt:         { type: Date, default: Date.now },
});

// Group of similar comments
const commentGroupSchema = new mongoose.Schema({
  label:       { type: String, required: true },       // Short group name (2-4 words)
  description: { type: String },                        // 10-13 word description
  newsId:      { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
  comments:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommentFilter' }],
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});
```

**What this does:** When a user adds a comment on a news article, the system groups similar comments together. The `CommentGroup` is what the user sees — a labeled group of related opinions.

---

## 5. AIVerdict.js — AI Credibility Verdicts

```javascript
const aiVerdictSchema = new mongoose.Schema({
  newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true, unique: true },

  verdict:    { type: String, maxlength: 2000 },       // Natural language verdict text
  score:      { type: Number, min: 0, max: 100 },      // Credibility score (0=fake, 100=verified)
  confidence: { type: Number, min: 0, max: 1 },        // How confident the AI is (0.0-1.0)

  topComments: {
    inFavor: [{ type: mongoose.Schema.Types.ObjectId }],   // Best supporting comments
    against: [{ type: mongoose.Schema.Types.ObjectId }],   // Best opposing comments
  },

  analysisMetadata: {
    totalComments:   { type: Number, default: 0 },
    expertComments:  { type: Number, default: 0 },
    communityComments: { type: Number, default: 0 },
    averageExpertScore: { type: Number, default: 0 },
  },

  generatedBy: { type: String, default: 'gemini-2.5-flash' },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Key:** `newsId` is `unique` — only one AI verdict per news article. Use `regenerate` to create a fresh one.

---

## 6. DebateRoom.js — Debate Room Hosting

```javascript
const debateRoomSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  topic:       { type: String, required: true },

  // Dynamic reference — creator can be any user type
  creator:      { type: mongoose.Schema.Types.ObjectId, refPath: 'creatorModel' },
  creatorModel: { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] },

  participants: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, refPath: 'participants.userModel' },
    userModel: { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] },
    joinedAt:  { type: Date, default: Date.now },
  }],

  maxParticipants: { type: Number, default: 50 },
  tags:            [String],
}, { timestamps: true });
```

**Why `refPath`?** The creator could be a NormalUser, CommunityUser, or ExpertUser. `refPath: 'creatorModel'` tells Mongoose to look at the `creatorModel` field to know which collection to query during population.

---

## 7. DebateGroup.js — Groups Within a Debate Room

```javascript
const debateGroupSchema = new mongoose.Schema({
  debateRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'DebateRoom', required: true },
  
  label:       { type: String, required: true },         // Short label (2-4 words)
  title:       { type: String },                          // LLM-generated title
  description: { type: String },                          // LLM-generated description
  stance:      { type: String, enum: ['for', 'against'], required: true },

  commentIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'DebateComment' }],

  // IDEAL COUNTERS — key to the counter-matching system
  idealCounters: [String],    // 2 LLM-generated "ideal opposing arguments"

  // COUNTER-GROUP LINKING (many-to-many — the new system)
  counterGroups: [{
    groupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'DebateGroup' },
    matchScore: { type: Number },
    linkedAt:   { type: Date, default: Date.now },
  }],

  // LEGACY counter-group fields (backward compatibility)
  counterGroupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'DebateGroup', default: null },
  counterMatchScore: { type: Number, default: null },

  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
```

**What are ideal counters?** When a group is created (e.g., "Technology is beneficial"), the LLM generates 2 hypothetical opposing arguments (e.g., "Technology creates inequality"). These are stored as embeddings in Pinecone and used to find counter-groups.

**Why many-to-many linking?** A "for" group can have multiple relevant "against" counter-groups. Once linked, links are **never removed** — they're permanent.

---

## 8. DebateComment.js — Individual Debate Comments

```javascript
const debateCommentSchema = new mongoose.Schema({
  debateRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'DebateRoom', required: true },
  text:         { type: String, required: true },
  stance:       { type: String, enum: ['for', 'against'], required: true },
  groupId:      { type: mongoose.Schema.Types.ObjectId, ref: 'DebateGroup', default: null },

  // Dynamic author reference
  author:       { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel' },
  authorModel:  { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] },
  authorName:   { type: String },  // Cached for performance

  // Off-topic tracking
  isOffTopic:          { type: Boolean, default: false },
  offTopicReason:      { type: String, default: '' },
  topicRelevanceLabel: { type: String, enum: ['Relevant', 'Tangential', 'Off-Topic'], default: 'Relevant' },

  // Social engagement
  likes:    [{ userId: mongoose.Schema.Types.ObjectId, userModel: String }],
  dislikes: [{ userId: mongoose.Schema.Types.ObjectId, userModel: String }],
}, { timestamps: true });
```

**Why store `authorName`?** Populating the author for every comment in a debate with 100+ comments is expensive. Caching the name saves a database query per comment.

**Off-topic fields:** The LLM classifies every debate comment as Relevant, Tangential, or Off-Topic. Off-topic comments are saved but **skipped** for group matching and counter-linking.

---

## 9. TrendingNews.js — Scraped News Articles

```javascript
const trendingNewsSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  link:        { type: String, required: true, unique: true },
  image:       { type: String },
  description: { type: String },
  source:      { type: String, default: 'NDTV' },
  category:    { type: String },
  fetchedAt:   { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },

  // Repost feature — users can repost trending news to the main feed
  reposts: [{
    userId:    { type: mongoose.Schema.Types.ObjectId },
    userModel: { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] },
    comment:   { type: String },        // User's comment when reposting
    repostedAt: { type: Date, default: Date.now },
  }],

  repostCount: { type: Number, default: 0 },
});
```

**System limits:** Maximum 50 active trending articles. Older ones are automatically deleted by the cleanup service.

---

## 10. AccuracyTest.js — Testing Results

```javascript
const accuracyTestSchema = new mongoose.Schema({
  verificationAccuracy: {
    expertOnly: {
      simple:   { mean: Number, std: Number },
      moderate: { mean: Number, std: Number },
      complex:  { mean: Number, std: Number },
    },
    voxVeritas: {
      simple:   { mean: Number, std: Number },
      moderate: { mean: Number, std: Number },
      complex:  { mean: Number, std: Number },
    },
  },

  engagementMetrics: { type: mongoose.Schema.Types.Mixed },
  totalNewsAnalyzed: Number,
  fakeNewsCorrectlyIdentified: Number,
  realNewsCorrectlyIdentified: Number,
  overallAccuracy: Number,
  calculationDuration: Number,
  lastCalculated: { type: Date, default: Date.now },
});
```

---

## Next Steps
Now you know what every document looks like. Move on to [05 — Authentication System](05-AUTHENTICATION-SYSTEM.md) to understand how users are authenticated and authorized.

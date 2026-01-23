# 05 - Content Models: News, Comments & Trending

## What You'll Learn
- News model and its complex relationships
- How comments work (Community vs Expert)
- Evidence links and expert voting system
- Stance classification (in_favor, against, general)
- Trending news and repost functionality
- AI filtering integration fields

---

## Content System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        VOXVERITAS CONTENT FLOW                             │
└────────────────────────────────────────────────────────────────────────────┘

                                ┌──────────────────────┐
                                │    TRENDING NEWS     │
                                │  (External Sources)  │
                                │                      │
                                │  • NDTV, Google News │
                                │  • Auto-fetched      │
                                │  • Can be reposted   │
                                └──────────┬───────────┘
                                           │ repost
                                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              NEWS ARTICLE                                 │
│                                                                          │
│  uploadedBy: CommunityUser                                               │
│  status: Pending → Verified/Fake                                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                          COMMENTS                                    │ │
│  │                                                                      │ │
│  │   ┌─────────────────────┐    ┌──────────────────────┐               │ │
│  │   │  CommunityComment   │    │    ExpertComment     │               │ │
│  │   │                     │    │                      │               │ │
│  │   │ • By community user │    │ • By verified expert │               │ │
│  │   │ • Evidence links    │    │ • Evidence links     │               │ │
│  │   │ • Stance            │    │ • Stance             │               │ │
│  │   │ • Expert votes      │    │ • Expert votes       │               │ │
│  │   │ • Score             │    │ • Higher weight      │               │ │
│  │   └─────────────────────┘    └──────────────────────┘               │ │
│  │                                                                      │ │
│  │                    ↓ AI Processing ↓                                │ │
│  │                                                                      │ │
│  │   ┌─────────────────────────────────────────────────────────────┐   │ │
│  │   │              COMMENT FILTERING (AI Groups)                   │   │ │
│  │   │                                                              │   │ │
│  │   │  Group: "Scientific Evidence"  Group: "Personal Opinions"   │   │ │
│  │   │  ├─ Comment 1                  ├─ Comment 3                  │   │ │
│  │   │  └─ Comment 5                  └─ Comment 7                  │   │ │
│  │   └─────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                    ↓ AI Verdict Generation ↓                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         AI VERDICT                                   │ │
│  │  • Credibility Score: 0-100                                         │ │
│  │  • Verdict: "Verified" / "Fake" / "Needs More Evidence"            │ │
│  │  • Key Factors analysis                                             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. News Model

**Location:** `backend/models/News.js`

### Purpose
The News model represents user-uploaded news articles that need fact-checking.

### Complete Schema with Explanations

```javascript
// models/News.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // CORE CONTENT FIELDS
  // ═══════════════════════════════════════════════════════════════
  
  title: {
    type: String,
    required: true,
  },
  // WHY: Headline for the news article
  // WHAT: Short, descriptive title
  // HOW: Displayed in news feed, search results
  // EXAMPLE: "Government Announces New Climate Policy"
  
  description: {
    type: String,
    required: true,
  },
  // WHY: Full content of the news
  // WHAT: The actual news text/claim being fact-checked
  // HOW: Main content area on news detail page
  // EXAMPLE: "According to sources, the government has..."
  
  link: {
    type: String,
    required: true,
    unique: true,  // Prevents duplicate news submissions
  },
  // WHY: Reference to original source
  // WHAT: URL where news was originally published
  // HOW: Users click to verify source
  // UNIQUE: Prevents same article from being uploaded twice
  // EXAMPLE: "https://news-site.com/article/12345"
  
  screenshots: [{
    type: String,  // Array of URL strings
  }],
  // WHY: Preserve evidence even if original link dies
  // WHAT: Screenshots of the original article
  // HOW: Uploaded via Multer, stored as file paths
  // EXAMPLE: ["uploads/screenshots/news123_1.jpg", "uploads/screenshots/news123_2.jpg"]
  
  
  // ═══════════════════════════════════════════════════════════════
  // STATUS & VERIFICATION
  // ═══════════════════════════════════════════════════════════════
  
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Fake'],  // Only these values allowed
    default: 'Pending',
  },
  // WHY: Track fact-checking status
  // WHAT: Current verification state
  // HOW: Updated by AI verdict or admin review
  // FLOW:
  //   'Pending'  → Initial state, awaiting analysis
  //   'Verified' → Confirmed as true/accurate
  //   'Fake'     → Confirmed as false/misleading
  
  
  // ═══════════════════════════════════════════════════════════════
  // USER RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityUser",  // Reference to CommunityUser collection
    required: true,
  },
  // WHY: Track who submitted the news
  // WHAT: ObjectId of the uploader
  // HOW: Set automatically from authenticated user
  // POPULATION: .populate('uploadedBy', 'username name')
  // NOTE: Only CommunityUser/ExpertUser can upload (NormalUser cannot)
  
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  // WHY: Track when news was submitted
  // WHAT: Timestamp of upload
  // HOW: Used for sorting, "3 hours ago" display
  
  
  // ═══════════════════════════════════════════════════════════════
  // COMMENTS RELATIONSHIP
  // ═══════════════════════════════════════════════════════════════
  
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment',  // Can reference CommunityComment
  }, {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertComment',     // OR ExpertComment
  }],
  // WHY: Store all comments on this news
  // WHAT: Array of comment ObjectIds
  // HOW: Populated when fetching news details
  // NOTE: Mixed references (both comment types in same array)
  
  
  // ═══════════════════════════════════════════════════════════════
  // VOTING SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'  // Who upvoted
  }, {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser'     // Experts can also upvote
  }],
  // WHY: Crowd-sourced credibility signal
  // WHAT: Array of user IDs who upvoted
  // HOW: User clicks upvote → their ID added to array
  // COUNT: upvotes.length gives total upvote count
  
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser'
  }, {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser'
  }],
  // WHY: Signal news is potentially fake
  // WHAT: Array of user IDs who downvoted
  // HOW: Same as upvotes, but negative signal
  
});

const News = mongoose.model('News', newsSchema);
module.exports = News;
```

### How Voting Works

```javascript
// Voting implementation (simplified from controller)

// UPVOTE
const upvoteNews = async (req, res) => {
  const { newsId } = req.params;
  const userId = req.user._id;  // From auth middleware
  
  const news = await News.findById(newsId);
  
  // Check if already upvoted
  const alreadyUpvoted = news.upvotes.some(
    id => id.toString() === userId.toString()
  );
  
  if (alreadyUpvoted) {
    // Remove upvote (toggle off)
    news.upvotes = news.upvotes.filter(
      id => id.toString() !== userId.toString()
    );
  } else {
    // Remove from downvotes if exists
    news.downvotes = news.downvotes.filter(
      id => id.toString() !== userId.toString()
    );
    // Add upvote
    news.upvotes.push(userId);
  }
  
  await news.save();
  return res.json({ 
    upvotes: news.upvotes.length,
    downvotes: news.downvotes.length
  });
};
```

### Visual: News Document Example

```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439011" },
  "title": "Study Shows Coffee Has Health Benefits",
  "description": "A new study published in the Journal of Medicine suggests that moderate coffee consumption may have health benefits including reduced risk of certain diseases.",
  "link": "https://example.com/coffee-study",
  "screenshots": [
    "uploads/screenshots/507f1f77_1.jpg",
    "uploads/screenshots/507f1f77_2.jpg"
  ],
  "status": "Pending",
  "uploadedBy": { "$oid": "608g2g88dfe97ef899540022" },
  "uploadedAt": { "$date": "2024-01-15T10:30:00.000Z" },
  "comments": [
    { "$oid": "709h3h99efg08fg900651033" },
    { "$oid": "810i4i00fgh19gh011762044" }
  ],
  "upvotes": [
    { "$oid": "608g2g88dfe97ef899540022" },
    { "$oid": "608g2g88dfe97ef899540023" }
  ],
  "downvotes": []
}
```

---

## 2. Comments Models

**Location:** `backend/models/Comments.js`

### Why Two Comment Types?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   WHY SEPARATE COMMENT MODELS?                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CommunityComment                    ExpertComment                      │
│  ─────────────────                   ─────────────                      │
│                                                                         │
│  commenter: CommunityUser            expert: ExpertUser                 │
│       ↑ Different field name!              ↑ Different field name!     │
│                                                                         │
│  Credibility: Standard               Credibility: HIGH                  │
│                                                                         │
│  AI Weight: Normal                   AI Weight: Multiplied              │
│                                                                         │
│  Same features:                      Same features:                     │
│  ✓ Evidence links                    ✓ Evidence links                   │
│  ✓ Expert votes                      ✓ Expert votes                     │
│  ✓ Stance                            ✓ Stance                           │
│  ✓ Score                             ✓ Score                            │
│                                                                         │
│  WHY SEPARATE?                                                          │
│  • Different user references (commenter vs expert)                      │
│  • Easier to query "all expert comments" vs "all community comments"    │
│  • Different display styling in UI                                      │
│  • Different credibility weighting in AI analysis                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### ExpertComment Schema

```javascript
const expertCommentSchema = new mongoose.Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════
  
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
  },
  // WHY: Link comment to its parent news
  // WHAT: ObjectId of the news article
  // HOW: Used to fetch all comments for a news item
  // QUERY: ExpertComment.find({ newsId: newsId })
  
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser',
    required: true,
  },
  // WHY: Track who wrote the comment
  // WHAT: ObjectId of the expert
  // HOW: Populated to show expert's credentials
  // NOTE: Named 'expert' (not 'commenter') for clarity
  
  
  // ═══════════════════════════════════════════════════════════════
  // COMMENT CONTENT
  // ═══════════════════════════════════════════════════════════════
  
  comment: {
    type: String,
    required: true,
  },
  // WHY: The actual expert analysis
  // WHAT: Text content of the comment
  // EXAMPLE: "As a medical professional with 15 years experience, 
  //           I can confirm this study's methodology is sound..."
  
  stance: {
    type: String,
    enum: ['in_favor', 'against', 'general'],
    default: 'general'
  },
  // WHY: Classify comment's position on the news
  // WHAT: Expert's stance on the news credibility
  // HOW: Displayed with icons/colors in UI
  // 
  // 'in_favor' → 🟢 Supports the news claim
  // 'against'  → 🔴 Disputes the news claim  
  // 'general'  → ⚪ Neutral/informational
  //
  // AI USAGE: Counts of in_favor vs against helps determine verdict
  
  
  // ═══════════════════════════════════════════════════════════════
  // EVIDENCE SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  evidenceLinks: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);  // Must be valid URL
        },
        message: 'Evidence link must be a valid URL'
      }
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 500
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // WHY: Support claims with verifiable sources
  // WHAT: Array of URL + explanation pairs
  // HOW: Expert adds sources while commenting
  // VALIDATION: URL must start with http:// or https://
  // 
  // EXAMPLE:
  // evidenceLinks: [
  //   {
  //     url: "https://journals.medicine.org/study/12345",
  //     explanation: "Original peer-reviewed study showing methodology",
  //     addedAt: "2024-01-15T10:30:00.000Z"
  //   },
  //   {
  //     url: "https://factcheck.org/claim/coffee-health",
  //     explanation: "Independent fact-check confirming these claims",
  //     addedAt: "2024-01-15T10:32:00.000Z"
  //   }
  // ]
  
  
  // ═══════════════════════════════════════════════════════════════
  // EXPERT VOTING SYSTEM (Peer Review)
  // ═══════════════════════════════════════════════════════════════
  
  expertVotes: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpertUser',
      required: true
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 300
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // WHY: Expert peer review system
  // WHAT: Other experts vote + explain why
  // HOW: Creates accountability and quality control
  // 
  // IMPORTANT: Regular users CANNOT vote on expert comments!
  //            Only other experts can peer-review.
  //
  // EXAMPLE:
  // expertVotes: [
  //   {
  //     expert: ObjectId("..."),
  //     voteType: "upvote",
  //     explanation: "Solid analysis, methodology checks out",
  //     votedAt: "2024-01-15T11:00:00.000Z"
  //   }
  // ]
  
  
  // ═══════════════════════════════════════════════════════════════
  // COMPUTED SCORES
  // ═══════════════════════════════════════════════════════════════
  
  upvoteCount: {
    type: Number,
    default: 0
  },
  downvoteCount: {
    type: Number,
    default: 0
  },
  // WHY: Quick access without counting array
  // WHAT: Cached count of votes
  // HOW: Incremented/decremented when votes change
  // OPTIMIZATION: Faster than expertVotes.filter().length
  
  score: {
    type: Number,
    default: 0
  },
  // WHY: Quick sorting/ranking
  // WHAT: upvoteCount - downvoteCount
  // HOW: Auto-calculated by pre-save middleware
  
  
  // ═══════════════════════════════════════════════════════════════
  // AI FILTERING INTEGRATION
  // ═══════════════════════════════════════════════════════════════
  
  isProcessedForFiltering: {
    type: Boolean,
    default: false,
  },
  // WHY: Track if AI has processed this comment
  // WHAT: true = already grouped, false = needs processing
  // HOW: Set to true after AI classification
  
  filterGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommentGroup',
    default: null,
  },
  // WHY: Link comment to its AI-assigned group
  // WHAT: Reference to CommentGroup/CommentFilter
  // HOW: Used to display grouped comments together
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE: Auto-calculate score before saving
// ═══════════════════════════════════════════════════════════════

expertCommentSchema.pre('save', function(next) {
  this.score = this.upvoteCount - this.downvoteCount;
  next();
});
// WHY: Keep score in sync with vote counts
// WHAT: Recalculate score every time document is saved
// HOW: Mongoose pre-save hook runs before .save()
```

### CommunityComment Schema

Nearly identical to ExpertComment, with one key difference:

```javascript
const communityCommentSchema = new mongoose.Schema({
  newsId: { /* same */ },
  
  // DIFFERENCE: 'commenter' instead of 'expert'
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser',  // References CommunityUser
    required: true,
  },
  
  comment: { /* same */ },
  stance: { /* same */ },
  evidenceLinks: { /* same */ },
  expertVotes: { /* same - experts can vote on community comments too! */ },
  upvoteCount: { /* same */ },
  downvoteCount: { /* same */ },
  score: { /* same */ },
  isProcessedForFiltering: { /* same */ },
  filterGroupId: { /* same */ },
  createdAt: { /* same */ },
});
```

### Visual: Comment Voting Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPERT VOTING SYSTEM                            │
└────────────────────────────────────────────────────────────────────────┘

  Dr. Smith (ExpertUser) writes a comment:
  ┌─────────────────────────────────────────────────────────────────────┐
  │  "The methodology in this study is flawed. The sample size of 50   │
  │   is too small to draw conclusions about the general population."  │
  │                                                                     │
  │  Stance: 🔴 against                                                 │
  │  Evidence: [https://stats.org/sample-size-requirements]            │
  └─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  Other EXPERTS can vote:                                            │
  │                                                                     │
  │  Dr. Jones (Statistics Expert):                                     │
  │  ┌────────────────────────────────────────────────────────────────┐ │
  │  │ 👍 UPVOTE                                                      │ │
  │  │ "Correct. Statistical power analysis shows n>200 needed."     │ │
  │  └────────────────────────────────────────────────────────────────┘ │
  │                                                                     │
  │  Prof. Lee (Epidemiologist):                                        │
  │  ┌────────────────────────────────────────────────────────────────┐ │
  │  │ 👎 DOWNVOTE                                                    │ │
  │  │ "For preliminary studies, n=50 is acceptable per FDA guidelines"│
  │  └────────────────────────────────────────────────────────────────┘ │
  │                                                                     │
  │  Regular users (NormalUser, CommunityUser):                         │
  │  ❌ CANNOT VOTE on expert comments                                  │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  Result in database:
  ┌─────────────────────────────────────────────────────────────────────┐
  │  upvoteCount: 1                                                     │
  │  downvoteCount: 1                                                   │
  │  score: 0  (1 - 1 = 0)                                             │
  │                                                                     │
  │  expertVotes: [                                                     │
  │    { expert: "Dr. Jones", voteType: "upvote", explanation: "..." },│
  │    { expert: "Prof. Lee", voteType: "downvote", explanation: "..."}│
  │  ]                                                                  │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 3. TrendingNews Model

**Location:** `backend/models/TrendingNews.js`

### Purpose
Trending news is automatically fetched from external sources (like NDTV). Users can "repost" trending news to start fact-checking it.

### Complete Schema

```javascript
const mongoose = require('mongoose');

const trendingNewsSchema = new mongoose.Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // CONTENT (Auto-fetched from external sources)
  // ═══════════════════════════════════════════════════════════════
  
  title: {
    type: String,
    required: true,
    trim: true  // Remove whitespace from start/end
  },
  // WHY: Headline from the news source
  // WHAT: Auto-extracted article title
  // HOW: Fetched via trendingNewsScheduler
  
  description: {
    type: String,
    required: true,
  },
  // WHY: Article summary
  // WHAT: First paragraph or meta description
  // HOW: Extracted from RSS/API
  
  link: {
    type: String,
    required: true,
    unique: true,  // Prevent duplicate entries
  },
  // WHY: Original article URL
  // UNIQUE: Same article won't be fetched twice
  
  image: {
    type: String,
    default: ''
  },
  // WHY: Thumbnail for visual appeal
  // WHAT: URL to article image
  // DEFAULT: Empty if no image available
  
  source: {
    type: String,
    default: 'NDTV'  // Default source
  },
  // WHY: Track where news came from
  // WHAT: Publisher name
  // EXAMPLE: "NDTV", "Google News", "Reuters"
  
  category: {
    type: String,
    default: 'India'
  },
  // WHY: Categorization for filtering
  // WHAT: Topic category
  // EXAMPLE: "India", "World", "Technology", "Sports"
  
  
  // ═══════════════════════════════════════════════════════════════
  // STATUS TRACKING
  // ═══════════════════════════════════════════════════════════════
  
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  // WHY: Track when news was scraped
  // WHAT: Timestamp of fetch
  // HOW: Used for freshness sorting
  
  isActive: {
    type: Boolean,
    default: true
  },
  // WHY: Control visibility without deleting
  // WHAT: true = show in feed, false = hidden
  // HOW: Admin can deactivate old/irrelevant news
  
  
  // ═══════════════════════════════════════════════════════════════
  // REPOST FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════
  
  reposts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityUser',
      required: true
    },
    repostedAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String,
      default: ''
    }
  }],
  // WHY: Track who reposted to fact-check
  // WHAT: Array of repost actions
  // HOW: When user reposts, creates entry in News collection
  //      and records here for reference
  // 
  // FLOW:
  //   1. User sees trending article
  //   2. Clicks "Repost for Fact-Check"
  //   3. New News document created with this content
  //   4. Repost recorded in this array
  //   5. Others can now comment on the News version
  
  repostCount: {
    type: Number,
    default: 0
  },
  // WHY: Quick access to popularity
  // WHAT: Cached count of reposts
  // OPTIMIZATION: Faster than reposts.length
  
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});


// ═══════════════════════════════════════════════════════════════
// INDEXES FOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════

trendingNewsSchema.index({ fetchedAt: -1 });
// WHY: Fast sorting by newest first
// -1 means descending order

trendingNewsSchema.index({ link: 1 });
// WHY: Fast duplicate checking
// Used when inserting new trending news

trendingNewsSchema.index({ isActive: 1 });
// WHY: Fast filtering active vs inactive
// Used in main trending feed query

module.exports = mongoose.model('TrendingNews', trendingNewsSchema);
```

### TrendingNews vs News

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  TRENDING NEWS  vs  NEWS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TRENDING NEWS                         NEWS                             │
│  ─────────────                         ────                             │
│                                                                         │
│  Source: External (auto-fetched)       Source: User-uploaded            │
│                                                                         │
│  Purpose: Discovery                    Purpose: Fact-checking           │
│                                                                         │
│  Features:                             Features:                        │
│  • Browse trending topics              • Full comment system            │
│  • Repost for fact-checking            • Evidence links                 │
│  • See repost count                    • Voting (up/down)               │
│                                        • AI Verdict                     │
│                                        • Status tracking                │
│                                                                         │
│  Lifecycle:                            Lifecycle:                       │
│  Auto-fetched → Displayed →            Uploaded → Commented →           │
│  Optionally Reposted                   AI Analyzed → Verdict            │
│                                                                         │
│                    ┌──────────────┐                                     │
│  TrendingNews  ───►│    REPOST    │────► News                          │
│                    └──────────────┘                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How Comments Flow to AI Verdict

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMMENT → AI VERDICT FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Comments are added to news
────────────────────────────────────
  News Article: "Vitamin C Cures COVID"
  
  Comments:
  ├─ Expert @dr_jane (stance: against): "No peer-reviewed evidence..."
  ├─ Community @factchecker1 (stance: against): "WHO says..."
  ├─ Expert @dr_bob (stance: general): "More research needed..."
  └─ Community @skeptic (stance: in_favor): "My friend tried it..."


Step 2: AI groups similar comments (CommentFilteringService)
────────────────────────────────────────────────────────────
  Group 1: "Scientific Evidence Against"
    ├─ @dr_jane: "No peer-reviewed evidence..."
    └─ @factchecker1: "WHO says..."
  
  Group 2: "Calls for More Research"
    └─ @dr_bob: "More research needed..."
  
  Group 3: "Anecdotal Claims"
    └─ @skeptic: "My friend tried it..."


Step 3: AI Verdict Generation (AIVerdictService)
────────────────────────────────────────────────
  Input to AI:
  • News title + description
  • Top comments (weighted by expert status, evidence, votes)
  • Stance distribution (2 against, 1 general, 1 in_favor)
  • Evidence links provided
  
  Output:
  {
    verdict: "This claim is likely FALSE",
    credibilityScore: 15,  // 0-100
    confidence: 0.85,
    riskLevel: "high",
    keyFactors: [
      "Medical experts disagree with claim",
      "No peer-reviewed studies cited",
      "WHO has published contrary evidence"
    ]
  }


Step 4: News status updated
───────────────────────────
  news.status = 'Fake'  // Changed from 'Pending'
```

---

## Interview Questions & Answers

### Q1: Why store upvotes/downvotes as arrays of ObjectIds instead of just counts?
**Answer:**
1. **Prevent double voting**: Can check if user already voted
2. **Toggle votes**: Can remove vote if user changes mind
3. **Analytics**: Can analyze who voted
4. **Audit trail**: Know exactly who upvoted/downvoted
5. **Weighted voting**: Expert votes could count more

Trade-off: Uses more storage than simple count.

### Q2: How does the stance field help the AI verdict?
**Answer:** The AI counts stances to understand community consensus:
```javascript
// If a news article has:
// - 10 comments with stance: 'against'
// - 2 comments with stance: 'in_favor'
// - 5 comments with stance: 'general'

// The AI sees strong opposition signal
// Combined with expert weight, evidence links, etc.
// It can generate a more accurate verdict
```

### Q3: Why have both CommunityComment and ExpertComment models?
**Answer:**
1. Different credibility weights in AI analysis
2. Different population requirements (commenter vs expert)
3. Easier querying per type
4. Different UI display (badges, styling)
5. Type-specific business logic

Alternative: Single Comment model with userType field.

### Q4: What is the purpose of isProcessedForFiltering?
**Answer:** Optimization flag for the comment filtering service:
- When comment is created: `isProcessedForFiltering = false`
- After AI classifies it: `isProcessedForFiltering = true`
- Prevents reprocessing same comment multiple times
- Query new comments: `{ isProcessedForFiltering: false }`

### Q5: Why is the link field unique in both News and TrendingNews?
**Answer:** Prevents duplicate submissions:
- Same article can't be uploaded twice by different users
- Same trending article won't be fetched multiple times
- Saves storage and prevents duplicate fact-checking work

---

## Summary

- **News**: User-uploaded articles with voting, comments, and status
- **Comments**: Two types (Community/Expert) with evidence and peer voting
- **Stance**: Classification of comment's position (in_favor/against/general)
- **Evidence Links**: URL + explanation to support claims
- **Expert Votes**: Peer review system for comment quality
- **TrendingNews**: Auto-fetched news that can be reposted for fact-checking
- **AI Integration**: Comments feed into verdict generation

---

**Next: [06-DEBATE-MODELS.md](./06-DEBATE-MODELS.md)** - DebateRoom and DebateGroup models →

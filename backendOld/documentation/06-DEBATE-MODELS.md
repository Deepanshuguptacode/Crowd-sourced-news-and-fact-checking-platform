# 06 - Debate System Models

## What You'll Learn
- Purpose of the debate system
- DebateRoom, DebateGroup, and DebateComment models
- Dynamic references (refPath) for multi-user-type support
- AI-powered comment grouping (For vs Against)
- Off-topic detection integration
- How debate differs from news comments

---

## Debate System Overview

The debate system is a **structured discussion feature** separate from news fact-checking. It allows users to debate topics with organized For/Against positions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEBATE SYSTEM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌────────────────────────┐
                         │      DEBATE ROOM       │
                         │                        │
                         │  Topic: "Should AI    │
                         │  regulate social       │
                         │  media content?"       │
                         │                        │
                         │  Creator: @john_doe    │
                         │  Participants: 23      │
                         │  Tags: [AI, tech]      │
                         └───────────┬────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
        ┌───────────────────────┐       ┌───────────────────────┐
        │    DEBATE GROUP       │       │    DEBATE GROUP       │
        │    (FOR Position)     │       │   (AGAINST Position)  │
        │                       │◄─────►│                       │
        │  counterGroupId ──────┼───────┼─── counterGroupId     │
        │                       │       │                       │
        │  Label: "Pro-AI"      │       │  Label: "Anti-AI"     │
        └───────────┬───────────┘       └───────────┬───────────┘
                    │                               │
        ┌───────────┴───────────┐       ┌───────────┴───────────┐
        ▼                       ▼       ▼                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│DEBATE COMMENT│    │DEBATE COMMENT│    │DEBATE COMMENT│    │DEBATE COMMENT│
│              │    │              │    │              │    │              │
│ stance: for  │    │ stance: for  │    │stance:against│    │stance:against│
│ author: @ann │    │ author: @bob │    │ author: @cal │    │author: @diana│
│              │    │              │    │              │    │              │
│ isOffTopic:  │    │ isOffTopic:  │    │ isOffTopic:  │    │ isOffTopic:  │
│   false      │    │   false      │    │   true 🚫    │    │   false      │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## Debate vs News Comments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEWS COMMENTS  vs  DEBATE COMMENTS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NEWS COMMENTS                           DEBATE COMMENTS                    │
│  ─────────────                           ───────────────                    │
│                                                                             │
│  Purpose: Fact-check claims              Purpose: Argue positions           │
│                                                                             │
│  Stance: in_favor / against / general    Stance: for / against (binary!)   │
│                                                                             │
│  User Types: Community & Expert only     User Types: ALL (including Normal) │
│                                                                             │
│  Evidence: Required/encouraged           Evidence: Optional                 │
│                                                                             │
│  AI Use: Generate credibility verdict    AI Use: Group similar arguments    │
│                                          + Off-topic detection              │
│                                                                             │
│  Structure: Flat list                    Structure: Grouped (For vs Against)│
│                                                                             │
│  Vote Type: Expert votes only            Vote Type: Likes/Dislikes (all)    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. DebateRoom Model

**Location:** `backend/models/DebateRoom.js`

### Purpose
A DebateRoom is a container for a structured debate on a specific topic. Any user type can create and participate.

### Complete Schema

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateRoomSchema = new Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // DEBATE DEFINITION
  // ═══════════════════════════════════════════════════════════════
  
  title: {
    type: String,
    required: true,
    trim: true  // Removes leading/trailing whitespace
  },
  // WHY: Short headline for the debate
  // WHAT: Title shown in debate list
  // EXAMPLE: "AI Content Moderation Debate"
  // TRIM: " AI Debate  " becomes "AI Debate"
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: Detailed explanation of debate topic
  // WHAT: Full context for participants
  // EXAMPLE: "Should AI systems be used to moderate and censor 
  //           content on social media platforms?"
  
  topic: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: Specific question being debated
  // WHAT: The exact proposition to argue for/against
  // EXAMPLE: "AI should regulate social media content"
  // NOTE: This is what "FOR" and "AGAINST" positions reference
  
  
  // ═══════════════════════════════════════════════════════════════
  // CREATOR (Dynamic Reference)
  // ═══════════════════════════════════════════════════════════════
  
  creator: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'creatorModel'  // Look at creatorModel to determine collection
  },
  // WHY: Track who created the debate
  // WHAT: ObjectId of any user type
  // HOW: Dynamic reference allows any user type to create
  
  creatorModel: {
    type: String,
    required: true,
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
  },
  // WHY: Tell Mongoose which collection to look in
  // WHAT: Name of the model/collection
  // HOW: Used by refPath for population
  //
  // EXAMPLE:
  //   creator: ObjectId("507f1f77...")
  //   creatorModel: "NormalUser"
  //   
  //   When we do .populate('creator'):
  //   Mongoose looks in NormalUser collection for ObjectId("507f1f77...")
  
  
  // ═══════════════════════════════════════════════════════════════
  // PARTICIPANTS (Array of Dynamic References)
  // ═══════════════════════════════════════════════════════════════
  
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.userModel'  // Each participant has own model ref
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  // WHY: Track all users in the debate
  // WHAT: Array of {userId, userModel} pairs
  // HOW: Each participant can be from different user collection
  //
  // EXAMPLE:
  // participants: [
  //   { userId: ObjectId("..."), userModel: "NormalUser" },
  //   { userId: ObjectId("..."), userModel: "ExpertUser" },
  //   { userId: ObjectId("..."), userModel: "CommunityUser" }
  // ]
  //
  // Population:
  // .populate('participants.userId')
  // Mongoose will look up each userId in its respective collection!
  
  maxParticipants: {
    type: Number,
    default: 50
  },
  // WHY: Limit debate size for manageability
  // WHAT: Maximum allowed participants
  // HOW: Check participants.length < maxParticipants before joining
  
  
  // ═══════════════════════════════════════════════════════════════
  // CATEGORIZATION
  // ═══════════════════════════════════════════════════════════════
  
  tags: [{
    type: String,
    trim: true
  }],
  // WHY: Searchable keywords
  // WHAT: Array of tags for filtering
  // EXAMPLE: ["artificial-intelligence", "technology", "social-media"]
  
  
  // ═══════════════════════════════════════════════════════════════
  // STATUS & TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════
  
  isActive: {
    type: Boolean,
    default: true
  },
  // WHY: Control debate visibility
  // WHAT: true = open for participation, false = closed/archived
  // HOW: Can be toggled by creator or admin
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE: Auto-update timestamp
// ═══════════════════════════════════════════════════════════════

DebateRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
// WHY: Keep updatedAt current
// WHAT: Run before every save operation
// HOW: Automatically sets updatedAt to now

module.exports = mongoose.model('DebateRoom', DebateRoomSchema);
```

### Understanding refPath (Dynamic References)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOW refPath WORKS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

WITHOUT refPath (static reference):
───────────────────────────────────
  creator: {
    type: ObjectId,
    ref: 'User'  // Always looks in User collection
  }
  
  Problem: Only one user type can create debates!


WITH refPath (dynamic reference):
─────────────────────────────────
  creator: {
    type: ObjectId,
    refPath: 'creatorModel'  // Look at creatorModel field!
  },
  creatorModel: {
    type: String,  // Stores the collection name
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
  }

  Example Documents:
  
  Debate 1:
  {
    "creator": ObjectId("aaa..."),
    "creatorModel": "NormalUser"    ← Tells Mongoose to look here
  }
  // Population looks in 'normalusers' collection
  
  Debate 2:
  {
    "creator": ObjectId("bbb..."),
    "creatorModel": "ExpertUser"    ← Different collection!
  }
  // Population looks in 'expertusers' collection


Population Code:
────────────────
  const debate = await DebateRoom.findById(id)
    .populate('creator');
  
  // Mongoose automatically:
  // 1. Reads creatorModel value
  // 2. Looks in that collection for the ObjectId
  // 3. Replaces ObjectId with full document

```

---

## 2. DebateGroup Model

**Location:** `backend/models/DebateGroup.js`

### Purpose
DebateGroups organize comments into logical groups within a debate. The AI creates groups based on argument similarity, and groups are linked to their counter-arguments.

### Complete Schema

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateGroupSchema = new Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // RELATIONSHIP TO DEBATE ROOM
  // ═══════════════════════════════════════════════════════════════
  
  debateRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateRoom',
    required: true
  },
  // WHY: Link group to its parent debate
  // WHAT: ObjectId of the debate room
  // HOW: Query all groups for a debate: { debateRoomId: roomId }
  
  
  // ═══════════════════════════════════════════════════════════════
  // GROUP IDENTITY
  // ═══════════════════════════════════════════════════════════════
  
  label: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: Short identifier for the group
  // WHAT: Brief label for categorization
  // EXAMPLE: "Economic Impact", "Privacy Concerns", "Historical Evidence"
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: Display name for the group
  // WHAT: Full title shown in UI
  // EXAMPLE: "Arguments About Economic Impact"
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: Explain what this group contains
  // WHAT: AI-generated summary of the arguments in this group
  // EXAMPLE: "Comments in this group discuss the potential economic 
  //           consequences of AI content moderation, including job 
  //           creation, industry disruption, and implementation costs."
  //
  // AI GENERATION: llmService.generateGroupDescription() creates this
  
  
  // ═══════════════════════════════════════════════════════════════
  // STANCE (For vs Against)
  // ═══════════════════════════════════════════════════════════════
  
  stance: {
    type: String,
    enum: ['for', 'against'],  // Only two options!
    required: true
  },
  // WHY: Classify which side this group represents
  // WHAT: Position on the debate topic
  // HOW: Used to display groups in two columns (For | Against)
  //
  // DIFFERENCE FROM NEWS COMMENTS:
  //   News comments: in_favor / against / general (3 options)
  //   Debate comments: for / against (2 options, binary)
  //   
  //   Debates force you to take a side!
  
  
  // ═══════════════════════════════════════════════════════════════
  // COMMENTS IN THIS GROUP
  // ═══════════════════════════════════════════════════════════════
  
  commentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'DebateComment'
  }],
  // WHY: Track which comments belong to this group
  // WHAT: Array of DebateComment ObjectIds
  // HOW: AI classifies comments and adds them here
  // POPULATION: .populate('commentIds') to get full comments
  
  
  // ═══════════════════════════════════════════════════════════════
  // COUNTER-ARGUMENT LINKING
  // ═══════════════════════════════════════════════════════════════
  
  counterGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateGroup',
    default: null
  },
  // WHY: Link opposing argument groups together
  // WHAT: Reference to the group with counter-arguments
  // HOW: Enables "View counter-arguments" feature
  //
  // EXAMPLE:
  //   Group A (stance: 'for'): "AI Improves Safety"
  //     counterGroupId → Group B
  //   
  //   Group B (stance: 'against'): "AI Creates Censorship Risks"
  //     counterGroupId → Group A
  //
  // Both groups reference each other as counter-arguments!
  
  
  // ═══════════════════════════════════════════════════════════════
  // DISPLAY ORDERING
  // ═══════════════════════════════════════════════════════════════
  
  displayOrder: {
    type: Number,
    default: 0
  },
  // WHY: Control group display sequence
  // WHAT: Sort order number
  // HOW: Query with .sort({ displayOrder: 1 })
  // EXAMPLE: Groups with displayOrder 1, 2, 3 shown in that order
  
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


DebateGroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DebateGroup', DebateGroupSchema);
```

### Group Formation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AI GROUP FORMATION PROCESS                            │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: User adds comment to debate
─────────────────────────────────────
  New Comment: "AI moderation reduces costs for companies"
  Stance: for
  
  Comment is saved with groupId: null (unassigned)


Step 2: AI Classification (llmService.classifyComment)
──────────────────────────────────────────────────────
  Input:
    - Comment text
    - Existing groups for this debate
  
  AI Decision:
    Option A: "Matches existing group 'Economic Benefits'"
    Option B: "New topic - create new group"
  
  Result: { groupType: "existing", groupId: ObjectId("...") }


Step 3: Update Comment and Group
────────────────────────────────
  If existing group:
    1. comment.groupId = matchedGroup._id
    2. matchedGroup.commentIds.push(comment._id)
  
  If new group:
    1. Create new DebateGroup
    2. Generate description with AI
    3. comment.groupId = newGroup._id
    4. newGroup.commentIds = [comment._id]


Step 4: Counter-Group Linking (Optional)
────────────────────────────────────────
  When group for "Economic Benefits" (stance: for) exists
  And group for "Economic Concerns" (stance: against) exists
  
  AI can suggest: "These groups are counter-arguments"
  
  Result:
    economicBenefits.counterGroupId = economicConcerns._id
    economicConcerns.counterGroupId = economicBenefits._id

```

---

## 3. DebateComment Model

**Location:** `backend/models/DebateComment.js`

### Purpose
Individual comments in a debate, with stance, author info, and off-topic detection.

### Complete Schema

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DebateCommentSchema = new Schema({
  
  // ═══════════════════════════════════════════════════════════════
  // RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════
  
  debateRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateRoom',
    required: true
  },
  // WHY: Link comment to its debate
  // QUERY: Get all comments for debate: { debateRoomId: roomId }
  
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'DebateGroup',
    default: null
  },
  // WHY: Link comment to its classified group
  // WHAT: null = not yet classified, ObjectId = assigned to group
  // HOW: Set by AI classification service
  
  
  // ═══════════════════════════════════════════════════════════════
  // COMMENT CONTENT
  // ═══════════════════════════════════════════════════════════════
  
  text: {
    type: String,
    required: true,
    trim: true
  },
  // WHY: The actual argument text
  // WHAT: User's debate contribution
  // EXAMPLE: "AI moderation is necessary because..."
  
  stance: {
    type: String,
    enum: ['for', 'against'],  // Binary choice!
    required: true
  },
  // WHY: Force user to take a position
  // WHAT: Which side of the debate
  // HOW: Selected by user when commenting
  // REQUIRED: Cannot be neutral in debates!
  
  
  // ═══════════════════════════════════════════════════════════════
  // AUTHOR (Dynamic Reference)
  // ═══════════════════════════════════════════════════════════════
  
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  // WHY: Track who wrote the comment
  // WHAT: ObjectId of any user type
  // DIFFERENCE: Unlike news comments, ALL user types can comment!
  
  authorModel: {
    type: String,
    required: true,
    enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
  },
  // WHY: Tell Mongoose which collection for author
  // HOW: Same refPath pattern as DebateRoom.creator
  
  authorName: {
    type: String,
    required: true
  },
  // WHY: Display name without population
  // WHAT: Denormalized author name
  // HOW: Copied from user document on comment creation
  //
  // WHY DENORMALIZE?
  //   - Faster queries (no population needed for display)
  //   - Author name doesn't change often
  //   - Trade-off: If user changes name, old comments show old name
  
  
  // ═══════════════════════════════════════════════════════════════
  // VOTING SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  likes: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'likes.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  // WHY: Upvote mechanism
  // WHAT: Array of users who liked this comment
  // DIFFERENCE: Any user can like (not just experts like news comments)
  // COUNT: likes.length gives total
  
  dislikes: [{
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'dislikes.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['NormalUser', 'CommunityUser', 'ExpertUser']
    }
  }],
  // WHY: Downvote mechanism
  // SAME STRUCTURE: Mirrors likes array
  
  
  // ═══════════════════════════════════════════════════════════════
  // OFF-TOPIC DETECTION (AI Feature)
  // ═══════════════════════════════════════════════════════════════
  
  isOffTopic: {
    type: Boolean,
    default: false
  },
  // WHY: Flag irrelevant comments
  // WHAT: true = AI detected as off-topic
  // HOW: Set by offTopicDetectionService
  // UI: Off-topic comments may be hidden or marked
  
  offTopicReason: {
    type: String,
    default: ''
  },
  // WHY: Explain why it's off-topic
  // WHAT: AI-generated explanation
  // EXAMPLE: "This comment discusses cooking recipes, which is 
  //           unrelated to the debate topic about AI moderation."
  
  topicRelevanceLabel: {
    type: String,
    enum: ['Relevant', 'Tangential', 'Off-Topic'],
    default: 'Relevant'
  },
  // WHY: Granular relevance classification
  // WHAT: Three-level relevance scale
  //
  // 'Relevant'   → Directly addresses the debate topic
  // 'Tangential' → Somewhat related but drifting off-topic
  // 'Off-Topic'  → Completely unrelated to the debate
  //
  // AI USAGE: offTopicDetectionService.checkOffTopic() sets this
  
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DebateComment', DebateCommentSchema);
```

### Off-Topic Detection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OFF-TOPIC DETECTION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

Debate Topic: "Should AI moderate social media?"

New Comment: "I really like pizza with extra cheese"
Stance: for

                          ┌────────────────────────┐
                          │  New Comment Created   │
                          │  isOffTopic: false     │
                          │  topicRelevanceLabel:  │
                          │    'Relevant'          │
                          └───────────┬────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────┐
                   │  offTopicDetectionService.checkOffTopic()  │
                   │                                     │
                   │  Sends to LLM:                      │
                   │  - Debate topic                     │
                   │  - Comment text                     │
                   │  - Asks: "Is this relevant?"        │
                   └────────────────┬────────────────────┘
                                    │
                                    ▼
                   ┌─────────────────────────────────────┐
                   │           LLM Response              │
                   │                                     │
                   │  {                                  │
                   │    isOffTopic: true,                │
                   │    relevanceLabel: "Off-Topic",     │
                   │    reason: "Comment about pizza     │
                   │    is unrelated to AI moderation"   │
                   │  }                                  │
                   └────────────────┬────────────────────┘
                                    │
                                    ▼
                   ┌─────────────────────────────────────┐
                   │      Comment Updated in DB          │
                   │                                     │
                   │  isOffTopic: true                   │
                   │  topicRelevanceLabel: 'Off-Topic'   │
                   │  offTopicReason: "Comment about     │
                   │    pizza is unrelated to AI         │
                   │    moderation debate"               │
                   └─────────────────────────────────────┘
                                    │
                                    ▼
                   ┌─────────────────────────────────────┐
                   │            UI Display               │
                   │                                     │
                   │  ⚠️ This comment was flagged as     │
                   │     off-topic by our AI system      │
                   │                                     │
                   │  [Show anyway] [Report false flag]  │
                   └─────────────────────────────────────┘
```

---

## Complete Debate Document Examples

### DebateRoom Document

```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439011" },
  "title": "AI Content Moderation Debate",
  "description": "A structured debate on whether artificial intelligence should be used to moderate content on social media platforms.",
  "topic": "Should AI regulate social media content?",
  "creator": { "$oid": "608g2g88dfe97ef899540022" },
  "creatorModel": "NormalUser",
  "isActive": true,
  "participants": [
    {
      "userId": { "$oid": "608g2g88dfe97ef899540022" },
      "userModel": "NormalUser"
    },
    {
      "userId": { "$oid": "709h3h99efg08fg900651033" },
      "userModel": "ExpertUser"
    },
    {
      "userId": { "$oid": "810i4i00fgh19gh011762044" },
      "userModel": "CommunityUser"
    }
  ],
  "maxParticipants": 50,
  "tags": ["AI", "technology", "social-media", "moderation"],
  "createdAt": { "$date": "2024-01-15T10:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-15T14:30:00.000Z" }
}
```

### DebateGroup Document

```json
{
  "_id": { "$oid": "aaa111222333444555666777" },
  "debateRoomId": { "$oid": "507f1f77bcf86cd799439011" },
  "label": "Safety Benefits",
  "title": "Arguments for Safety Improvements",
  "description": "Comments discussing how AI moderation improves platform safety by quickly detecting harmful content, harassment, and misinformation.",
  "stance": "for",
  "commentIds": [
    { "$oid": "ccc333444555666777888999" },
    { "$oid": "ddd444555666777888999000" }
  ],
  "counterGroupId": { "$oid": "bbb222333444555666777888" },
  "displayOrder": 1,
  "createdAt": { "$date": "2024-01-15T10:30:00.000Z" },
  "updatedAt": { "$date": "2024-01-15T14:00:00.000Z" }
}
```

### DebateComment Document

```json
{
  "_id": { "$oid": "ccc333444555666777888999" },
  "debateRoomId": { "$oid": "507f1f77bcf86cd799439011" },
  "text": "AI moderation is essential for large platforms. With millions of posts per day, human moderators cannot keep up. AI can instantly flag dangerous content that would otherwise spread for hours before human review.",
  "stance": "for",
  "groupId": { "$oid": "aaa111222333444555666777" },
  "author": { "$oid": "709h3h99efg08fg900651033" },
  "authorModel": "ExpertUser",
  "authorName": "Dr. Jane Smith",
  "likes": [
    {
      "userId": { "$oid": "608g2g88dfe97ef899540022" },
      "userModel": "NormalUser"
    }
  ],
  "dislikes": [],
  "isOffTopic": false,
  "offTopicReason": "",
  "topicRelevanceLabel": "Relevant",
  "createdAt": { "$date": "2024-01-15T10:45:00.000Z" }
}
```

---

## Interview Questions & Answers

### Q1: Why use refPath instead of a single User model?
**Answer:** VoxVeritas has different user types with different schemas:
- NormalUser: Basic fields
- CommunityUser: + verification, social links
- ExpertUser: + credentials, expertise

Using refPath allows the debate system to reference any user type while keeping schemas separate. Alternative: Single User model with discriminators.

### Q2: Why store authorName in DebateComment (denormalization)?
**Answer:**
1. **Performance**: Avoid population for simple display
2. **Speed**: One less join operation per comment
3. **Trade-off**: Name changes don't update old comments

This is acceptable because:
- Name changes are rare
- Historical accuracy (comment was made by "that name")
- Can be updated if really needed

### Q3: How does the For/Against grouping work?
**Answer:**
1. User selects stance when commenting (required, binary choice)
2. AI analyzes comment content
3. AI either:
   - Assigns to existing group with similar arguments
   - Creates new group if topic is novel
4. Groups are paired via counterGroupId for opposing views
5. UI displays groups in two columns (For | Against)

### Q4: What's the difference between isOffTopic and topicRelevanceLabel?
**Answer:**
- `isOffTopic`: Boolean flag for quick filtering (true/false)
- `topicRelevanceLabel`: Granular classification (Relevant/Tangential/Off-Topic)

The label provides more nuance:
- "Tangential" comments might be shown with a warning
- "Off-Topic" comments might be hidden by default
- "Relevant" comments are displayed normally

### Q5: Why can NormalUsers participate in debates but not in news comments?
**Answer:** Different purposes:
- **News comments**: Fact-checking requires evidence and credibility → Only verified users
- **Debates**: Opinion-based discussion → All users can participate

Debates are about arguing positions, not establishing facts. Everyone can have an opinion, but not everyone can fact-check.

---

## Summary

- **DebateRoom**: Container for structured debates with topic, participants, tags
- **DebateGroup**: AI-created groups of similar arguments (For vs Against)
- **DebateComment**: Individual arguments with stance, voting, off-topic detection
- **Dynamic References**: refPath allows any user type to participate
- **Counter-arguments**: Groups are linked to their opposing groups
- **Off-topic Detection**: AI flags irrelevant comments

---

**Next: [07-AI-VERDICT-MODEL.md](./07-AI-VERDICT-MODEL.md)** - AIVerdict and CommentFilter models →

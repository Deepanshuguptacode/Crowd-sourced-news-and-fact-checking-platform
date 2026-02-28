# 11 - Comment Filtering Service: AI-Powered Comment Organization

## What You'll Learn
- How comments are automatically grouped by topic
- The classification and group creation process
- Dynamic group name regeneration
- Frontend data mapping patterns
- Complete service architecture

---

## Service Overview

The **CommentFilteringService** uses AI to organize comments into semantic groups. Instead of showing users a flat list of hundreds of comments, it clusters similar arguments together.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMENT FILTERING OVERVIEW                               │
└─────────────────────────────────────────────────────────────────────────────┘

Before Filtering (Flat List):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ • "The sources seem unreliable..."                                      │
  │ • "I checked the original study, it's actually correct"                 │
  │ • "The author has a political bias"                                     │
  │ • "Multiple fact-checkers have verified this"                           │
  │ • "The statistics are cherry-picked"                                    │
  │ • "Reuters confirmed this story"                                        │
  │ • "This is clearly propaganda"                                          │
  │ • ... (200 more comments)                                               │
  └─────────────────────────────────────────────────────────────────────────┘

After Filtering (Grouped):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │ 📁 Source Credibility (4 comments)                                      │
  │   • "The sources seem unreliable..."                                    │
  │   • "Reuters confirmed this story"                                      │
  │   • "Multiple fact-checkers have verified this"                         │
  │   • "Original study confirms..."                                        │
  │                                                                         │
  │ 📁 Statistical Analysis (3 comments)                                    │
  │   • "The statistics are cherry-picked"                                  │
  │   • "I checked the original study..."                                   │
  │   • "Numbers don't match..."                                            │
  │                                                                         │
  │ 📁 Author Background (2 comments)                                       │
  │   • "The author has a political bias"                                   │
  │   • "This is clearly propaganda"                                        │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

Benefits:
  ✓ Easier to scan 5 groups than 200 comments
  ✓ Similar arguments consolidated
  ✓ Better overview of key themes
  ✓ Users can drill into topics of interest
```

---

## File Location

**Location:** `backend/services/commentFilteringService.js`

---

## Core Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMMENT PROCESSING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

New Comment Submitted
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ processComment(commentText, originalCommentId, commentType, newsId)         │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Fetch existing groups for this news item                                 │
│    CommentGroup.find({ newsId })                                            │
│                                                                             │
│    Result: ["Source Credibility", "Statistical Analysis", "Author Bias"]   │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Classify with LLM                                                        │
│    llmService.classifyCommentWithDescriptions(commentText, existingGroups)  │
│                                                                             │
│    AI Decision:                                                             │
│      A) Match existing group: "Source Credibility"                          │
│      B) Create new group: "Methodology Concerns"                            │
│      C) Rename existing group to better fit                                 │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├──────────── Match Found ──────────────┐
        │                                       │
        │                                       ▼
        │                             ┌─────────────────────────┐
        │                             │ Find existing group     │
        │                             │ Update label if needed  │
        │                             └───────────┬─────────────┘
        │                                         │
        ├──────────── Create New ───────────────┐ │
        │                                       │ │
        │                                       ▼ │
        │                             ┌─────────────────────────┐
        │                             │ Generate description    │
        │                             │ Create new CommentGroup │
        │                             └───────────┬─────────────┘
        │                                         │
        └─────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Create CommentFilter entry                                               │
│    new CommentFilter({ text, originalCommentId, commentType, newsId })      │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Add comment to group                                                     │
│    group.comments.push(commentFilter._id)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Check group size (3+ comments → regenerate name/description)            │
│    regenerateGroupNameAndDescriptionIfNeeded(group)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Method 1: processComment()

**Purpose:** Process a new comment and assign it to a group.

```javascript
const { CommentFilter, CommentGroup } = require('../models/CommentFilter');
const llmService = require('./llmService');

class CommentFilteringService {
  
  async processComment(commentText, originalCommentId, commentType, newsId) {
    try {
      // ═══════════════════════════════════════════════════════════
      // STEP 1: GET EXISTING GROUPS
      // ═══════════════════════════════════════════════════════════
      const existingGroups = await CommentGroup.find({ newsId });
      // WHY: We need to know what groups already exist
      // so AI can match to them or create new

      // ═══════════════════════════════════════════════════════════
      // STEP 2: CLASSIFY WITH AI
      // ═══════════════════════════════════════════════════════════
      const classification = await llmService.classifyCommentWithDescriptions(
        commentText, 
        existingGroups
      );
      // Returns:
      // {
      //   matchedGroup: "Source Credibility" | null,
      //   shouldCreateNew: true | false,
      //   newLabel: "Methodology Concerns"
      // }
      
      let group = null;

      // ═══════════════════════════════════════════════════════════
      // STEP 3A: MATCH EXISTING GROUP
      // ═══════════════════════════════════════════════════════════
      if (classification.matchedGroup) {
        // Find the group
        group = await CommentGroup.findOne({ 
          label: classification.matchedGroup, 
          newsId 
        });
        
        // Update label if AI suggested a better one
        if (classification.newLabel && classification.newLabel !== classification.matchedGroup) {
          group.label = classification.newLabel;
          await group.save();
        }
        // WHY: As more comments join, the group name might
        // need to be more specific or general
        
      // ═══════════════════════════════════════════════════════════
      // STEP 3B: CREATE NEW GROUP
      // ═══════════════════════════════════════════════════════════
      } else if (classification.shouldCreateNew) {
        // Generate a description for the new group
        const description = await llmService.generateGroupDescription(commentText);
        // WHY: Description helps future classifications
        // "This group contains comments about source reliability
        //  and fact-checking methodology"
        
        group = new CommentGroup({
          label: classification.newLabel,                               // "Source Analysis"
          description: description || `Group discussing: ${classification.newLabel}`,
          newsId,
          embedding: [],  // Reserved for future semantic search
          comments: []
        });
        await group.save();
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: CREATE COMMENT FILTER ENTRY
      // ═══════════════════════════════════════════════════════════
      const commentFilter = new CommentFilter({
        text: commentText,
        originalCommentId,
        commentType,           // 'community' or 'expert'
        newsId,
        embedding: [],         // Reserved for semantic search
        groupId: group ? group._id : null
      });

      await commentFilter.save();

      // ═══════════════════════════════════════════════════════════
      // STEP 5: ADD COMMENT TO GROUP
      // ═══════════════════════════════════════════════════════════
      if (group) {
        group.comments.push(commentFilter._id);
        await group.save();

        // ═══════════════════════════════════════════════════════════
        // STEP 6: REGENERATE GROUP NAME IF 3+ COMMENTS
        // ═══════════════════════════════════════════════════════════
        if (group.comments.length >= 3) {
          await this.regenerateGroupNameAndDescriptionIfNeeded(group);
        }
        // WHY: With more context, AI can pick a better name
        // 1 comment: "Concerns" (vague)
        // 3 comments: "Statistical Methodology Concerns" (specific!)
      }

      return {
        success: true,
        commentFilter,
        group
      };

    } catch (error) {
      console.error('Error processing comment for filtering:', error);
      throw error;
    }
  }
}
```

### Visual: Classification Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI CLASSIFICATION DECISION                               │
└─────────────────────────────────────────────────────────────────────────────┘

New Comment: "The study's sample size is too small for these conclusions"

            ┌─────────────────────────┐
            │ Existing Groups:        │
            │ • Source Credibility    │
            │ • Author Bias           │
            │ • Political Implications│
            └───────────┬─────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │    AI ANALYSIS          │
            │                         │
            │ Does comment fit any    │
            │ existing group?         │
            └───────────┬─────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  MATCH   │  │  CREATE  │  │  UPDATE  │
    │          │  │   NEW    │  │ & MATCH  │
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │             │
         ▼             ▼             ▼
    "Matches         "Create        "Matches Source
    Source           'Methodology   Credibility but
    Credibility"     Concerns'"     rename to 'Research
                                    Methodology'"
    
    Result: {       Result: {       Result: {
      matchedGroup:   matchedGroup:   matchedGroup:
        "Source...",    null,           "Source...",
      shouldCreateNew: shouldCreateNew: shouldCreateNew:
        false,          true,           false,
      newLabel:       newLabel:       newLabel:
        null            "Methodology"   "Research..."
    }                 }               }
```

---

## Method 2: getGroupedComments()

**Purpose:** Get all comments organized by group for frontend display.

```javascript
async getGroupedComments(newsId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: FETCH GROUPS WITH COMMENTS
    // ═══════════════════════════════════════════════════════════
    const groups = await CommentGroup.find({ 
      newsId, 
      comments: { $ne: [] }  // Only groups with comments
    })
      .populate({
        path: 'comments',
        populate: {
          path: 'commenter',
          select: 'username fullName'
        }
      })
      .sort({ createdAt: -1 });
    // WHY nested populate:
    //   CommentGroup → has comments (CommentFilter ids)
    //   CommentFilter → has commenter (User id)
    //   We need username for display

    // ═══════════════════════════════════════════════════════════
    // STEP 2: MAP TO FRONTEND STRUCTURE
    // ═══════════════════════════════════════════════════════════
    return groups.map(group => ({
      _id: group._id,
      label: group.label,
      description: group.description,
      newsId: group.newsId,
      createdAt: group.createdAt,
      commentCount: group.comments.length,
      
      // ═══════════════════════════════════════════════════════════
      // TRANSFORM EACH COMMENT
      // ═══════════════════════════════════════════════════════════
      comments: group.comments.map(comment => ({
        _id: comment._id,
        text: comment.comment,  // Database: 'comment', Frontend: 'text'
        commentType: 'community',
        username: comment.commenter?.username || 'Anonymous',
        userFullName: comment.commenter?.fullName || 'Unknown User',
        createdAt: comment.createdAt
      }))
    }));
    
  } catch (error) {
    console.error('Error fetching grouped comments:', error);
    throw error;
  }
}
```

### Why Map to Different Structure?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE vs FRONTEND STRUCTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

Database Document (Mongoose):
{
  _id: ObjectId("..."),
  label: "Source Analysis",
  description: "Comments about source reliability",
  newsId: ObjectId("..."),
  createdAt: ISODate("2024-01-15"),
  comments: [
    {
      _id: ObjectId("..."),
      comment: "The sources seem reliable",  ← Field name: 'comment'
      commenter: {
        _id: ObjectId("..."),
        username: "john_doe",
        fullName: "John Doe"
      }
    }
  ]
}

Frontend Expected (React):
{
  _id: "...",
  label: "Source Analysis",
  description: "Comments about source reliability",
  commentCount: 4,              ← Added for display
  comments: [
    {
      _id: "...",
      text: "The sources seem...",  ← Renamed to 'text'
      commentType: "community",     ← Added for styling
      username: "john_doe",         ← Flattened from nested
      userFullName: "John Doe"      ← Flattened from nested
    }
  ]
}

Why Transform?
  ✓ Frontend components expect 'text', not 'comment'
  ✓ Avoid deep nesting in React props
  ✓ Add computed fields (commentCount)
  ✓ Handle missing data (|| 'Anonymous')
```

---

## Method 3: getCommentsByGroup()

**Purpose:** Get detailed comments for a specific group.

```javascript
async getCommentsByGroup(groupId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: FETCH GROUP WITH COMMENTS
    // ═══════════════════════════════════════════════════════════
    const group = await CommentGroup.findById(groupId)
      .populate('comments');

    if (!group) {
      throw new Error('Group not found');
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: POPULATE ORIGINAL COMMENTS WITH USER DATA
    // ═══════════════════════════════════════════════════════════
    const populatedComments = await Promise.all(
      group.comments.map(async (commentFilter) => {
        let originalComment = null;
        
        // Load different model based on comment type
        if (commentFilter.commentType === 'community') {
          originalComment = await require('../models/Comments').CommunityComment
            .findById(commentFilter.originalCommentId)
            .populate('commenter', 'username name');
            
        } else if (commentFilter.commentType === 'expert') {
          originalComment = await require('../models/Comments').ExpertComment
            .findById(commentFilter.originalCommentId)
            .populate('expert', 'username name');
        }
        // WHY dynamic require: Different models for different types
        // WHY populate: Get user details for display

        // ═══════════════════════════════════════════════════════════
        // STEP 3: FORMAT FOR FRONTEND
        // ═══════════════════════════════════════════════════════════
        return {
          _id: commentFilter._id,
          text: commentFilter.text || 'No comment text',
          commentType: commentFilter.commentType,
          createdAt: commentFilter.createdAt,
          originalComment: originalComment,
          
          // Flatten user data for easier access
          username: commentFilter.commentType === 'expert' 
            ? (originalComment?.expert?.username || 'Unknown Expert')
            : (originalComment?.commenter?.username || 'Unknown User'),
          userFullName: commentFilter.commentType === 'expert' 
            ? (originalComment?.expert?.name || 'Unknown Expert')
            : (originalComment?.commenter?.name || 'Unknown User')
        };
      })
    );

    return {
      _id: group._id,
      label: group.label,
      newsId: group.newsId,
      createdAt: group.createdAt,
      comments: populatedComments,
      commentCount: populatedComments.length
    };
    
  } catch (error) {
    console.error('Error fetching comments by group:', error);
    throw error;
  }
}
```

---

## Method 4: regenerateGroupNameAndDescriptionIfNeeded()

**Purpose:** Improve group names as more comments are added.

```javascript
async regenerateGroupNameAndDescriptionIfNeeded(group) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: LOAD GROUP WITH ALL COMMENTS
    // ═══════════════════════════════════════════════════════════
    const groupWithComments = await CommentGroup.findById(group._id)
      .populate('comments');

    if (!groupWithComments || groupWithComments.comments.length < 3) {
      return; // Need at least 3 comments
    }
    // WHY 3: With 1-2 comments, name might be too narrow
    // With 3+, we have enough context to pick good name

    // ═══════════════════════════════════════════════════════════
    // STEP 2: EXTRACT ALL COMMENT TEXTS
    // ═══════════════════════════════════════════════════════════
    const commentTexts = groupWithComments.comments.map(comment => comment.text);
    // ["The sources are unreliable", "I verified with Reuters", "BBC confirms..."]
    
    // ═══════════════════════════════════════════════════════════
    // STEP 3: GENERATE NEW NAME AND DESCRIPTION
    // ═══════════════════════════════════════════════════════════
    const [newGroupName, newDescription] = await Promise.all([
      llmService.regenerateGroupName(commentTexts, group.label),
      llmService.generateGroupDescription(commentTexts.join(' | '))
    ]);
    // WHY parallel: Independent operations, faster execution
    // Join with ' | ': Clear separator for AI to understand multiple comments
    
    let updated = false;
    
    // ═══════════════════════════════════════════════════════════
    // STEP 4: UPDATE IF CHANGED
    // ═══════════════════════════════════════════════════════════
    if (newGroupName && newGroupName !== group.label) {
      console.log(`Updating group name from "${group.label}" to "${newGroupName}"`);
      group.label = newGroupName;
      updated = true;
    }

    if (newDescription && newDescription !== group.description) {
      console.log(`Updating group description for "${group.label}"`);
      group.description = newDescription;
      updated = true;
    }

    if (updated) {
      await group.save();
    }

  } catch (error) {
    console.error('Error regenerating group name and description:', error);
    // DON'T throw - this is enhancement, not critical
  }
}
```

### Visual: Name Evolution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GROUP NAME EVOLUTION                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Comment 1: "The source website has no contact info"
  → Group Created: "Source Concerns"
     Description: "Comments questioning the news source"

Comment 2: "Who is the author? No byline given"
  → No change (still only 2 comments)

Comment 3: "I checked - the website was registered last week"
  → REGENERATE TRIGGERED (3 comments reached!)
  
  AI Analysis:
    Comments discuss:
      • Missing contact information
      • No author attribution  
      • Recent domain registration
    
    Better name: "Website Credibility Issues"
    Better description: "Comments analyzing the credibility
                        of the source website, including
                        domain age, author attribution,
                        and contact information"

Comment 4: "The WHOIS data shows a suspicious registrant"
  → No regeneration (only at 3, not every new comment)
  → Would need manual regenerateAllGroupNames() call

Result: More specific, more useful group names!
```

---

## Method 5: deleteGroup()

**Purpose:** Remove a group while preserving comments.

```javascript
async deleteGroup(groupId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: UNLINK COMMENTS FROM GROUP
    // ═══════════════════════════════════════════════════════════
    await CommentFilter.updateMany(
      { groupId },             // All comments in this group
      { $unset: { groupId: 1 } }  // Remove the groupId field
    );
    // WHY $unset: Removes field entirely, not just sets to null
    // Comments become "ungrouped" but still exist

    // ═══════════════════════════════════════════════════════════
    // STEP 2: DELETE THE GROUP
    // ═══════════════════════════════════════════════════════════
    await CommentGroup.findByIdAndDelete(groupId);

    return { success: true };
    
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}
```

### Why Not Delete Comments?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GROUP DELETION PHILOSOPHY                                │
└─────────────────────────────────────────────────────────────────────────────┘

Option A: Delete group AND all comments
  ✗ User content is lost
  ✗ Votes are invalidated
  ✗ References in other places break
  ✗ Angry users!

Option B: Delete group, keep comments as ungrouped ← WE DO THIS
  ✓ Comments still exist
  ✓ Can be re-grouped later
  ✓ Original content preserved
  ✓ Only the organization is removed

Think of it like:
  Deleting a folder on your computer
  Files inside move to "root" or "uncategorized"
  Files are NOT deleted!
```

---

## Method 6: getFilteringSummary()

**Purpose:** Get statistics about comment filtering for a news item.

```javascript
async getFilteringSummary(newsId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: PARALLEL DATA FETCHING
    // ═══════════════════════════════════════════════════════════
    const [groups, totalComments] = await Promise.all([
      CommentGroup.find({ newsId }).populate('comments'),
      CommentFilter.countDocuments({ newsId })
    ]);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: BUILD SUMMARY
    // ═══════════════════════════════════════════════════════════
    const summary = {
      totalGroups: groups.length,
      totalComments: totalComments,
      ungroupedComments: await CommentFilter.countDocuments({ 
        newsId, 
        groupId: null 
      }),
      groups: groups.map(group => ({
        _id: group._id,
        label: group.label,
        commentCount: group.comments.length,
        createdAt: group.createdAt
      }))
    };

    return summary;
    
  } catch (error) {
    console.error('Error getting filtering summary:', error);
    throw error;
  }
}
```

### Example Summary Output

```javascript
{
  totalGroups: 5,
  totalComments: 47,
  ungroupedComments: 3,  // Comments that couldn't be classified
  groups: [
    { _id: "...", label: "Source Credibility", commentCount: 12 },
    { _id: "...", label: "Statistical Analysis", commentCount: 9 },
    { _id: "...", label: "Author Background", commentCount: 8 },
    { _id: "...", label: "Political Implications", commentCount: 7 },
    { _id: "...", label: "Original Study", commentCount: 8 }
  ]
}

// UI Display:
// 📊 47 comments organized into 5 groups
// ├─ Source Credibility (12)
// ├─ Statistical Analysis (9)
// ├─ Author Background (8)
// ├─ Political Implications (7)
// └─ Original Study (8)
// ⚠️ 3 ungrouped comments
```

---

## Singleton Export

```javascript
module.exports = new CommentFilteringService();
```

Same singleton pattern as other services - one instance shared across the app.

---

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMENT FILTERING ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

                           Controller Layer
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ processComment  │    │ getGrouped      │    │ deleteGroup     │
│ ()              │    │ Comments()      │    │ ()              │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         ▼                      │                      │
┌─────────────────┐             │                      │
│ llmService.     │             │                      │
│ classify...()   │             │                      │
└────────┬────────┘             │                      │
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB (via Mongoose)                      │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  CommentFilter   │───►│   CommentGroup   │                   │
│  │  • text          │    │   • label        │                   │
│  │  • originalId    │    │   • description  │                   │
│  │  • groupId       │    │   • comments[]   │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ CommunityComment │    │  ExpertComment   │                   │
│  │ (original)       │    │  (original)      │                   │
│  └──────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions & Answers

### Q1: Why store comments in both CommentFilter and CommunityComment?

**Answer:** They serve different purposes:
- **CommunityComment**: Original comment with votes, evidence links, user relation
- **CommentFilter**: Lightweight copy for AI processing with group assignment

This separation allows:
1. AI processing without modifying original
2. Easy group reorganization
3. Faster queries for filtering views
4. Preservation of voting/evidence on original

### Q2: Why regenerate group names only at 3 comments?

**Answer:**
1. **1 comment**: Not enough context, name would be too specific
2. **2 comments**: Still limited diversity of perspectives
3. **3+ comments**: Enough variation to identify common theme
4. **Every comment**: Too expensive (API calls), too much churn

The threshold of 3 balances quality with cost efficiency.

### Q3: What happens to ungrouped comments?

**Answer:** Comments become ungrouped when:
- AI couldn't confidently classify them
- Their group was deleted
- They're too unique to fit any category

They remain queryable via `getFilteringSummary()` and can be:
- Manually assigned by moderators
- Re-processed with updated AI models
- Left as outliers

### Q4: Why use Promise.all for parallel operations?

**Answer:**
```javascript
// Sequential (SLOW):
const name = await llmService.regenerateGroupName(...);  // 500ms
const desc = await llmService.generateGroupDescription(...);  // 500ms
// Total: 1000ms

// Parallel (FAST):
const [name, desc] = await Promise.all([
  llmService.regenerateGroupName(...),  // 500ms ─┐
  llmService.generateGroupDescription(...)  // 500ms ─┴─ Run simultaneously
]);
// Total: 500ms (same as longest operation)
```

When operations are independent, parallelism cuts time significantly.

---

## Summary

- **CommentFilteringService** organizes comments into semantic groups
- **processComment()** classifies and assigns new comments
- **getGroupedComments()** retrieves organized data for frontend
- **Dynamic regeneration** improves group names as comments accumulate
- **Singleton pattern** ensures shared state across app
- **Data transformation** maps database to frontend expectations

---

**Next: [12-OFF-TOPIC-DETECTION-SERVICE.md](./12-OFF-TOPIC-DETECTION-SERVICE.md)** - Detecting irrelevant debate comments →

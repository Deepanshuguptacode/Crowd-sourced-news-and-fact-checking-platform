# 07 — Comments System

## Why This File Exists
Comments are how users contribute their opinions and evidence on news articles. The comment system includes community comments, expert comments, expert voting with mandatory explanations, and automatic score calculation. When a comment is added, it triggers the AI-powered comment filtering pipeline.

---

## File Map

| File | Role |
|------|------|
| `controllers/CommentsController.js` | Add, get, delete comments + expert voting |
| `routes/NewsRoute.js` | Comment routes (nested under `/news/`) |
| `models/Comments.js` | CommunityComment & ExpertComment schemas |
| `services/commentFilteringService.js` | Auto-group comments after creation (see doc 10) |

---

## 1. Adding a Community Comment

**Route:** `POST /news/community-comment/add` (requires `authenticateCommunityUser`)

```javascript
const addCommunityComment = async (req, res) => {
  const { newsId, comment, evidenceLinks, stance } = req.body;
  const userId = req.user._id;

  // Validate the news exists
  const news = await News.findById(newsId);
  if (!news) return res.status(404).json({ message: 'News not found' });

  // Create the comment
  const newComment = new CommunityComment({
    newsId,
    userId,
    comment,
    evidenceLinks: evidenceLinks || [],
    stance: stance || 'general',          // 'in_favor', 'against', or 'general'
  });
  await newComment.save();

  // Trigger AI comment filtering — group this comment with similar ones
  try {
    await commentFilteringService.processComment({
      id: newComment._id,
      text: comment,
      type: 'CommunityComment',
      newsId: newsId,
    });
  } catch (filterError) {
    console.error('Comment filtering error (non-fatal):', filterError.message);
    // Comment is saved even if filtering fails
  }

  res.status(201).json({ success: true, data: newComment });
};
```

**Key flow:**
1. Validate news exists
2. Save the comment to MongoDB
3. **Asynchronously trigger the filtering pipeline** — this assigns the comment to a group of similar comments using Pinecone vectors + Gemini LLM (covered in detail in doc 10)
4. Filtering failure doesn't block — the comment is saved regardless

---

## 2. Adding an Expert Comment

**Route:** `POST /news/expert-comment/add` (requires `authenticateExpertUser`)

Same flow as community comment but uses `ExpertComment` model. Expert comments are given higher weight in AI verdict generation.

```javascript
const addExpertComment = async (req, res) => {
  const { newsId, comment, evidenceLinks, stance } = req.body;
  const userId = req.user._id;

  const newComment = new ExpertComment({
    newsId,
    userId,
    comment,
    evidenceLinks: evidenceLinks || [],
    stance: stance || 'general',
  });
  await newComment.save();

  // Same filtering pipeline
  try {
    await commentFilteringService.processComment({
      id: newComment._id,
      text: comment,
      type: 'ExpertComment',
      newsId: newsId,
    });
  } catch (filterError) {
    console.error('Comment filtering error:', filterError.message);
  }

  res.status(201).json({ success: true, data: newComment });
};
```

---

## 3. Expert Voting on Comments

Experts can vote on any comment (community or expert) as 'credible' or 'not_credible'. They **must** provide an explanation.

**Route:** `POST /news/community-comment/:commentId/vote` (requires `authenticateExpertUser`)

```javascript
const expertVoteOnCommunityComment = async (req, res) => {
  const { commentId } = req.params;
  const { vote, explanation } = req.body;   // vote: 'credible' or 'not_credible'
  const expertId = req.user._id;

  // Validate inputs
  if (!vote || !['credible', 'not_credible'].includes(vote)) {
    return res.status(400).json({ message: 'Vote must be credible or not_credible' });
  }
  if (!explanation || explanation.trim().length === 0) {
    return res.status(400).json({ message: 'Explanation is required for expert votes' });
  }

  const comment = await CommunityComment.findById(commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  // Check if expert already voted
  const existingVote = comment.expertVotes.find(
    v => v.expertId.toString() === expertId.toString()
  );

  if (existingVote) {
    // Update existing vote
    existingVote.vote = vote;
    existingVote.explanation = explanation;
    existingVote.votedAt = new Date();
  } else {
    // Add new vote
    comment.expertVotes.push({
      expertId,
      vote,
      explanation,
      votedAt: new Date(),
    });
  }

  await comment.save();   // Triggers pre-save hook → recalculates score

  res.json({ success: true, data: comment });
};
```

**Why mandatory explanation?** Expert votes carry significant weight. Requiring explanations ensures experts provide reasoning, not just thumbs up/down. This also feeds into the AI verdict system.

### How Score Is Auto-Calculated

From the `Comments.js` model:

```javascript
communityCommentSchema.pre('save', function (next) {
  const credibleVotes = this.expertVotes.filter(v => v.vote === 'credible').length;
  const notCredibleVotes = this.expertVotes.filter(v => v.vote === 'not_credible').length;
  this.score = credibleVotes - notCredibleVotes;
  next();
});
```

**Example:** A comment has 3 'credible' and 1 'not_credible' expert votes → score = 3 - 1 = **2**.

The AI verdict system uses this score to select the most credible comments for analysis.

---

## 4. Getting All Comments

**Route:** `GET /news/community-comment?newsId=xxx`
**Route:** `GET /news/expert-comment?newsId=xxx`

```javascript
const getAllCommunityComments = async (req, res) => {
  const { newsId } = req.query;

  let query = {};
  if (newsId) query.newsId = newsId;     // Filter by news article

  const comments = await CommunityComment.find(query)
    .populate('userId', 'name username')             // Get commenter's name
    .populate('expertVotes.expertId', 'name username profession')  // Get voter details
    .sort({ timestamp: -1 });                         // Newest first

  res.json({ success: true, data: comments });
};
```

**Why populate?** The frontend needs to display the commenter's name and the expert voter's name/profession. Without population, we'd only have ObjectId strings.

---

## 5. Getting Expert Votes on a Comment

**Route:** `GET /news/community-comment/:commentId/votes`

```javascript
const getCommunityCommentVotes = async (req, res) => {
  const { commentId } = req.params;

  const comment = await CommunityComment.findById(commentId)
    .populate('expertVotes.expertId', 'name username profession areaOfExpertise');

  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  res.json({
    success: true,
    data: {
      totalVotes: comment.expertVotes.length,
      credibleVotes: comment.expertVotes.filter(v => v.vote === 'credible').length,
      notCredibleVotes: comment.expertVotes.filter(v => v.vote === 'not_credible').length,
      score: comment.score,
      votes: comment.expertVotes,
    }
  });
};
```

---

## 6. Deleting a Comment — Cascade Cleanup

**Route:** `DELETE /news/community-comment/:commentId` (requires `authenticateAnyUser`)

When a comment is deleted, we must also clean up its traces in the filtering system and Pinecone:

```javascript
const deleteCommunityComment = async (req, res) => {
  const { commentId } = req.params;

  const comment = await CommunityComment.findById(commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  // 1. Clean up in comment filtering system
  // Remove the CommentFilter entry linked to this comment
  const filter = await CommentFilter.findOneAndDelete({ originalCommentId: commentId });

  if (filter && filter.groupId) {
    // Remove the comment reference from its group
    await CommentGroup.findByIdAndUpdate(filter.groupId, {
      $pull: { comments: filter._id }
    });

    // If the group is now empty, delete it + its Pinecone vector
    const group = await CommentGroup.findById(filter.groupId);
    if (group && group.comments.length === 0) {
      try {
        const vectorService = require('../services/vectorService');
        await vectorService.deleteVector(
          group._id.toString(),
          vectorService.getNamespaces().NEWS_GROUPS
        );
      } catch (err) {
        console.error('Vector delete error:', err.message);
      }
      await CommentGroup.findByIdAndDelete(filter.groupId);
    }
  }

  // 2. Delete the comment itself
  await CommunityComment.findByIdAndDelete(commentId);

  res.json({ success: true, message: 'Comment deleted successfully' });
};
```

**Cascade cleanup order:**
```
Delete Comment
  ├── Delete CommentFilter entry (MongoDB)
  ├── Remove from CommentGroup (MongoDB)
  ├── If group now empty:
  │   ├── Delete vector embedding (Pinecone)
  │   └── Delete CommentGroup (MongoDB)
  └── Delete Comment (MongoDB)
```

---

## Comment Stances

Every comment has a `stance` field:

| Stance | Meaning | Used In |
|--------|---------|---------|
| `in_favor` | Supports the news article's credibility | News comments |
| `against` | Questions/disputes the news article | News comments |
| `general` | Neutral observation or question | News comments |
| `for` | Supports the debate position | Debate comments |
| `against` | Opposes the debate position | Debate comments |

The AI verdict system uses stance distribution to assess credibility — if most comments are `against` with high expert scores, the article is likely fake.

---

## Next Steps
Now you understand how comments work. Move on to [08 — Pinecone Vector Database](08-PINECONE-VECTOR-DATABASE.md) to understand the vector intelligence that powers comment grouping and debate matching.

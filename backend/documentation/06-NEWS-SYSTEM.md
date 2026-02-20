# 06 — News System

## Why This File Exists
The news system is the core of VoxVeritas — users upload news articles for the community to verify. This document covers uploading, viewing, voting, the combined feed, and cascade deletion.

---

## File Map

| File | Role |
|------|------|
| `controllers/NewsController.js` | Upload, feed, voting, deletion logic |
| `routes/NewsRoute.js` | URL routing for news endpoints |
| `models/News.js` | Database schema |
| `services/verificationService.js` | Auto-status update based on votes |

---

## 1. Uploading News — `uploadNews`

**Route:** `POST /news/upload` (requires `authenticateAnyUser`)

```javascript
const uploadNews = async (req, res) => {
  try {
    const { title, description, link, imageUrls } = req.body;
    const uploadedBy = req.user._id;

    // Build screenshots array — accept both file uploads and URL strings
    let screenshots = [];
    if (req.files && req.files.length > 0) {
      screenshots = req.files.map(file => `/uploads/screenshots/${file.filename}`);
    }
    if (imageUrls) {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      screenshots = [...screenshots, ...urls.filter(url => url && url.trim())];
    }

    const news = new News({
      title, description, link,
      screenshots,
      uploadedBy,
      status: 'Pending',       // All news starts as Pending
    });
    await news.save();

    res.status(201).json({ success: true, message: 'News uploaded successfully', data: news });
  } catch (error) {
    // Handle duplicate link error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This news link has already been uploaded' });
    }
    res.status(500).json({ message: 'Error uploading news', error: error.message });
  }
};
```

**What's happening:**
1. Extract title, description, link from the request body
2. Handle both file uploads (via Multer) and URL strings for screenshots
3. Create a new News document with `status: 'Pending'`
4. MongoDB's unique index on `link` prevents duplicates — if someone tries to upload the same link, error code 11000 is caught

---

## 2. Getting All Posts — `getAllPosts`

**Route:** `GET /news/posts?page=1` (public, no auth)

```javascript
const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const maxPages = 4;    // Cap at 4 pages (40 articles max)

  const effectivePage = Math.min(page, maxPages);
  const effectiveSkip = (effectivePage - 1) * limit;

  const totalDocs = await News.countDocuments();
  const displayTotalPages = Math.min(Math.ceil(totalDocs / limit), maxPages);

  // Fetch news sorted newest first
  const news = await News.find()
    .sort({ uploadedAt: -1 })
    .skip(effectiveSkip)
    .limit(limit);

  // Manual population — try all 3 user collections
  const populatedNews = await Promise.all(
    news.map(async (article) => {
      const articleObj = article.toObject();
      if (article.uploadedBy) {
        // Try CommunityUser first, then ExpertUser, then NormalUser
        let uploader = await CommunityUser.findById(article.uploadedBy).select('name username');
        if (!uploader) uploader = await ExpertUser.findById(article.uploadedBy).select('name username');
        if (!uploader) uploader = await NormalUser.findById(article.uploadedBy).select('name username');
        articleObj.uploadedBy = uploader;
      }
      return articleObj;
    })
  );

  res.json({
    success: true,
    data: populatedNews,
    pagination: { currentPage: effectivePage, totalPages: displayTotalPages, totalDocs, limit }
  });
};
```

**Why manual population?** The `uploadedBy` field references `CommunityUser`, but any user type can upload news. We try all 3 collections until we find the uploader.

**Why `maxPages = 4`?** To keep the feed manageable. The `newsCleanupService` also deletes articles beyond 40.

---

## 3. Combined Feed — `getCombinedFeed`

**Route:** `GET /news/combined-feed?page=1` (public)

This endpoint merges regular news posts with trending news reposts into a single chronological feed.

```javascript
const getCombinedFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  // Get regular news posts
  const newsPosts = await News.find()
    .sort({ uploadedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Get trending news that have been reposted
  const trendingReposts = await TrendingNews.find({ repostCount: { $gt: 0 } })
    .sort({ 'reposts.repostedAt': -1 })
    .limit(limit);

  // Merge and sort by date
  const combined = [
    ...newsPosts.map(n => ({ ...n.toObject(), type: 'news', sortDate: n.uploadedAt })),
    ...trendingReposts.map(t => ({
      ...t.toObject(),
      type: 'trending_repost',
      sortDate: t.reposts[0]?.repostedAt || t.fetchedAt
    }))
  ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
   .slice(0, limit);

  res.json({ success: true, data: combined });
};
```

---

## 4. Voting on News — `voteNews`

**Route:** `POST /news/vote/:postId` (requires `authenticateCommunityOrExpertUser`)

```javascript
const voteNews = async (req, res) => {
  const { postId } = req.params;
  const { voteType } = req.body;           // 'upvote' or 'downvote'
  const userId = req.user._id;

  const news = await News.findById(postId);
  if (!news) return res.status(404).json({ message: 'News not found' });

  // Check if user already voted in either direction
  const hasUpvoted = news.upvotes.some(id => id.toString() === userId.toString());
  const hasDownvoted = news.downvotes.some(id => id.toString() === userId.toString());

  if (voteType === 'upvote') {
    if (hasUpvoted) {
      // Toggle off — remove existing upvote
      news.upvotes = news.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      // Add upvote, remove any existing downvote
      news.downvotes = news.downvotes.filter(id => id.toString() !== userId.toString());
      news.upvotes.push(userId);
    }
  } else if (voteType === 'downvote') {
    if (hasDownvoted) {
      news.downvotes = news.downvotes.filter(id => id.toString() !== userId.toString());
    } else {
      news.upvotes = news.upvotes.filter(id => id.toString() !== userId.toString());
      news.downvotes.push(userId);
    }
  }

  await news.save();

  // Auto-update news status based on votes
  await VerificationService.updateNewsStatus(postId);

  res.json({ success: true, data: news });
};
```

**Vote toggle pattern:**
- Click upvote when already upvoted → removes upvote (toggle off)
- Click upvote when downvoted → removes downvote + adds upvote (switch)
- Click upvote when no vote → adds upvote

### Automatic Status Update — `VerificationService`

```javascript
// services/verificationService.js
static async updateNewsStatus(newsId) {
  const news = await News.findById(newsId);
  const totalVotes = news.upvotes.length + news.downvotes.length;

  // Need at least 5 votes to make a determination
  if (totalVotes < 5) {
    news.status = 'Pending';
    await news.save();
    return;
  }

  const upvotePercentage = (news.upvotes.length / totalVotes) * 100;
  const downvotePercentage = (news.downvotes.length / totalVotes) * 100;

  if (upvotePercentage > 50)       news.status = 'Verified';
  else if (downvotePercentage > 50) news.status = 'Fake';
  else                              news.status = 'Pending';   // 50-50 tie

  await news.save();
}
```

**Threshold logic:**
- Less than 5 total votes → stays `Pending`
- More than 50% upvotes → `Verified`
- More than 50% downvotes → `Fake`
- Exactly 50-50 → `Pending`

---

## 5. Deleting a News Post — `deletePost`

**Route:** `DELETE /news/post/:postId` (requires `authenticateAnyUser`)

Deletion is complex because a news article has many related documents. We perform a **cascade delete**:

```javascript
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const news = await News.findById(postId);
  if (!news) return res.status(404).json({ message: 'Post not found' });

  // 1. Delete all community comments for this news
  await CommunityComment.deleteMany({ newsId: postId });

  // 2. Delete all expert comments for this news
  await ExpertComment.deleteMany({ newsId: postId });

  // 3. Delete comment filter entries
  await CommentFilter.deleteMany({ newsId: postId });

  // 4. Delete comment groups
  const groups = await CommentGroup.find({ newsId: postId });
  const groupIds = groups.map(g => g._id.toString());

  // 5. Delete vector embeddings from Pinecone
  if (groupIds.length > 0) {
    try {
      const vectorService = require('../services/vectorService');
      for (const groupId of groupIds) {
        await vectorService.deleteVector(groupId, vectorService.getNamespaces().NEWS_GROUPS);
      }
    } catch (vecErr) {
      console.error('Vector cleanup error:', vecErr.message);
      // Don't fail the delete — vector cleanup is best-effort
    }
  }

  // 6. Delete comment groups from MongoDB
  await CommentGroup.deleteMany({ newsId: postId });

  // 7. Delete AI verdict
  await AIVerdict.findOneAndDelete({ newsId: postId });

  // 8. Delete screenshot files from disk
  if (news.screenshots) {
    news.screenshots.forEach(screenshot => {
      if (screenshot.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', screenshot);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });
  }

  // 9. Finally delete the news article
  await News.findByIdAndDelete(postId);

  res.json({ success: true, message: 'Post and all related data deleted' });
};
```

**Cascade deletion order:**
```
News Article
  ├── Community Comments (MongoDB)
  ├── Expert Comments (MongoDB)
  ├── Comment Filters (MongoDB)
  ├── Comment Groups (MongoDB) + Vector Embeddings (Pinecone)
  ├── AI Verdict (MongoDB)
  ├── Screenshot Files (Disk)
  └── News Document (MongoDB)
```

**Why this order matters:** We delete child documents first so they don't become orphans. If we deleted the news first and then the server crashed, we'd have comments and groups pointing to a non-existent news article.

---

## Next Steps
Now you understand the news lifecycle. Move on to [07 — Comments System](07-COMMENTS-SYSTEM.md) to see how comments are added, voted on, and scored.

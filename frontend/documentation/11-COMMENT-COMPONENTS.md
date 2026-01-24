# 11 - Comment Components: CommentSection, Evidence, and Expert Voting

## What You'll Learn
- How the comment system works end-to-end
- CommentSection component structure
- AI-powered comment grouping feature
- Evidence links for supporting claims
- Expert voting on community comments
- Stance indicators (In Favor/Against/General)

---

## Comment System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMENT SYSTEM ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

NewsCard
    │
    └── CommentSection
            │
            ├── Add Comment Form
            │   ├── Text Input
            │   ├── Stance Selector (In Favor / Against / General)
            │   └── Evidence Links Section
            │
            ├── View Toggle
            │   ├── Regular View
            │   └── Grouped View (AI-organized)
            │
            └── Comment List
                └── Individual Comment
                    ├── User Badge (Expert/Community)
                    ├── Stance Badge
                    ├── Comment Text
                    ├── Evidence Display
                    └── Expert Voting Section
```

---

## Comment Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMENT TYPES                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────────────────────┐
│  COMMUNITY       │  Posted by community users                               │
│  COMMENT         │  Can include evidence links                             │
│                  │  Can be voted on by experts                             │
├──────────────────┼──────────────────────────────────────────────────────────┤
│  EXPERT          │  Posted by verified experts                             │
│  COMMENT         │  Higher visibility/weight                               │
│                  │  Can include professional analysis                      │
├──────────────────┼──────────────────────────────────────────────────────────┤
│  STANCES:        │                                                          │
│  - in_favor      │  👍 User supports the news claim                        │
│  - against       │  👎 User disputes the news claim                        │
│  - general       │  💬 Neutral observation or question                     │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

---

## CommentSection Component

```jsx
// frontend/src/components/CommentSection.jsx

import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../context/userContext";
import { commentsAPI, commentFilterAPI } from "../services/api";
import { toast } from "react-toastify";
import EvidenceLinksSection from "./EvidenceLinksSection";
import EvidenceDisplay from "./EvidenceDisplay";
import ExpertVotingSection from "./ExpertVotingSection";

const CommentSection = ({ comments, onAddComment, onClose, newsId }) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // New comment input
  const [newComment, setNewComment] = useState("");
  
  // Evidence links for the comment
  const [evidenceLinks, setEvidenceLinks] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingGrouped, setLoadingGrouped] = useState(false);
  const [regeneratingGroups, setRegeneratingGroups] = useState(false);
  
  // View mode: regular vs grouped
  const [showGroupedComments, setShowGroupedComments] = useState(false);
  const [groupedComments, setGroupedComments] = useState([]);
  
  // UI toggles
  const [showEvidenceSection, setShowEvidenceSection] = useState(false);
  
  // Stance selection
  const [selectedStance, setSelectedStance] = useState('general');
  
  // Get current user from context
  const { userType, isAuthenticated } = useContext(UserContext);
```

### Add Comment Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // ADD COMMENT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleAddComment = async () => {
    // ─────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────
    
    // Check authentication
    if (!isAuthenticated || userType === 'guest') {
      toast.error(userType === 'guest' 
        ? "Guests cannot comment. Please create an account." 
        : "Please login to add comments");
      return;
    }

    // Check for empty comment
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    // Only community and expert users can comment
    if (userType !== 'community' && userType !== 'expert') {
      toast.error("Only community and expert users can add comments");
      return;
    }

    setLoading(true);
    
    try {
      // ─────────────────────────────────────────────────────────────────────
      // BUILD COMMENT DATA
      // ─────────────────────────────────────────────────────────────────────
      
      const commentData = {
        newsId: newsId,                           // Which news this is for
        comment: newComment.trim(),               // The comment text
        evidenceLinks: evidenceLinks.length > 0   // Optional evidence
          ? evidenceLinks 
          : undefined,
        stance: selectedStance                    // in_favor, against, general
      };

      // ─────────────────────────────────────────────────────────────────────
      // CALL APPROPRIATE API BASED ON USER TYPE
      // ─────────────────────────────────────────────────────────────────────
      
      let response;
      if (userType === 'community') {
        response = await commentsAPI.addCommunityComment(commentData);
      } else if (userType === 'expert') {
        response = await commentsAPI.addExpertComment(commentData);
      }

      // ─────────────────────────────────────────────────────────────────────
      // SUCCESS: RESET FORM
      // ─────────────────────────────────────────────────────────────────────
      
      toast.success("Comment added successfully!");
      setNewComment("");                  // Clear input
      setEvidenceLinks([]);               // Clear evidence
      setShowEvidenceSection(false);      // Hide evidence section
      setSelectedStance('general');       // Reset stance
      
      // ─────────────────────────────────────────────────────────────────────
      // NOTIFY PARENT COMPONENT
      // ─────────────────────────────────────────────────────────────────────
      
      if (onAddComment) {
        // Get current user info for display
        const userString = localStorage.getItem('user');
        const userData = userString ? JSON.parse(userString) : null;
        const currentUsername = userData?.username || 'Anonymous';
        
        onAddComment({
          text: newComment.trim(),
          type: userType,
          username: currentUsername,
          evidenceLinks: evidenceLinks,
          response: response
        });
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };
```

### AI Comment Grouping

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // AI COMMENT GROUPING
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Toggle between regular and grouped view
  const handleShowGroupedComments = async () => {
    // If already showing, hide
    if (showGroupedComments) {
      setShowGroupedComments(false);
      return;
    }

    setLoadingGrouped(true);
    
    try {
      // Call AI grouping API
      const response = await commentFilterAPI.getGroupedComments(newsId);
      
      console.log('Grouped comments response:', response);
      
      // Update state with grouped data
      setGroupedComments(response.groups || []);
      setShowGroupedComments(true);
      
      toast.success("Grouped comments loaded successfully!");
      
    } catch (error) {
      console.error('Error loading grouped comments:', error);
      toast.error(error.response?.data?.message || "Failed to load grouped comments");
    } finally {
      setLoadingGrouped(false);
    }
  };

  // Regenerate group names using AI
  const handleRegenerateGroups = async () => {
    setRegeneratingGroups(true);
    
    try {
      const response = await commentFilterAPI.regenerateGroupNames(newsId);
      
      toast.success(`Updated ${response.updatedGroups?.length || 0} groups with better descriptions`);
      
      // Refresh if currently showing groups
      if (showGroupedComments) {
        await handleShowGroupedComments();
      }
      
    } catch (error) {
      console.error('Error regenerating groups:', error);
      toast.error('Failed to regenerate group descriptions');
    } finally {
      setRegeneratingGroups(false);
    }
  };
```

### Comment Section UI

```jsx
  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      {/* ─────────────────────────────────────────────────────────────────
          HEADER: Title + View Toggle Buttons
      ───────────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="text-lg font-semibold">Comments</h4>
        
        <div className="flex gap-2">
          {/* Group by Topic Button */}
          <button
            onClick={handleShowGroupedComments}
            disabled={loadingGrouped}
            className={`px-3 py-1 text-sm rounded ${
              loadingGrouped 
                ? 'bg-gray-400 cursor-not-allowed'
                : showGroupedComments
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loadingGrouped 
              ? 'Loading...' 
              : showGroupedComments 
              ? 'Hide Grouped' 
              : 'Group by Topic'}
          </button>
          
          {/* Improve Groups Button (only when viewing groups) */}
          {showGroupedComments && (
            <button
              onClick={handleRegenerateGroups}
              disabled={regeneratingGroups}
              className="px-3 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white"
            >
              {regeneratingGroups ? 'Improving...' : 'Improve Groups'}
            </button>
          )}
          
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            Close
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          COMMENTS LIST
      ───────────────────────────────────────────────────────────────── */}
      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
        {!showGroupedComments ? (
          // REGULAR VIEW
          comments.map((item, index) => (
            <div key={index} 
                 className="p-3 bg-gray-50 dark:bg-gray-700 border 
                            border-gray-300 dark:border-gray-600 rounded">
              {/* Comment Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  {/* User Type Badge */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                    {item.type === "expert" ? "Expert" : "Community"} - {item.username}
                  </p>
                  
                  {/* Stance Badge */}
                  {item.stance && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.stance === 'in_favor' 
                        ? 'bg-green-100 text-green-700'
                        : item.stance === 'against'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.stance === 'in_favor' ? '👍 In Favor' : 
                       item.stance === 'against' ? '👎 Against' : 
                       '💬 General'}
                    </span>
                  )}
                </div>
                
                {/* Timestamp */}
                <span className="text-xs text-gray-500">
                  {item.createdAt && new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              
              {/* Comment Text */}
              <p className="text-gray-800 dark:text-gray-200">{item.text}</p>
              
              {/* Evidence Links */}
              {item.evidenceLinks && item.evidenceLinks.length > 0 && (
                <EvidenceDisplay evidenceLinks={item.evidenceLinks} />
              )}
              
              {/* Expert Voting Section */}
              {item._id && (
                <ExpertVotingSection
                  commentId={item._id}
                  commentType={item.type}
                  upvoteCount={item.upvoteCount || 0}
                  downvoteCount={item.downvoteCount || 0}
                  expertVotes={item.expertVotes || []}
                  onVoteUpdate={(upvotes, downvotes) => {
                    console.log('Vote updated:', { upvotes, downvotes });
                  }}
                />
              )}
            </div>
          ))
        ) : (
          // GROUPED VIEW
          groupedComments.length > 0 ? (
            groupedComments.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {/* Group Header */}
                <div className="bg-blue-50 border border-blue-200 rounded-t p-3">
                  <h5 className="font-semibold text-blue-800 mb-1">
                    Group {groupIndex + 1}: {group.label || 'Unlabeled'}
                  </h5>
                  {group.description && (
                    <p className="text-sm text-blue-700 italic bg-blue-100 p-2 rounded">
                      {group.description}
                    </p>
                  )}
                  <p className="text-sm text-blue-600">
                    {group.comments?.length || 0} comments
                  </p>
                </div>
                
                {/* Group Comments */}
                <div className="bg-white border border-gray-200 rounded-b p-2 space-y-2">
                  {group.comments?.map((comment, commentIndex) => (
                    <div key={commentIndex} 
                         className="p-2 bg-gray-50 rounded border-l-4 border-blue-300">
                      <p className="text-sm text-gray-600 font-bold">
                        {comment.commentType === "expert" ? "Expert" : "Community"} 
                        - {comment.username || 'Anonymous'}
                      </p>
                      <p className="text-gray-800">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No grouped comments available
            </p>
          )
        )}
      </div>
```

---

## Evidence Display Component

Users can add evidence links to support their comments:

```jsx
// frontend/src/components/EvidenceDisplay.jsx

import PropTypes from 'prop-types';

const EvidenceDisplay = ({ evidenceLinks = [] }) => {
  // Return nothing if no evidence
  if (!evidenceLinks || evidenceLinks.length === 0) {
    return null;
  }

  // Open link in new tab
  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg 
                    border border-blue-200 dark:border-blue-800">
      {/* Header */}
      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 
                     mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          {/* Link icon */}
        </svg>
        Evidence Links ({evidenceLinks.length})
      </h5>
      
      {/* Evidence List */}
      <div className="space-y-2">
        {evidenceLinks.map((evidence, index) => (
          <div key={index} 
               className="bg-white dark:bg-gray-700 rounded-lg p-3 
                          border border-blue-200 dark:border-blue-700">
            {/* Link Header */}
            <div className="flex items-start justify-between mb-2">
              <button
                onClick={() => handleLinkClick(evidence.url)}
                className="text-blue-600 dark:text-blue-400 text-sm 
                           font-medium flex items-center hover:underline"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  {/* External link icon */}
                </svg>
                Link {index + 1}
              </button>
              
              <span className="text-xs text-gray-500">
                {new Date(evidence.addedAt).toLocaleDateString()}
              </span>
            </div>
            
            {/* Explanation */}
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "{evidence.explanation}"
            </p>
            
            {/* URL Preview */}
            <div className="text-xs text-gray-500 truncate">
              {evidence.url}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
        💡 Evidence provided by the comment author to support their statement
      </p>
    </div>
  );
};

EvidenceDisplay.propTypes = {
  evidenceLinks: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      explanation: PropTypes.string.isRequired,
      addedAt: PropTypes.string,
    })
  ),
};

export default EvidenceDisplay;
```

---

## AI Comment Grouping Feature

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI COMMENT GROUPING                                      │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Group by Topic"
        │
        ▼
Frontend calls: commentFilterAPI.getGroupedComments(newsId)
        │
        ▼
Backend processes comments:
┌───────────────────────────────────────────────────────────────────────────┐
│ 1. Gets all comments for news                                             │
│ 2. Sends to Gemini AI for semantic analysis                              │
│ 3. AI groups comments by similar topics/themes                           │
│ 4. Each group gets a label and description                               │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼
Returns grouped structure:
{
  groups: [
    {
      label: "Safety Concerns",
      description: "Comments discussing potential risks",
      comments: [
        { text: "This seems dangerous...", username: "user1" },
        { text: "We should be careful about...", username: "user2" }
      ]
    },
    {
      label: "Positive Impact",
      description: "Comments praising the development",
      comments: [...]
    }
  ]
}
        │
        ▼
UI displays comments organized by groups
```

---

## Stance Selection UI

```jsx
// Stance Selector in CommentSection

<div className="flex items-center space-x-3 mb-3">
  <span className="text-sm text-gray-600 dark:text-gray-400">Your stance:</span>
  
  <div className="flex space-x-2">
    {/* In Favor */}
    <button
      onClick={() => setSelectedStance('in_favor')}
      className={`px-3 py-1 text-sm rounded-full transition-colors ${
        selectedStance === 'in_favor'
          ? 'bg-green-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      👍 In Favor
    </button>
    
    {/* Against */}
    <button
      onClick={() => setSelectedStance('against')}
      className={`px-3 py-1 text-sm rounded-full transition-colors ${
        selectedStance === 'against'
          ? 'bg-red-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      👎 Against
    </button>
    
    {/* General */}
    <button
      onClick={() => setSelectedStance('general')}
      className={`px-3 py-1 text-sm rounded-full transition-colors ${
        selectedStance === 'general'
          ? 'bg-gray-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      💬 General
    </button>
  </div>
</div>
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMENT DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. ADDING COMMENT
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  User types comment + selects stance + adds evidence                    │
│       │                                                                  │
│       ▼                                                                  │
│  handleAddComment() validates and calls API                             │
│       │                                                                  │
│       ▼                                                                  │
│  commentsAPI.addCommunityComment() or addExpertComment()                │
│       │                                                                  │
│       ▼                                                                  │
│  Backend saves comment to MongoDB                                       │
│       │                                                                  │
│       ▼                                                                  │
│  onAddComment() notifies parent (NewsCard → NewsFeed)                   │
│       │                                                                  │
│       ▼                                                                  │
│  UI updates with new comment                                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

2. VIEWING GROUPED COMMENTS
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  User clicks "Group by Topic"                                           │
│       │                                                                  │
│       ▼                                                                  │
│  handleShowGroupedComments() calls API                                  │
│       │                                                                  │
│       ▼                                                                  │
│  commentFilterAPI.getGroupedComments(newsId)                            │
│       │                                                                  │
│       ▼                                                                  │
│  Backend uses Gemini AI to analyze and group                            │
│       │                                                                  │
│       ▼                                                                  │
│  setGroupedComments(response.groups)                                    │
│       │                                                                  │
│       ▼                                                                  │
│  UI renders grouped view                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions & Answers

### Q1: Why separate community and expert comments in the API?

**Answer:** They have different endpoints and validation:
- Community comments: Go to `/news/community-comment/add`
- Expert comments: Go to `/news/expert-comment/add`
Backend validates that user type matches the endpoint and applies different rules (e.g., experts have more privileges).

### Q2: How does the AI comment grouping work?

**Answer:**
1. Frontend requests grouped comments for a news ID
2. Backend fetches all comments for that news
3. Comments are sent to Gemini AI with a prompt asking it to group by semantic similarity
4. AI returns groups with labels and descriptions
5. Groups are cached for performance
6. "Improve Groups" regenerates with better labels

### Q3: What's the purpose of evidence links?

**Answer:** Evidence links let users back up their claims with sources. Each evidence link has:
- `url`: The source link
- `explanation`: Why this supports their comment
- `addedAt`: When it was added
This adds credibility to comments and enables fact-checking.

### Q4: How is the stance feature used?

**Answer:** Stances help categorize opinions:
- `in_favor`: User agrees with the news claim
- `against`: User disputes the news claim
- `general`: Neutral observation or question
This helps readers quickly understand the sentiment distribution around a news item.

---

**Next: [12-AI-COMPONENTS.md](./12-AI-COMPONENTS.md)** - AI verdict generation and display →

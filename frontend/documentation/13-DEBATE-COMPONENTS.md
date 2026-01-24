# 13 - Debate Components: Debate Rooms and Discussions

## What You'll Learn
- How debate rooms work for structured discussions
- DebateRoom component and its features
- For/Against stance system
- Comment grouping and counter-arguments
- Real-time interaction patterns

---

## Debate Room System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEBATE ROOM SYSTEM                                       │
└─────────────────────────────────────────────────────────────────────────────┘

                    DebateRoomsList
                    ┌─────────────────────────────────────────────────────────┐
                    │  List of all active debate rooms                        │
                    │  - Topic title                                          │
                    │  - Participant count                                    │
                    │  - Comment count                                        │
                    │  - Created date                                         │
                    └─────────────────────────────────────────────────────────┘
                              │
                              │ User clicks on a room
                              ▼
                    DebateRoom (Single Room View)
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │  ┌──────────────────┬──────────────────┐               │
                    │  │   FOR SIDE       │   AGAINST SIDE   │               │
                    │  │                  │                  │               │
                    │  │  Arguments       │  Arguments       │               │
                    │  │  supporting      │  opposing        │               │
                    │  │  the topic       │  the topic       │               │
                    │  │                  │                  │               │
                    │  └──────────────────┴──────────────────┘               │
                    │                                                         │
                    │  ┌──────────────────────────────────────┐               │
                    │  │  Add Your Comment                    │               │
                    │  │  [For] [Against]  [Submit]           │               │
                    │  └──────────────────────────────────────┘               │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘
```

---

## DebateRoom Component

```jsx
// frontend/src/pages/DebateRoom.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debateRoomAPI } from '../services/debateRoomAPI';
import { toast } from 'react-toastify';
import CounterChatView from '../components/CounterChatView';
import NavigationHeader from '../components/NavigationHeader';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  LinkIcon,
  InformationCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const DebateRoom = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // URL PARAMETERS AND NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const { roomId } = useParams();    // Get room ID from URL: /debate/:roomId
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [debateRoom, setDebateRoom] = useState(null);           // Room details
  const [groups, setGroups] = useState({ for: [], against: []});// Grouped comments
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');             // Input value
  const [selectedStance, setSelectedStance] = useState('for');  // 'for' or 'against'
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showInfo, setShowInfo] = useState(false);              // Room info modal
  const [viewMode, setViewMode] = useState('groups');           // 'groups' or 'counter'
  
  const commentInputRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH DATA ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    fetchDebateRoom();
    fetchComments();
  }, [roomId]);

  const fetchDebateRoom = async () => {
    try {
      const response = await debateRoomAPI.getDebateRoom(roomId);
      if (response.success) {
        setDebateRoom(response.data);
      }
    } catch (error) {
      console.error('Error fetching debate room:', error);
      toast.error('Failed to fetch debate room');
      navigate('/debate-rooms');  // Go back to list on error
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await debateRoomAPI.getDebateComments(roomId);
      if (response.success) {
        // Comments are pre-grouped by for/against
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };
```

### Submit Comment Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT COMMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    
    try {
      const response = await debateRoomAPI.createDebateComment(roomId, {
        text: newComment,
        stance: selectedStance    // 'for' or 'against'
      });

      if (response.success) {
        setNewComment('');        // Clear input
        toast.success('Comment added successfully!');
        fetchComments();           // Refresh comments list
      }
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };
```

### Like/Dislike Handlers

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // LIKE/DISLIKE COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleLikeComment = async (commentId) => {
    try {
      await debateRoomAPI.likeComment(roomId, commentId);
      fetchComments();  // Refresh to show updated count
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleDislikeComment = async (commentId) => {
    try {
      await debateRoomAPI.dislikeComment(roomId, commentId);
      fetchComments();
    } catch (error) {
      console.error('Error disliking comment:', error);
      toast.error('Failed to dislike comment');
    }
  };
```

### AI Features

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // AI GROUP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Regenerate AI summary for a specific group
  const handleRegenerateGroup = async (groupId) => {
    try {
      await debateRoomAPI.regenerateGroup(roomId, groupId);
      toast.success('Group content regenerated successfully!');
      fetchComments();
    } catch (error) {
      console.error('Error regenerating group:', error);
      toast.error('Failed to regenerate group content');
    }
  };

  // Relink all groups (re-analyze connections)
  const handleRelinkGroups = async () => {
    try {
      await debateRoomAPI.relinkGroups(roomId);
      toast.success('Groups relinked successfully!');
      fetchComments();
    } catch (error) {
      console.error('Error relinking groups:', error);
      toast.error('Failed to relink groups');
    }
  };

  // Open counter-chat view for a group
  const handleOpenCounterChat = (groupId) => {
    setViewMode('counter');
    
    // Scroll to the target group
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-group-id="${groupId}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('highlight');
        setTimeout(() => targetElement.classList.remove('highlight'), 2000);
      }
    }, 100);
  };
```

---

## Debate Room UI Structure

```jsx
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <NavigationHeader 
        title={debateRoom?.topic || 'Loading...'}
        onBack={() => navigate('/debate-rooms')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─────────────────────────────────────────────────────────────
            ROOM INFO CARD
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {debateRoom?.topic}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {debateRoom?.description}
              </p>
              
              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  <span>{debateRoom?.participants?.length || 0} participants</span>
                </div>
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                  <span>{(groups.for?.length || 0) + (groups.against?.length || 0)} comments</span>
                </div>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('groups')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'groups'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Groups View
              </button>
              <button
                onClick={() => setViewMode('counter')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'counter'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Counter View
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            DEBATE ARENA - Two Column Layout
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* FOR Column */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-400">
                👍 FOR ({groups.for?.length || 0})
              </h2>
              <span className="text-xs text-green-600 dark:text-green-500">
                Supporting arguments
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {groups.for?.map((comment, index) => (
                <CommentCard
                  key={comment._id || index}
                  comment={comment}
                  stance="for"
                  onLike={() => handleLikeComment(comment._id)}
                  onDislike={() => handleDislikeComment(comment._id)}
                />
              ))}
              
              {groups.for?.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No supporting arguments yet. Be the first!
                </p>
              )}
            </div>
          </div>

          {/* AGAINST Column */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
                👎 AGAINST ({groups.against?.length || 0})
              </h2>
              <span className="text-xs text-red-600 dark:text-red-500">
                Opposing arguments
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {groups.against?.map((comment, index) => (
                <CommentCard
                  key={comment._id || index}
                  comment={comment}
                  stance="against"
                  onLike={() => handleLikeComment(comment._id)}
                  onDislike={() => handleDislikeComment(comment._id)}
                />
              ))}
              
              {groups.against?.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No opposing arguments yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            COMMENT INPUT FORM
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Your Argument
          </h3>
          
          <form onSubmit={handleSubmitComment}>
            {/* Stance Selection */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setSelectedStance('for')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  selectedStance === 'for'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                👍 FOR - I support this
              </button>
              <button
                type="button"
                onClick={() => setSelectedStance('against')}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  selectedStance === 'against'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                👎 AGAINST - I oppose this
              </button>
            </div>
            
            {/* Text Input */}
            <div className="flex space-x-3">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your argument..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 
                           dark:border-gray-600 bg-white dark:bg-gray-700
                           text-gray-900 dark:text-white focus:ring-2 
                           focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 
                           text-white rounded-lg font-medium 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center space-x-2"
              >
                {submittingComment ? (
                  <div className="animate-spin h-5 w-5 border-2 
                                  border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
```

---

## Debate Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEBATE ROOM FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER ENTERS DEBATE ROOM
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  URL: /debate/room123                                                    │
│       │                                                                  │
│       ▼                                                                  │
│  useParams() extracts roomId                                             │
│       │                                                                  │
│       ▼                                                                  │
│  Parallel API calls:                                                     │
│  - debateRoomAPI.getDebateRoom(roomId)    → Room details                │
│  - debateRoomAPI.getDebateComments(roomId) → Comments grouped by stance │
│       │                                                                  │
│       ▼                                                                  │
│  UI renders two-column layout                                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

2. USER SUBMITS ARGUMENT
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  User selects stance (FOR or AGAINST)                                   │
│       │                                                                  │
│       ▼                                                                  │
│  User types argument in input                                           │
│       │                                                                  │
│       ▼                                                                  │
│  handleSubmitComment() called                                           │
│       │                                                                  │
│       ▼                                                                  │
│  debateRoomAPI.createDebateComment(roomId, { text, stance })            │
│       │                                                                  │
│       ▼                                                                  │
│  Backend:                                                               │
│  - Saves comment with stance                                            │
│  - AI may re-group comments                                             │
│  - Returns success                                                      │
│       │                                                                  │
│       ▼                                                                  │
│  fetchComments() refreshes view                                         │
│       │                                                                  │
│       ▼                                                                  │
│  New comment appears in appropriate column                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

3. AI FEATURES
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  AI can analyze debate comments and:                                    │
│                                                                          │
│  1. Group similar arguments together                                    │
│     - "Climate change is real" + "Science supports this" → Same group  │
│                                                                          │
│  2. Link counter-arguments                                              │
│     - FOR: "Economic benefits are clear"                                │
│     - AGAINST: "Economic costs outweigh benefits" (linked)              │
│                                                                          │
│  3. Summarize each side's main points                                   │
│                                                                          │
│  4. Identify key areas of disagreement                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## DebateRoomsList Component

```jsx
// frontend/src/pages/DebateRoomsList.jsx

const DebateRoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await debateRoomAPI.getAllDebateRooms();
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Failed to load debate rooms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debate Rooms</h1>
      
      <div className="grid gap-4">
        {rooms.map(room => (
          <div 
            key={room._id}
            onClick={() => navigate(`/debate/${room._id}`)}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg 
                       cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-lg font-semibold">{room.topic}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {room.description}
            </p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>{room.participants?.length || 0} participants</span>
              <span>{room.totalComments || 0} comments</span>
              <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Debate API Services

```jsx
// frontend/src/services/debateRoomAPI.js

export const debateRoomAPI = {
  // Get all debate rooms
  getAllDebateRooms: async (params = {}) => {
    const response = await api.get('/debate-rooms', { params });
    return response.data;
  },

  // Get single debate room
  getDebateRoom: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}`);
    return response.data;
  },

  // Create new debate room (experts only)
  createDebateRoom: async (debateRoomData) => {
    const response = await api.post('/debate-rooms', debateRoomData);
    return response.data;
  },

  // Join a debate room
  joinDebateRoom: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/join`);
    return response.data;
  },

  // Get comments (grouped by stance)
  getDebateComments: async (roomId) => {
    const response = await api.get(`/debate-rooms/${roomId}/comments`);
    return response.data;
  },

  // Create comment
  createDebateComment: async (roomId, commentData) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments`, commentData);
    return response.data;
  },

  // Like a comment
  likeComment: async (roomId, commentId) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments/${commentId}/like`);
    return response.data;
  },

  // Dislike a comment
  dislikeComment: async (roomId, commentId) => {
    const response = await api.post(`/debate-rooms/${roomId}/comments/${commentId}/dislike`);
    return response.data;
  },

  // AI: Regenerate group content
  regenerateGroup: async (roomId, groupId) => {
    const response = await api.post(`/debate-rooms/${roomId}/groups/${groupId}/regenerate`);
    return response.data;
  },

  // AI: Relink groups
  relinkGroups: async (roomId) => {
    const response = await api.post(`/debate-rooms/${roomId}/groups/relink`);
    return response.data;
  },
};
```

---

## Interview Questions & Answers

### Q1: How does the two-column debate layout work?

**Answer:** Comments are fetched and pre-grouped by `stance` ('for' or 'against'). The UI renders two separate columns, each mapping over its respective array. This creates a visual debate format where supporting and opposing arguments are side-by-side.

### Q2: Why use `useParams` for the room ID?

**Answer:** `useParams` extracts dynamic segments from the URL. For `/debate/:roomId`, it gives us the actual room ID the user navigated to. This allows:
- Shareable URLs for specific debate rooms
- Browser back/forward navigation
- Bookmarkable rooms

### Q3: How are debate comments different from news comments?

**Answer:**
- **News comments**: Have stances (in_favor, against, general) for that specific news
- **Debate comments**: Binary stances (for, against) on a debatable topic
- **Debate structure**: Two-column layout for visual comparison
- **AI features**: Counter-argument linking, group summaries

### Q4: What triggers a comment list refresh?

**Answer:** `fetchComments()` is called after:
- Initial component mount
- Submitting a new comment
- Liking/disliking a comment
- AI regeneration/relinking

This ensures the UI always shows the latest state without manual refresh.

---

**Next: [14-PAGES-OVERVIEW.md](./14-PAGES-OVERVIEW.md)** - Overview of all application pages →

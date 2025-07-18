import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debateRoomAPI } from '../services/debateRoomAPI';
import { toast } from 'react-toastify';
import CounterChatView from './CounterChatView';
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
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';

const DebateRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [debateRoom, setDebateRoom] = useState(null);
  const [groups, setGroups] = useState({ for: [], against: [] });
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedStance, setSelectedStance] = useState('for');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState('groups'); // 'groups' or 'counter'
  const commentInputRef = useRef(null);

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
      navigate('/debate-rooms');
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await debateRoomAPI.getDebateComments(roomId);
      if (response.success) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await debateRoomAPI.createDebateComment(roomId, {
        text: newComment,
        stance: selectedStance
      });

      if (response.success) {
        setNewComment('');
        toast.success('Comment added successfully!');
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await debateRoomAPI.likeComment(roomId, commentId);
      fetchComments(); // Refresh to show updated likes
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleDislikeComment = async (commentId) => {
    try {
      await debateRoomAPI.dislikeComment(roomId, commentId);
      fetchComments(); // Refresh to show updated dislikes
    } catch (error) {
      console.error('Error disliking comment:', error);
      toast.error('Failed to dislike comment');
    }
  };

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

  const handleOpenCounterChat = (groupId) => {
    setViewMode('counter');
    // Could scroll to specific group or highlight it
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-group-id="${groupId}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('highlight');
        setTimeout(() => targetElement.classList.remove('highlight'), 2000);
      }
    }, 100);
  };

  // Add highlight CSS when component mounts
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .highlight {
        animation: highlight 2s ease-in-out;
      }
      @keyframes highlight {
        0% { background-color: #fef3c7; border-color: #f59e0b; }
        100% { background-color: inherit; border-color: inherit; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/debate-rooms')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {debateRoom?.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Topic: {debateRoom?.topic}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4" />
                <span>{debateRoom?.participantCount || 0} participants</span>
              </div>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <InformationCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-4">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  About this debate room
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  {debateRoom?.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {debateRoom?.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Created by {debateRoom?.creator?.name} on {formatDate(debateRoom?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Controls */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={handleRelinkGroups}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <LinkIcon className="h-4 w-4" />
            Relink Groups
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'groups' ? 'counter' : 'groups')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            {viewMode === 'groups' ? (
              <>
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Counter Chat View
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                Groups View
              </>
            )}
          </button>
        </div>

        {/* Comment Input */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmitComment}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your stance on this topic:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="for"
                    checked={selectedStance === 'for'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-green-600 dark:text-green-400 font-medium">For</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="against"
                    checked={selectedStance === 'against'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-red-600 dark:text-red-400 font-medium">Against</span>
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this topic..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submittingComment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === 'counter' ? (
          <CounterChatView
            groups={groups}
            onRegenerateGroup={handleRegenerateGroup}
            onLikeComment={handleLikeComment}
            onDislikeComment={handleDislikeComment}
          />
        ) : (
          /* Debate Groups Display */
          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Groups */}
            <div>
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Supporting Arguments ({groups.for.length})
              </h2>
              <div className="space-y-4">
                {groups.for.map((group) => (
                  <DebateGroup
                    key={group._id}
                    group={group}
                    onLike={handleLikeComment}
                    onDislike={handleDislikeComment}
                    onRegenerate={() => handleRegenerateGroup(group._id)}
                    onOpenCounterChat={handleOpenCounterChat}
                    stance="for"
                  />
                ))}
                {groups.for.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No supporting arguments yet. Be the first to share your thoughts!
                  </div>
                )}
              </div>
            </div>

            {/* Against Groups */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Opposing Arguments ({groups.against.length})
              </h2>
              <div className="space-y-4">
                {groups.against.map((group) => (
                  <DebateGroup
                    key={group._id}
                    group={group}
                    onLike={handleLikeComment}
                    onDislike={handleDislikeComment}
                    onRegenerate={() => handleRegenerateGroup(group._id)}
                    onOpenCounterChat={handleOpenCounterChat}
                    stance="against"
                  />
                ))}
                {groups.against.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No opposing arguments yet. Be the first to share your thoughts!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Debate Group Component
const DebateGroup = ({ group, onLike, onDislike, onRegenerate, onOpenCounterChat, stance }) => {
  const [expanded, setExpanded] = useState(false);
  const stanceColor = stance === 'for' ? 'green' : 'red';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-${stanceColor}-500 border border-gray-200 dark:border-gray-700 overflow-hidden`} data-group-id={group._id}>
      {/* Group Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {group.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {group.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onRegenerate}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Regenerate group content"
            >
              <SparklesIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="h-3 w-3" />
            <span>{group.commentIds.length} comments</span>
          </div>
          {group.counterGroupId && (
            <button
              onClick={() => onOpenCounterChat(group._id)}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              title="View counter discussion"
            >
              <LinkIcon className="h-3 w-3" />
              <span>View counter-chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className={`${expanded ? 'block' : 'hidden'}`}>
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {group.commentIds.map((comment) => (
            <div key={comment._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onLike(comment._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      <HandThumbUpIcon className="h-4 w-4" />
                      <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => onDislike(comment._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <HandThumbDownIcon className="h-4 w-4" />
                      <span>{comment.dislikes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview of first comment when collapsed */}
      {!expanded && group.commentIds.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {group.commentIds[0].authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {group.commentIds[0].text}
              </p>
              {group.commentIds.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  and {group.commentIds.length - 1} more comment{group.commentIds.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

export default DebateRoom;

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debateRoomAPI } from '../services/debateRoomAPI';
import { UserContext } from '../context/userContext';
import { useTour } from '../components/TourProvider';
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
  EyeIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
  TrashIcon
} from '@heroicons/react/24/solid';

const DebateRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { userType, userInfo } = useContext(UserContext);
  const { isRealExperienceOpen } = useTour();
  const [debateRoom, setDebateRoom] = useState(null);
  const [groups, setGroups] = useState({ for: [], against: [] });
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedStance, setSelectedStance] = useState('for');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState('groups'); // 'groups' or 'counter'
  const [recentComments, setRecentComments] = useState(new Map()); // Track recent comments for undo
  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchDebateRoom();
    fetchComments(true); // Show loader only on initial mount
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

  const fetchComments = async (showFullPageLoader = false) => {
    try {
      if (showFullPageLoader) {
        setLoading(true);
      }
      const response = await debateRoomAPI.getDebateComments(roomId);
      if (response.success) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      if (showFullPageLoader) {
        setLoading(false);
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Prevent actual submission during live experience tour
    if (isRealExperienceOpen) {
      console.log('[Tour] Form submission prevented during live experience');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await debateRoomAPI.createDebateComment(roomId, {
        text: newComment,
        stance: selectedStance
      });

      if (response.success) {
        setNewComment('');
        const comment = response.data?.comment || response.data;
        
        // Add to recent comments for undo functionality
        setRecentComments(prev => {
          const updated = new Map(prev);
          updated.set(comment._id, {
            ...comment,
            postedAt: Date.now()
          });
          return updated;
        });
        
        // Remove from undo tracking after 30 seconds
        const undoTimer = setTimeout(() => {
          setRecentComments(prev => {
            const updated = new Map(prev);
            updated.delete(comment._id);
            return updated;
          });
        }, 30000);
        
        // Show success toast with undo option
        const toastId = toast.success(
          <div className="flex items-center justify-between gap-4">
            <span>Comment posted successfully!</span>
            <button
              type="button"
              onClick={async () => {
                clearTimeout(undoTimer);
                toast.dismiss(toastId);
                await handleUndoComment(comment._id);
              }}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium transition-colors"
            >
              Undo
            </button>
          </div>,
          {
            autoClose: 30000,
            closeButton: true,
            position: 'bottom-right'
          }
        );
        
        fetchComments(); // Refresh comments immediately (no loader)
        
        // Delayed refresh to catch background counter-matching results
        // (Counter-matching runs in background after comment creation and may take 2-5 seconds)
        setTimeout(() => {
          fetchComments(); // No loader on background refresh
        }, 6000); // Wait 6 seconds for background tasks to complete
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
      fetchComments(); // Refresh to show updated likes (no loader)
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleDislikeComment = async (commentId) => {
    try {
      await debateRoomAPI.dislikeComment(roomId, commentId);
      fetchComments(); // Refresh to show updated dislikes (no loader)
    } catch (error) {
      console.error('Error disliking comment:', error);
      toast.error('Failed to dislike comment');
    }
  };

  const handleRegenerateGroup = async (groupId) => {
    try {
      await debateRoomAPI.regenerateGroup(roomId, groupId);
      toast.success('Group content regenerated successfully!');
      fetchComments(); // No loader
    } catch (error) {
      console.error('Error regenerating group:', error);
      toast.error('Failed to regenerate group content');
    }
  };

  const handleDeleteComment = async (commentId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await debateRoomAPI.deleteDebateComment(roomId, commentId);
      toast.success('Comment deleted successfully');
      fetchComments(); // No loader
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleUndoComment = async (commentId) => {
    try {
      const response = await debateRoomAPI.undoDebateComment(roomId, commentId);
      
      // Remove from recent comments tracking
      setRecentComments(prev => {
        const updated = new Map(prev);
        updated.delete(commentId);
        return updated;
      });
      
      toast.success('Comment undone successfully');
      fetchComments(); // No loader
    } catch (error) {
      console.error('Error undoing comment:', error);
      toast.error(error.response?.data?.message || 'Failed to undo comment');
    }
  };

  // Helper function to check if comment can be undone (within 30 seconds)
  const canUndoComment = (commentId) => {
    const recentComment = recentComments.get(commentId);
    if (!recentComment) return false;
    
    const timeDifference = Date.now() - recentComment.postedAt;
    return timeDifference < 30000; // 30 seconds
  };

  const handleRelinkGroups = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await debateRoomAPI.relinkGroups(roomId);
      toast.success('Groups relinked successfully!');
      fetchComments(); // No loader
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader title="Debate Rooms" />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] pt-24 pb-8" data-tour="debate-room-container">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700" data-tour="debate-room-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
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
                type="button"
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
        <div className="mb-6 flex gap-2 flex-wrap" data-tour="debate-room-view-toggle">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRelinkGroups(e);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <LinkIcon className="h-4 w-4" />
            Relink Groups
          </button>
          <button
            type="button"
            data-tour="debate-counter-chat-btn"
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
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-tour="debate-room-comment-input">
          <form onSubmit={handleSubmitComment}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your stance on this topic:
              </label>
              <div className="flex gap-4" data-tour="debate-stance-radios">
                <label className="flex items-center" data-tour="debate-stance-for">
                  <input
                    type="radio"
                    value="for"
                    checked={selectedStance === 'for'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-green-600 dark:text-green-400 font-medium">For</span>
                </label>
                <label className="flex items-center" data-tour="debate-stance-against">
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
          <div data-tour="debate-room-counter-view">
          <CounterChatView
            groups={groups}
            onRegenerateGroup={handleRegenerateGroup}
            onLikeComment={handleLikeComment}
            onDislikeComment={handleDislikeComment}
          />
          </div>
        ) : (
          /* Debate Groups Display */
          <div className="grid lg:grid-cols-2 gap-8" data-tour="debate-room-groups">
            {/* For Groups */}
            <div>
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Supporting Arguments ({groups.for.length})
              </h2>
              <div className="space-y-4">
                {groups.for.map((group, groupIndex) => (
                  <DebateGroup
                    key={group._id}
                    group={group}
                    isFirst={groupIndex === 0 || groupIndex === 1}
                    onLike={handleLikeComment}
                    onDislike={handleDislikeComment}
                    onRegenerate={() => handleRegenerateGroup(group._id)}
                    onOpenCounterChat={handleOpenCounterChat}
                    onDeleteComment={handleDeleteComment}                    onUndoComment={handleUndoComment}
                    canUndoComment={canUndoComment}                    userType={userType}
                    userInfo={userInfo}
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
                    onDeleteComment={handleDeleteComment}                    onUndoComment={handleUndoComment}
                    canUndoComment={canUndoComment}                    userType={userType}
                    userInfo={userInfo}
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

            {/* Ungrouped/Off-Topic Comments Section */}
            {(groups.ungroupedFor?.length > 0 || groups.ungroupedAgainst?.length > 0) && (
              <div className="mt-8 border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-8" data-tour="debate-room-ungrouped">
                <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  Off-Topic & Ungrouped Comments ({(groups.ungroupedFor?.length || 0) + (groups.ungroupedAgainst?.length || 0)})
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Supporting Off-Topic */}
                  {groups.ungroupedFor?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                        Supporting ({groups.ungroupedFor.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.ungroupedFor.map((comment) => (
                          <UngroupedComment
                            key={comment._id}
                            comment={comment}
                            onLike={handleLikeComment}
                            onDislike={handleDislikeComment}
                            onDelete={handleDeleteComment}
                            onUndo={handleUndoComment}
                            canUndo={canUndoComment}
                            userInfo={userInfo}
                            stance="for"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opposing Off-Topic */}
                  {groups.ungroupedAgainst?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                        Opposing ({groups.ungroupedAgainst.length})
                      </h3>
                      <div className="space-y-3">
                        {groups.ungroupedAgainst.map((comment) => (
                          <UngroupedComment
                            key={comment._id}
                            comment={comment}
                            onLike={handleLikeComment}
                            onDislike={handleDislikeComment}
                            onDelete={handleDeleteComment}
                            onUndo={handleUndoComment}
                            canUndo={canUndoComment}
                            userInfo={userInfo}
                            stance="against"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>
  );
};

// Individual Debate Group Component
const DebateGroup = ({ group, isFirst, onLike, onDislike, onRegenerate, onOpenCounterChat, onDeleteComment, onUndoComment, canUndoComment, userType, userInfo, stance }) => {
  const [expanded, setExpanded] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showIdealCounters, setShowIdealCounters] = useState(false);
  const stanceColor = stance === 'for' ? 'green' : 'red';
  const idealCounters = group.idealCounters || [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-${stanceColor}-500 border border-gray-200 dark:border-gray-700 overflow-hidden`} data-group-id={group._id} data-tour={isFirst ? "debate-room-group-card" : undefined}>
      {/* Group Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {group.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" data-tour={isFirst && group.commentIds?.length > 1 ? "debate-room-ideal-counters" : undefined}>
              {group.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              type="button"
              onClick={onRegenerate}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Regenerate group content"
            >
              <SparklesIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              type="button"
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
          {/* Show counter links - support both new array and legacy single field */}
          {(group.counterGroups?.length > 0 || group.counterGroupId) && (
            <div className="flex items-center gap-2" data-tour={isFirst ? "debate-room-counter-links" : undefined}>
              {group.counterGroups?.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenCounterChat(group._id)}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    title="View counter discussions"
                  >
                    <LinkIcon className="h-3 w-3" />
                    <span>{group.counterGroups.length} counter-link{group.counterGroups.length !== 1 ? 's' : ''}</span>
                  </button>
                  {/* Show badges for each counter link */}
                  <div className="flex gap-1">
                    {group.counterGroups.slice(0, 3).map((link, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 text-xs font-semibold rounded-full text-white ${
                          link.matchScore >= 0.85 ? 'bg-green-500' :
                          link.matchScore >= 0.70 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                        title={`Counter ${idx + 1}: ${(link.matchScore * 100).toFixed(0)}% match`}
                      >
                        {(link.matchScore * 100).toFixed(0)}%
                      </span>
                    ))}
                    {group.counterGroups.length > 3 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        +{group.counterGroups.length - 3}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // Legacy single counter link support
                <button
                  type="button"
                  onClick={() => onOpenCounterChat(group._id)}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  title="View counter discussion"
                >
                  <LinkIcon className="h-3 w-3" />
                  <span>View counter-chat</span>
                  {group.counterMatchScore != null && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full text-white ${
                      group.counterMatchScore >= 0.85 ? 'bg-green-500' :
                      group.counterMatchScore >= 0.70 ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`}>
                      {(group.counterMatchScore * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {/* Ideal counter info button */}
          {idealCounters.length > 0 && (
            <button
              type="button"
              data-tour="debate-ideal-counter-btn"
              onClick={() => setShowIdealCounters(true)}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              title="View ideal counter-arguments"
            >
              <InformationCircleIcon className="h-3 w-3" />
              <span>Ideal counters</span>
            </button>
          )}
        </div>
      </div>

      {/* Ideal Counter Popup */}
      {showIdealCounters && idealCounters.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowIdealCounters(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <InformationCircleIcon className="h-5 w-5" />
                  Ideal Counter-Arguments
                </h3>
                <button type="button" onClick={() => setShowIdealCounters(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  ✕
                </button>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                AI-generated descriptions of what the ideal counter-argument would look like for this group.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {idealCounters.map((ic, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  index === 0 
                    ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium text-white ${
                      index === 0 ? 'bg-orange-600' : 'bg-teal-600'
                    }`}>
                      Angle {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {ic}
                  </p>
                </div>
              ))}

              {/* Show linked counter-groups */}
              {group.counterGroups?.length > 0 && (
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                      Linked Counter-Groups ({group.counterGroups.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.counterGroups.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          Counter link {idx + 1}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                          link.matchScore >= 0.85 ? 'bg-green-500' :
                          link.matchScore >= 0.70 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}>
                          {(link.matchScore * 100).toFixed(1)}% match
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    These groups are permanently linked and will never be delinked.
                  </p>
                </div>
              )}

              {/* Show legacy counter-group if exists and no new links */}
              {group.counterGroupId && !group.counterGroups?.length && (
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">Matched Counter</span>
                    {group.counterMatchScore != null && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Similarity: {(group.counterMatchScore * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {typeof group.counterGroupId === 'object' ? group.counterGroupId.title : 'Counter-group paired'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {/* Off-topic label */}
                    {comment.topicRelevanceLabel && comment.topicRelevanceLabel !== 'Relevant' && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comment.topicRelevanceLabel === 'Off-Topic' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {comment.topicRelevanceLabel === 'Off-Topic' ? '🚫 Off-Topic' : '📍 Tangential'}
                      </span>
                    )}
                  </div>
                  <p className={`text-gray-700 dark:text-gray-300 text-sm mb-3 ${
                    comment.isOffTopic ? 'opacity-60 italic' : ''
                  }`}>
                    {comment.text}
                  </p>
                  {comment.isOffTopic && comment.offTopicReason && (
                    <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      <strong>Moderator Note:</strong> {comment.offTopicReason}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {(userInfo && comment.author && (comment.author._id?.toString() === userInfo._id?.toString() || comment.author._id?.toString() === userInfo.id?.toString()) && canUndoComment(comment._id)) && (
                      <button
                        type="button"
                        onClick={() => onUndoComment(comment._id)}
                        className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        title="Undo comment (available for 30 seconds)"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                        <span>Undo</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onLike(comment._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      <HandThumbUpIcon className="h-4 w-4" />
                      <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDislike(comment._id)}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <HandThumbDownIcon className="h-4 w-4" />
                      <span>{comment.dislikes?.length || 0}</span>
                    </button>
                    {(userType === 'admin' || (userInfo && comment.author && (comment.author._id?.toString() === userInfo._id?.toString() || comment.author._id?.toString() === userInfo.id?.toString()))) && !canUndoComment(comment._id) && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingCommentId(comment._id);
                          await onDeleteComment(comment._id, e);
                          setDeletingCommentId(null);
                        }}
                        disabled={deletingCommentId === comment._id}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete comment"
                      >
                        {deletingCommentId === comment._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
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

// Ungrouped/Off-Topic Comment Component
const UngroupedComment = ({ comment, onLike, onDislike, onDelete, onUndo, canUndo, userInfo, stance }) => {
  const [deleting, setDeleting] = useState(false);
  // Use grey for truly off-topic comments, otherwise use stance color
  const stanceColor = comment.isOffTopic ? 'gray' : (stance === 'for' ? 'green' : 'red');

  const handleDelete = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeleting(true);
    try {
      await onDelete(comment._id, e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-${stanceColor}-500 border border-gray-200 dark:border-gray-700 p-4`}>
      {/* Off-Topic Badge */}
      {comment.isOffTopic && (
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            comment.topicRelevanceLabel === 'Off-Topic' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {comment.topicRelevanceLabel === 'Off-Topic' ? '🚫 Off-Topic' : '📍 Tangential'}
          </span>
          {comment.offTopicReason && (
            <span className="text-xs text-gray-500 dark:text-gray-400" title={comment.offTopicReason}>
              (AI detected)
            </span>
          )}
        </div>
      )}

      {/* Comment Author */}
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 bg-${stanceColor}-100 dark:bg-${stanceColor}-900/30 rounded-full flex items-center justify-center`}>
            <span className={`text-sm font-medium text-${stanceColor}-700 dark:text-${stanceColor}-300`}>
              {comment.authorName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.authorName || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Comment Text */}
      <p className={`text-gray-700 dark:text-gray-300 text-sm mb-3 ${
        comment.isOffTopic ? 'opacity-75 italic' : ''
      }`}>
        {comment.text}
      </p>

      {/* Off-Topic Reason */}
      {comment.isOffTopic && comment.offTopicReason && (
        <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI Moderator Note:
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {comment.offTopicReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        {(userInfo && comment.author && (comment.author._id?.toString() === userInfo._id?.toString() || comment.author._id?.toString() === userInfo.id?.toString()) && canUndo(comment._id)) && (
          <button
            type="button"
            onClick={() => onUndo(comment._id)}
            className="flex items-center gap-1 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            title="Undo comment (available for 30 seconds)"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
            <span>Undo</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onLike(comment._id)}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <HandThumbUpIcon className="h-4 w-4" />
          <span>{comment.likes?.length || 0}</span>
        </button>
        <button
          type="button"
          onClick={() => onDislike(comment._id)}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <HandThumbDownIcon className="h-4 w-4" />
          <span>{comment.dislikes?.length || 0}</span>
        </button>
        {(userInfo && comment.author && (comment.author._id?.toString() === userInfo._id?.toString() || comment.author._id?.toString() === userInfo.id?.toString())) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(e);
            }}
            disabled={deleting}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete comment"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting && <span className="text-xs">Deleting...</span>}
          </button>
        )}
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

export default DebateRoom;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debateRoomAPI } from '../services/debateRoomAPI';
import { UserContext } from '../context/userContext';
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
  ArrowPathIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';

const AdvancedDebateRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [debateRoom, setDebateRoom] = useState(null);
  const [groups, setGroups] = useState({ for: [], against: [] });
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedStance, setSelectedStance] = useState('for');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'counter'
  const [counterAnalysis, setCounterAnalysis] = useState(null);
  const [debugStatus, setDebugStatus] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const { userType, userInfo } = useContext(UserContext);

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
        if (response.data.isNewGroup) {
          toast.success('New discussion group created!');
        } else {
          toast.success('Comment added to existing group!');
        }
        fetchComments();
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
      fetchComments();
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

  const handleGetDebugStatus = async () => {
    try {
      const response = await debateRoomAPI.getDebugCounterStatus(roomId);
      if (response.success) {
        setDebugStatus(response.data);
        toast.success('Debug status loaded!');
      }
    } catch (error) {
      console.error('Error getting debug status:', error);
      toast.error('Failed to get debug status');
    }
  };

  const handleGetCounterAnalysis = async (groupId) => {
    try {
      const response = await debateRoomAPI.getCounterAnalysis(roomId, groupId);
      if (response.success) {
        setCounterAnalysis(response.data);
        toast.success('Counter analysis loaded!');
      }
    } catch (error) {
      console.error('Error getting counter analysis:', error);
      toast.error('Failed to get counter analysis');
    }
  };

  const handleRegenerateGroup = async (groupId) => {
    try {
      await debateRoomAPI.regenerateGroup(roomId, groupId);
      toast.success('Group content regenerated!');
      fetchComments();
    } catch (error) {
      console.error('Error regenerating group:', error);
      toast.error('Failed to regenerate group content');
    }
  };

  const handleRelinkGroups = async () => {
    try {
      await debateRoomAPI.relinkGroups(roomId);
      toast.success('Counter-group links updated!');
      fetchComments();
    } catch (error) {
      console.error('Error relinking groups:', error);
      toast.error('Failed to relink groups');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      setDeletingCommentId(commentId);
      await debateRoomAPI.deleteDebateComment(roomId, commentId);
      toast.success('Comment deleted successfully');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const switchToCounterView = (groupId) => {
    setViewMode('counter');
    // Could navigate to a specific counter-match view
  };

  const renderComment = (comment) => (
    <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {comment.authorName || 'Anonymous'} • {new Date(comment.createdAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLikeComment(comment._id)}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
          >
            <HandThumbUpIcon className="h-4 w-4" />
            {comment.likes?.length || 0}
          </button>
          <button
            onClick={() => handleDislikeComment(comment._id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
          >
            <HandThumbDownIcon className="h-4 w-4" />
            {comment.dislikes?.length || 0}
          </button>
          {(userType === 'admin' || (userInfo && comment.author && comment.author.toString() === userInfo._id)) && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              disabled={deletingCommentId === comment._id}
              className="flex items-center gap-1 text-gray-400 hover:text-red-600 text-sm transition-colors disabled:opacity-50"
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
      <p className="text-gray-900 dark:text-gray-100">{comment.text}</p>
    </div>
  );

  const renderGroup = (group, isFor) => (
    <div key={group._id} className="mb-6">
      <div className={`rounded-lg p-4 border ${
        isFor 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
      }`}>
        {/* Group Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {group.title}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isFor 
                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' 
                  : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
              }`}>
                {isFor ? '👍 For' : '👎 Against'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {group.commentIds.length} comment{group.commentIds.length !== 1 ? 's' : ''}
              </span>
              {group.counterGroupId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGetCounterAnalysis(group._id)}
                    className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 rounded-full cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-700"
                  >
                    <LinkIcon className="h-3 w-3 inline mr-1" />
                    Linked
                  </button>
                  <button
                    onClick={() => setViewMode('counter')}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                  >
                    <EyeIcon className="h-3 w-3 inline mr-1" />
                    View Counter
                  </button>
                </div>
              )}
            </div>
            <p data-tour="debate-room-ideal-counters" className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {group.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRegenerateGroup(group._id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Regenerate group content"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              data-tour="group-expand-btn"
              onClick={() => toggleGroupExpansion(group._id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {expandedGroups[group._id] ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Comments */}
        {expandedGroups[group._id] && (
          <div className="mt-3 space-y-2">
            {group.commentIds.map(renderComment)}
          </div>
        )}
      </div>
    </div>
  );

  const renderUngroupedComment = (comment, isFor) => (
    <div key={comment._id} className={`rounded-lg p-4 border ${
      isFor 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 border-l-4 border-l-green-500' 
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 border-l-4 border-l-red-500'
    }`}>
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

      {/* Comment Content */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isFor ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'
          }`}>
            <span className={`text-sm font-medium ${
              isFor ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'
            }`}>
              {comment.authorName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.authorName || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className={`text-sm text-gray-700 dark:text-gray-300 mb-2 ${
            comment.isOffTopic ? 'opacity-75 italic' : ''
          }`}>
            {comment.text}
          </p>

          {/* Off-Topic Reason */}
          {comment.isOffTopic && comment.offTopicReason && (
            <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                🤖 AI Moderator Note:
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {comment.offTopicReason}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => handleLikeComment(comment._id)}
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <HandThumbUpIcon className="h-4 w-4" />
              <span>{comment.likes?.length || 0}</span>
            </button>
            <button
              onClick={() => handleDislikeComment(comment._id)}
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <HandThumbDownIcon className="h-4 w-4" />
              <span>{comment.dislikes?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatView = () => (
    <>
      <div data-tour="debate-room-groups" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Against (Left) */}
        <div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <HandThumbDownIcon className="h-6 w-6" />
            Against ({groups.against.length})
          </h2>
          {groups.against.map(group => renderGroup(group, false))}
        </div>

        {/* For (Right) */}
        <div>
          <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
            <HandThumbUpIcon className="h-6 w-6" />
            For ({groups.for.length})
          </h2>
          {groups.for.map(group => renderGroup(group, true))}
        </div>
      </div>

      {/* Ungrouped/Off-Topic Comments Section */}
      {(groups.ungroupedFor?.length > 0 || groups.ungroupedAgainst?.length > 0) && (
        <div className="mt-8 border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-8">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            Off-Topic & Ungrouped Comments ({(groups.ungroupedFor?.length || 0) + (groups.ungroupedAgainst?.length || 0)})
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Against Off-Topic */}
            {groups.ungroupedAgainst?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                  Against ({groups.ungroupedAgainst.length})
                </h3>
                <div className="space-y-3">
                  {groups.ungroupedAgainst.map((comment) => renderUngroupedComment(comment, false))}
                </div>
              </div>
            )}

            {/* For Off-Topic */}
            {groups.ungroupedFor?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                  For ({groups.ungroupedFor.length})
                </h3>
                <div className="space-y-3">
                  {groups.ungroupedFor.map((comment) => renderUngroupedComment(comment, true))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const renderCounterView = () => {
    // Debug log to see the data structure
    console.log('Groups data for counter view:', groups);
    
    // Create threads where pro groups are paired with their counter con groups
    const threads = [];
    const processedConGroups = new Set();

    // Process each pro group and find its counter(s)
    groups.for?.forEach(proGroup => {
      console.log('Processing pro group:', proGroup.title, 'counterGroups:', proGroup.counterGroups?.length || 0, 'counterGroupId:', proGroup.counterGroupId);
      
      // Check for new many-to-many counterGroups array
      if (proGroup.counterGroups && proGroup.counterGroups.length > 0) {
        // Create a separate thread for each counter link
        proGroup.counterGroups.forEach((link, linkIndex) => {
          const counterGroupId = typeof link.groupId === 'string' 
            ? link.groupId 
            : link.groupId?._id || link.groupId;
          
          console.log(`  Counter link ${linkIndex + 1}:`, counterGroupId, 'score:', link.matchScore);
          
          const counterGroup = groups.against?.find(g => 
            g._id.toString() === counterGroupId.toString()
          );
          
          if (counterGroup) {
            console.log('  Found counter group:', counterGroup.title);
            threads.push({
              pro: proGroup,
              con: counterGroup,
              matchScore: link.matchScore
            });
            processedConGroups.add(counterGroup._id.toString());
          }
        });
      } 
      // Fallback to legacy single counterGroupId field
      else if (proGroup.counterGroupId) {
        const counterGroupId = typeof proGroup.counterGroupId === 'string' 
          ? proGroup.counterGroupId 
          : proGroup.counterGroupId._id || proGroup.counterGroupId;
        
        console.log('Looking for counter group with ID (legacy):', counterGroupId);
        
        const counterGroup = groups.against?.find(g => 
          g._id.toString() === counterGroupId.toString()
        );
        
        console.log('Found counter group:', counterGroup?.title);
        
        if (counterGroup) {
          threads.push({
            pro: proGroup,
            con: counterGroup,
            matchScore: proGroup.counterMatchScore
          });
          processedConGroups.add(counterGroup._id.toString());
        }
      }
      // No counter links found
      else {
        threads.push({
          pro: proGroup,
          con: null
        });
      }
    });

    // Add any remaining con groups that weren't processed as counters
    groups.against?.forEach(conGroup => {
      if (!processedConGroups.has(conGroup._id.toString())) {
        console.log('Adding unprocessed con group:', conGroup.title);
        threads.push({
          pro: null,
          con: conGroup
        });
      }
    });

    console.log('Threads created:', threads.length);
    threads.forEach((thread, index) => {
      console.log(`Thread ${index + 1}:`, {
        pro: thread.pro?.title || 'None',
        con: thread.con?.title || 'None'
      });
    });

    if (threads.length === 0) {
      return (
        <div className="text-center p-8">
          <div className="text-gray-500 dark:text-gray-400">No arguments yet. Be the first to share your thoughts!</div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Counter-Argument Threads
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Opposing viewpoints matched by AI semantic analysis
          </p>
        </div>

        {threads.map((thread, index) => (
          <div key={index} className="counter-thread flex items-start gap-8 min-h-[200px] relative">
            {/* Pro side */}
            <div className="flex-1 max-w-[45%]">
              {thread.pro ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-800 dark:text-green-200">FOR: {thread.pro.title}</h3>
                    <span className="text-sm text-green-600 dark:text-green-400">{thread.pro.commentIds?.length || 0} comments</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 mb-4">{thread.pro.description}</p>
                  <div className="space-y-2">
                    {thread.pro.commentIds?.slice(0, 3).map((comment, i) => (
                      <div key={i} className="text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30 p-2 rounded">
                        "{comment.text}"
                      </div>
                    ))}
                    {thread.pro.commentIds?.length > 3 && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        +{thread.pro.commentIds.length - 3} more comments
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    Opportunity for a pro argument to counter the opposing view
                  </div>
                </div>
              )}
            </div>

            {/* Connection line */}
            <div className="absolute left-1/2 top-1/2 w-10 h-0.5 bg-gray-400 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2 flex items-center gap-1">
                <span className="text-gray-500 text-sm">↔</span>
                {thread.matchScore != null && (
                  <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full text-white ${
                    thread.matchScore >= 0.85 ? 'bg-green-500' :
                    thread.matchScore >= 0.70 ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`}>
                    {(thread.matchScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Con side */}
            <div className="flex-1 max-w-[45%] mt-16">
              {thread.con ? (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">AGAINST: {thread.con.title}</h3>
                    <span className="text-sm text-red-600 dark:text-red-400">{thread.con.commentIds?.length || 0} comments</span>
                  </div>
                  <p className="text-red-700 dark:text-red-300 mb-4">{thread.con.description}</p>
                  <div className="space-y-2">
                    {thread.con.commentIds?.slice(0, 3).map((comment, i) => (
                      <div key={i} className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800/30 p-2 rounded">
                        "{comment.text}"
                      </div>
                    ))}
                    {thread.con.commentIds?.length > 3 && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        +{thread.con.commentIds.length - 3} more comments
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    Opportunity for an opposing argument to counter the pro view
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
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
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Rooms
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {debateRoom?.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {debateRoom?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('chat')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'chat'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                  Chat View
                </button>
                <button
                  onClick={() => setViewMode('counter')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'counter'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <LinkIcon className="h-4 w-4 inline mr-1" />
                  Counter View
                </button>
              </div>
              <button
                onClick={handleGetDebugStatus}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <InformationCircleIcon className="h-4 w-4" />
                Debug Status
              </button>
              <button
                onClick={handleRelinkGroups}
                className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Relink Groups
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4" />
                {debateRoom?.participantCount || 0} participants
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Comment Form */}
        <div data-tour="debate-room-comment-input" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <form onSubmit={handleSubmitComment}>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStance('for')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStance === 'for'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  <HandThumbUpIcon className="h-4 w-4 inline mr-1" />
                  For
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStance('against')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStance === 'against'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  <HandThumbDownIcon className="h-4 w-4 inline mr-1" />
                  Against
                </button>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Posting as: {selectedStance === 'for' ? '👍 For' : '👎 Against'}
              </span>
            </div>
            <div className="flex gap-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 min-h-[80px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {submittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'chat' ? renderChatView() : (
          <CounterChatView 
            groups={groups} 
            onRegenerateGroup={handleRegenerateGroup}
            onLikeComment={handleLikeComment}
            onDislikeComment={handleDislikeComment}
          />
        )}

        {/* Counter Analysis Modal */}
        {counterAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Counter Analysis
                </h3>
                <button
                  onClick={() => setCounterAnalysis(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Original Group</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <h5 className="font-medium">{counterAnalysis.group.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {counterAnalysis.group.description}
                    </p>
                  </div>
                </div>

                {counterAnalysis.counterAnalysis && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Counter Group</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <h5 className="font-medium">{counterAnalysis.counterAnalysis.counterGroup.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {counterAnalysis.counterAnalysis.counterGroup.description}
                      </p>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(counterAnalysis.counterAnalysis.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round(counterAnalysis.counterAnalysis.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reasoning:</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {counterAnalysis.counterAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Status Modal */}
        {debugStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Debug Counter-Matching Status
                </h3>
                <button
                  onClick={() => setDebugStatus(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-3">FOR Groups</h4>
                    {debugStatus.forGroups?.map(group => (
                      <div key={group._id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
                        <h5 className="font-medium">{group.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Counter: {group.counterGroupId ? '✓' : '✗'}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-3">AGAINST Groups</h4>
                    {debugStatus.againstGroups?.map(group => (
                      <div key={group._id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-3">
                        <h5 className="font-medium">{group.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Counter: {group.counterGroupId ? '✓' : '✗'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Statistics</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Total Groups: {debugStatus.totalGroups}</div>
                    <div>Linked Groups: {debugStatus.linkedGroups}</div>
                    <div>Unlinked Groups: {debugStatus.unlinkedGroups}</div>
                    <div>Link Ratio: {debugStatus.linkRatio}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedDebateRoom;

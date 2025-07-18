import React, { useState, useEffect } from 'react';
import { 
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CounterChatView = ({ groups, onRegenerateGroup, onLikeComment, onDislikeComment }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [highlightedGroup, setHighlightedGroup] = useState(null);

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const highlightGroup = (groupId) => {
    setHighlightedGroup(groupId);
    setTimeout(() => setHighlightedGroup(null), 2000);
  };

  const renderComment = (comment) => (
    <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {comment.authorName || 'Anonymous'} • {new Date(comment.createdAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLikeComment(comment._id)}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
          >
            <HandThumbUpIcon className="h-4 w-4" />
            {comment.likes?.length || 0}
          </button>
          <button
            onClick={() => onDislikeComment(comment._id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
          >
            <HandThumbDownIcon className="h-4 w-4" />
            {comment.dislikes?.length || 0}
          </button>
        </div>
      </div>
      <p className="text-gray-900 dark:text-gray-100 text-sm">{comment.text}</p>
    </div>
  );

  const renderArgumentCard = (group, stance) => {
    const isExpanded = expandedGroups[group._id];
    const isHighlighted = highlightedGroup === group._id;
    
    return (
      <div 
        key={group._id} 
        className={`argument-card transition-all duration-300 ${
          isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''
        }`}
        data-group-id={group._id}
      >
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-5 border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 ${
          stance === 'pro' 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
        }`}>
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {group.title || group.label}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  stance === 'pro' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                }`}>
                  {stance === 'pro' ? '👍 FOR' : '👎 AGAINST'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {group.commentIds.length} comment{group.commentIds.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRegenerateGroup(group._id)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Regenerate group content"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleGroupExpansion(group._id)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
              {group.description}
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleGroupExpansion(group._id)}
            className="w-full text-left text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-3"
          >
            {isExpanded ? 'Hide comments' : `Show ${group.commentIds.length} comment${group.commentIds.length !== 1 ? 's' : ''}`}
          </button>

          {/* Comments Section */}
          <div className={`comments-section overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0'
          }`}>
            {group.commentIds.map(renderComment)}
          </div>
        </div>
      </div>
    );
  };

  const renderCounterThread = (thread, index) => (
    <div key={index} className="counter-thread flex items-start gap-8 mb-12 min-h-[300px] relative">
      {/* Pro side */}
      <div className="pro-side flex-1 max-w-[45%]">
        {thread.pro ? (
          renderArgumentCard(thread.pro, 'pro')
        ) : (
          <div className="no-counter bg-gray-100 dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">💭</div>
            <div className="text-gray-500 dark:text-gray-400 italic">
              Opportunity for a pro argument to counter the opposing view
            </div>
          </div>
        )}
      </div>

      {/* Connection line */}
      <div className="connection-line absolute left-1/2 top-1/2 w-10 h-0.5 bg-gray-400 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-2 text-gray-500 text-sm">
          ↔
        </div>
      </div>

      {/* Con side */}
      <div className="con-side flex-1 max-w-[45%] mt-16">
        {thread.con ? (
          renderArgumentCard(thread.con, 'con')
        ) : (
          <div className="no-counter bg-gray-100 dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">💭</div>
            <div className="text-gray-500 dark:text-gray-400 italic">
              Opportunity for a con argument to counter the pro view
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Create threads logic
  const threads = [];
  const processedConGroups = new Set();

  console.log('CounterChatView - groups data:', groups);

  // Process each pro group and find its counter
  groups.for?.forEach(proGroup => {
    console.log('Processing pro group:', proGroup.title, 'counterGroupId:', proGroup.counterGroupId);
    
    const thread = {
      pro: proGroup,
      con: null
    };

    // Find the con group that counters this pro group
    if (proGroup.counterGroupId) {
      const counterGroupId = typeof proGroup.counterGroupId === 'string' 
        ? proGroup.counterGroupId 
        : proGroup.counterGroupId._id || proGroup.counterGroupId;
      
      console.log('Looking for counter group with ID:', counterGroupId);
      
      const counterGroup = groups.against?.find(g => 
        g._id.toString() === counterGroupId.toString()
      );
      
      console.log('Found counter group:', counterGroup?.title);
      
      if (counterGroup) {
        thread.con = counterGroup;
        processedConGroups.add(counterGroup._id.toString());
      }
    }

    threads.push(thread);
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

  console.log('CounterChatView - threads created:', threads.length);
  threads.forEach((thread, index) => {
    console.log(`Thread ${index + 1}:`, {
      pro: thread.pro?.title || 'None',
      con: thread.con?.title || 'None'
    });
  });

  if (threads.length === 0) {
    return (
      <div className="empty-debate text-center p-16">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No counter arguments yet</h3>
          <p>Start a debate to see opposing perspectives appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="counter-chat-container">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center gap-2">
          <ChatBubbleLeftRightIcon className="h-8 w-8" />
          Counter-Argument Threads
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Opposing viewpoints matched by AI semantic analysis
        </p>
      </div>

      <div className="counter-threads">
        {threads.map(renderCounterThread)}
      </div>
    </div>
  );
};

export default CounterChatView;

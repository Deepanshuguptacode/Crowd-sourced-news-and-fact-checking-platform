/**
 * Debate Room tour steps builder — v3
 *
 * Fixes:
 * - Stance selection before typing
 * - Uses ACTUAL text from analysis (not mock)
 * - Counter group reveal with badge highlighting
 * - Proper off-topic handling
 */

import { DEBATE_MOCK } from './constants';

export const buildDebateSteps = (analysis) => [
  {
    id: 'debate-welcome',
    icon: '⚔️',
    title: 'Interactive Debate Tour',
    subtitle: 'Experience live AI grouping',
    description:
      "Let's walk through the AI-powered debate features! You'll post comments and watch the system group, link, and moderate them in real time. Ready?",
    gradient: 'from-red-500 to-orange-600',
    target: null,
  },
  {
    id: 'debate-type-similar',
    icon: '✍️',
    title: 'Post a Similar Comment',
    subtitle: 'Watch live typing',
    description:
      'A comment is being typed. It shares a theme with arguments already in an existing group. Once typing finishes — click the Send button!',
    gradient: 'from-blue-500 to-indigo-600',
    target: '[data-tour="debate-room-comment-input"]',
    action: 'hideMultiComment',
    stanceToSelect: 'for',
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: sessionStorage.getItem('tour_multiCommentText') || DEBATE_MOCK.similar,
    },
    highlightSendBtn: true,
    waitForClick: 'send',
  },
  {
    id: 'debate-show-clubbed',
    icon: '📂',
    title: 'Comment Clubbed Into Group!',
    subtitle: 'AI found a matching cluster',
    description:
      'The AI detected this comment shares the same theme and automatically clubbed it into the existing group! Notice the comment count increased. The comment is highlighted in green below.',
    gradient: 'from-green-500 to-emerald-600',
    action: 'showClubbedComment',
  },
  {
    id: 'debate-type-new',
    icon: '✍️',
    title: 'Post a Unique Comment',
    subtitle: 'No matching group exists',
    description:
      "Now watch another comment being typed. This one is unique — it doesn't match any existing group. Click Send when ready!",
    gradient: 'from-purple-500 to-violet-600',
    target: '[data-tour="debate-room-comment-input"]',
    action: 'hideSingleComment',
    stanceToSelect: 'for',
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: sessionStorage.getItem('tour_singleGroupText') || DEBATE_MOCK.newGroup,
    },
    highlightSendBtn: true,
    waitForClick: 'send',
  },
  {
    id: 'debate-show-new-group',
    icon: '🆕',
    title: 'New Group Created!',
    subtitle: 'No similar group existed',
    description: 'Because no existing group matched, the AI created a brand-new group. It auto-generated a title and description for the cluster!',
    gradient: 'from-amber-500 to-yellow-600',
    action: 'showNewGroup',
  },
  {
    id: 'debate-click-ideal-counter',
    icon: '🧠',
    title: 'Ideal Counter-Arguments',
    subtitle: 'AI-generated descriptions',
    description:
      'Every group has an AI-generated description that includes the "ideal counter-argument" — a guide for what the best opposing response should address. This helps debaters craft stronger, more focused rebuttals!',
    gradient: 'from-violet-500 to-purple-600',
    target: null,
    action: 'highlightIdealCounters',
  },
  {
    id: 'debate-type-counter',
    icon: '⚡',
    title: 'Post a Counter-Argument',
    subtitle: 'Opposing an existing group',
    description:
      'A counter-argument is being typed. The AI will detect it directly opposes an existing group and create a counter-link pair with a match quality percentage! Click Send.',
    gradient: 'from-red-500 to-pink-600',
    target: '[data-tour="debate-room-comment-input"]',
    action: 'hideCounterComment',
    stanceToSelect: 'against',
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: sessionStorage.getItem('tour_counterGroupText') || DEBATE_MOCK.counter,
    },
    highlightSendBtn: true,
    waitForClick: 'send',
  },
  {
    id: 'debate-show-counter',
    icon: '🔗',
    title: 'Counter-Link Established!',
    subtitle: 'AI matched opposing views',
    description:
      'The AI paired this opposing argument with its strongest matching group! The "Linked" badge and match % appear on both sides. Click "View Counter" to see the side-by-side Counter Chat View.',
    gradient: 'from-pink-500 to-rose-600',
    action: 'showCounterGroup',
  },
  {
    id: 'debate-type-offtopic',
    icon: '🚫',
    title: 'Post an Off-Topic Comment',
    subtitle: 'Testing AI moderation',
    description:
      "What happens when someone posts something unrelated? Watch this off-topic comment being typed. The AI's content moderation will catch it! Click Send.",
    gradient: 'from-gray-500 to-slate-600',
    target: '[data-tour="debate-room-comment-input"]',
    action: 'hideOffTopicComment',
    stanceToSelect: 'for',
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: sessionStorage.getItem('tour_offTopicText') || DEBATE_MOCK.offTopic,
    },
    highlightSendBtn: true,
    waitForClick: 'send',
  },
  {
    id: 'debate-show-offtopic',
    icon: '🚫',
    title: 'Off-Topic Detected!',
    subtitle: 'AI moderation in action',
    description:
      'The AI flagged this comment as off-topic and moved it to the "Off-Topic & Ungrouped" section at the bottom. The main debate stays focused while all contributions are preserved! Look at the highlighted comment below.',
    gradient: 'from-slate-500 to-gray-600',
    action: 'showOffTopic',
  },
  {
    id: 'debate-complete',
    icon: '🎉',
    title: 'Debate Tour Complete!',
    subtitle: 'All AI features demonstrated',
    description:
      'You\'ve experienced the full AI-powered debate system:\n\n✅ Similar comments auto-grouped\n✅ New groups created for unique arguments\n✅ Ideal counter-argument descriptions\n✅ Counter-argument linking with match %\n✅ Off-topic detection & moderation\n\nAll powered by Agentic AI with semantic analysis!',
    gradient: 'from-amber-500 to-yellow-500',
  },
];

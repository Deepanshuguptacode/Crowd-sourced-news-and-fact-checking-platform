/**
 * News Feed tour steps builder — v3
 *
 * Fixes:
 * - Uses ACTUAL card content for form filling (not mock)
 * - Card appears WITHOUT engagement, revealed step by step
 * - Comments button programmatically opened
 * - Faster typing speed
 */

import { NEWS_MOCK } from './constants';

export const buildNewsSteps = (analysis) => [
  {
    id: 'news-welcome',
    icon: '📰',
    title: 'Interactive News Tour',
    subtitle: 'Full verification lifecycle',
    description:
      "Let's walk through the complete news verification journey — from submitting an article to AI verdict generation. Ready to see how community, experts, and AI work together?",
    gradient: 'from-blue-600 to-indigo-700',
    action: 'hideNewsCard',
  },
  {
    id: 'news-goto-submit',
    icon: '📝',
    title: 'Submit a News Article',
    subtitle: 'Navigate to the submission form',
    description:
      'As a community user, you can submit any news article for collective verification. Click the highlighted "Submit News" button to go to the form.',
    gradient: 'from-blue-500 to-cyan-600',
    target: '[data-tour="home-submit-news"]',
    highlightClickTarget: true,
    waitForClick: 'navigate-submit',
  },
  {
    id: 'news-fill-form',
    icon: '✍️',
    title: 'Filling the Form',
    subtitle: 'Watch details being entered',
    description:
      'The news title, description, and source link are being typed in automatically — just like a real community submission.',
    gradient: 'from-indigo-500 to-blue-600',
    target: '[data-tour="submit-form-container"]',
    action: 'autoFillNewsForm',
  },
  {
    id: 'news-submit-form',
    icon: '🚀',
    title: 'Submit the Article!',
    subtitle: 'Click Submit News',
    description:
      'The form is ready! Click the highlighted submit button to publish the article.',
    gradient: 'from-green-500 to-emerald-600',
    target: '[data-tour="submit-button"]',
    highlightClickTarget: true,
    waitForClick: 'navigate-home',
  },
  {
    id: 'news-appeared',
    icon: '✨',
    title: 'News Article Published!',
    subtitle: 'Zero engagement — brand new',
    description:
      'The article now appears in the feed! Notice: 0 upvotes, 0 downvotes, 0 comments. It\'s completely fresh and waiting for community verification.',
    gradient: 'from-emerald-500 to-teal-600',
    target: '[data-tour="home-first-news-card"]',
    action: 'showNewsCardWithoutEngagement',
  },
  {
    id: 'news-vote',
    icon: '🗳️',
    title: 'Cast Your Vote!',
    subtitle: 'Upvote or Downvote',
    description:
      'Click 👍 (credible) or 👎 (fake). Verification rules:\n\n• ≥5 total votes needed to change status\n• >50% up → "Verified"\n• >50% down → "Fake"\n• 50/50 → Stays "Pending"',
    gradient: 'from-green-500 to-emerald-600',
    target: '[data-tour="home-voting-buttons"]',
    action: 'revealVoting',
    highlightClickTarget: true,
    waitForClick: 'vote',
  },
  {
    id: 'news-open-comments',
    icon: '💬',
    title: 'Open the Comments',
    subtitle: 'Start the discussion',
    description:
      'Click "Comments" to open the comment section. Inside you\'ll find stance selection, evidence links, AI grouping, and expert voting.',
    gradient: 'from-amber-500 to-orange-600',
    target: '[data-tour="home-comments-btn"]',
    action: 'revealCommentsBtn',
    highlightClickTarget: true,
    waitForClick: 'open-comments',
  },
  {
    id: 'news-type-comment',
    icon: '✍️',
    title: 'Watch a Comment Being Typed',
    subtitle: 'Evidence-backed input',
    description:
      'A community member is writing a detailed, evidence-backed comment. Click the Post button when typing finishes!',
    gradient: 'from-pink-500 to-rose-600',
    target: '[data-tour="home-comment-input"]',
    autoType: {
      selector: '[data-tour="home-comment-input"]',
      text: NEWS_MOCK.comment,
    },
    highlightSendBtn: true,
    waitForClick: 'post-comment',
  },
  {
    id: 'news-comments-stream',
    icon: '📊',
    title: 'Engagement Streaming In',
    subtitle: 'Comments & votes loading',
    description:
      'Watch as community engagement loads! Comments appear with stance badges, evidence links, and scores.',
    gradient: 'from-teal-500 to-cyan-600',
    target: '[data-tour="home-comment-section"]',
    action: 'streamComments',
  },
  {
    id: 'news-expert-voting',
    icon: '⭐',
    title: 'Expert Voting System',
    subtitle: 'Verified experts evaluate',
    description:
      'Domain-verified experts upvote/downvote comments. Score = Expert Upvotes − Downvotes. Only experts can vote — this score determines which comments the AI uses for the final verdict.',
    gradient: 'from-yellow-500 to-amber-600',
    target: '[data-tour="home-comment-card"]',
    action: 'highlightExpertVoting',
  },
  {
    id: 'news-group-comments',
    icon: '📂',
    title: 'AI Comment Grouping',
    subtitle: 'Click "Group by Topic"',
    description:
      'Click "Group by Topic" to activate the Agentic AI. It clusters similar comments into thematic groups, each with an AI-generated label.',
    gradient: 'from-teal-500 to-emerald-600',
    target: '[data-tour="home-group-comments"]',
    highlightClickTarget: true,
    waitForClick: 'group-comments',
  },
  {
    id: 'news-ai-verdict',
    icon: '🤖',
    title: 'Generate AI Verdict',
    subtitle: 'Click to analyze',
    description:
      'Click "Generate AI Verdict"! Google Gemini 2.5 Flash analyzes the article plus top-scored comments to produce a credibility score (0–100), confidence level, and detailed analysis.',
    gradient: 'from-purple-500 to-indigo-600',
    target: '[data-tour="home-ai-verdict"]',
    action: 'revealAiVerdict',
    highlightClickTarget: true,
    waitForClick: 'generate-verdict',
  },
  {
    id: 'news-verdict-rules',
    icon: '📋',
    title: 'AI Verdict Scoring Rules',
    subtitle: 'Complete algorithm explained',
    description: 'VERDICT_RULES',
    gradient: 'from-indigo-500 to-purple-600',
    target: '[data-tour="home-ai-verdict"]',
    isRulesStep: true,
  },
  {
    id: 'news-complete',
    icon: '🎉',
    title: 'News Verification Complete!',
    subtitle: 'Full lifecycle demonstrated',
    description:
      'You\'ve experienced the complete 3-tier verification:\n\n📝 News Submission\n🗳️ Community Voting (≥5 votes)\n💬 Stance-based Commenting\n📎 Evidence Link Support\n⭐ Expert Comment Voting\n📂 AI Comment Grouping\n🤖 AI Verdict (0–100 score)\n\nCommunity → Experts → AI working together!',
    gradient: 'from-amber-500 to-yellow-500',
  },
];

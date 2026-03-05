/**
 * News Feed tour steps builder — v4
 *
 * v4 changes:
 * - AI verdict hidden until its step
 * - Vote counts start at 0
 * - Previous comments hidden; one selected & filled into input
 * - Grouped-comments step opens & highlights region
 * - Evidence-link tour card added
 * - Expert upvote/downvote animation step
 * - Unhide-all step at end
 */


export const buildNewsSteps = (/* analysis */) => [
  // ── 0  Welcome ───────────────────────────────────────────────────────
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

  // ── 1  Navigate to submit ────────────────────────────────────────────
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

  // ── 2  Auto-fill form ────────────────────────────────────────────────
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

  // ── 3  Submit form ───────────────────────────────────────────────────
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

  // ── 4  Card appears — clean slate ────────────────────────────────────
  {
    id: 'news-appeared',
    icon: '✨',
    title: 'News Article Published!',
    subtitle: 'Zero engagement — brand new',
    description:
      'The article now appears in the feed! Notice: 0 upvotes, 0 downvotes, 0 comments. It\'s completely fresh and waiting for community verification.',
    gradient: 'from-emerald-500 to-teal-600',
    target: '[data-tour="home-first-news-card"]',
    action: 'showNewsCardClean',
  },

  // ── 5  Vote ──────────────────────────────────────────────────────────
  {
    id: 'news-vote',
    icon: '🗳️',
    title: 'Cast Your Vote!',
    subtitle: 'Upvote or Downvote',
    description:
      'Click 👍 (credible) or 👎 (fake). Verification rules:\n\n• ≥5 total votes needed to change status\n• >50% up → "Verified"\n• >50% down → "Fake"\n• 50/50 → Stays "Pending"',
    gradient: 'from-green-500 to-emerald-600',
    target: '[data-tour="home-voting-buttons"]',
    action: 'revealVotingZero',
    highlightClickTarget: true,
    waitForClick: 'vote',
  },

  // ── 6  Open comments ────────────────────────────────────────────────
  {
    id: 'news-open-comments',
    icon: '💬',
    title: 'Open the Comments',
    subtitle: 'Start the discussion',
    description:
      'Click "Comments" to open the comment section where users can share evidence and analysis.',
    gradient: 'from-amber-500 to-orange-600',
    target: '[data-tour="home-comments-btn"]',
    action: 'revealCommentsBtn',
    highlightClickTarget: true,
    waitForClick: 'open-comments',
  },

  // ── 7  Fill comment from existing ────────────────────────────────────
  {
    id: 'news-type-comment',
    icon: '✍️',
    title: 'Post a Comment',
    subtitle: 'Evidence-backed input',
    description:
      'A community member is writing a comment. The text has been filled in from an existing user analysis. Click the Post button to submit it!',
    gradient: 'from-pink-500 to-rose-600',
    target: '[data-tour="home-comment-input"]',
    action: 'hideCommentsAndFillInput',
    highlightSendBtn: true,
    waitForClick: 'post-comment',
  },

  // ── 8  Stream comments ──────────────────────────────────────────────
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

  // ── 9  Evidence links ───────────────────────────────────────────────
  {
    id: 'news-evidence-link',
    icon: '🔗',
    title: 'Evidence Links',
    subtitle: 'Expert & community evidence',
    description:
      'Users can attach evidence links to their comments — URLs to research papers, news sources, or official reports supporting their analysis.\n\n📎 This strengthens credibility and helps the AI weigh evidence during the verdict.\n\nExperts use this feature to cite their domain knowledge.',
    gradient: 'from-blue-500 to-indigo-600',
    action: 'highlightEvidenceLink',
  },

  // ── 10  Expert voting animation ─────────────────────────────────────
  {
    id: 'news-expert-voting',
    icon: '⭐',
    title: 'Expert Voting System',
    subtitle: 'Verified experts evaluate',
    description:
      'Watch as a domain-verified expert analyses a user comment and casts a vote! Expert scores directly influence the AI verdict.\n\nScore = Expert Upvotes − Downvotes.',
    gradient: 'from-yellow-500 to-amber-600',
    target: '[data-tour="home-comment-card"]',
    action: 'animateExpertVote',
  },

  // ── 11  Group comments ──────────────────────────────────────────────
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

  // ── 12  Highlight grouped view ──────────────────────────────────────
  {
    id: 'news-show-grouped',
    icon: '🗂️',
    title: 'Grouped Comments View',
    subtitle: 'See thematic clusters',
    description:
      'The AI has organised user comments into topic-based groups. Each group has a generated label and description, making it easy to see the key themes at a glance.',
    gradient: 'from-indigo-500 to-purple-600',
    target: '[data-tour="home-comment-section"]',
    action: 'highlightGroupedView',
  },

  // ── 13  AI verdict ──────────────────────────────────────────────────
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

  // ── 14  Verdict rules ───────────────────────────────────────────────
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

  // ── 15  Complete — unhide all ───────────────────────────────────────
  {
    id: 'news-complete',
    icon: '🎉',
    title: 'News Verification Complete!',
    subtitle: 'Full lifecycle demonstrated',
    description:
      'You\'ve experienced the complete 3-tier verification:\n\n📝 News Submission\n🗳️ Community Voting (≥5 votes)\n💬 Stance-based Commenting\n📎 Evidence Link Support\n⭐ Expert Comment Voting\n📂 AI Comment Grouping\n🤖 AI Verdict (0–100 score)\n\nCommunity → Experts → AI working together!\n\nAll original data is now restored below.',
    gradient: 'from-amber-500 to-yellow-500',
    action: 'unhideAllNewsData',
  },
];

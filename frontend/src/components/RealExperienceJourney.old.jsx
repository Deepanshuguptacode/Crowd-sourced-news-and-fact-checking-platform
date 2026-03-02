import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RealExperienceJourney — Interactive Hide/Show Tour (v2)
 *
 * KEY DESIGN DECISIONS:
 * - Guide panel FLOWS next to the highlighted element (not fixed bottom-right).
 * - Results are highlighted after each action (new group, clubbed comment, off-topic badge).
 * - Groups auto-expand and specific comments are highlighted inside.
 * - Ideal counter: user clicks it first, then explanation appears.
 * - Welcome steps do NOT mention "hidden" or "show" — feels natural.
 * - Off-topic step types a real off-topic comment, not the description.
 * - News submit uses programmatic navigation so it actually works.
 */

// ─── DOM Helpers ────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const scrollToTarget = (selector) =>
  new Promise((resolve) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(resolve, 600);
    } else resolve();
  });

const typeIntoInput = (selector, text, speed = 35) =>
  new Promise((resolve) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { resolve(); return; }
    el.focus();
    let i = 0;
    const isTextarea = el.tagName === 'TEXTAREA';
    const proto = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!nativeSetter) { resolve(); return; }
    const interval = setInterval(() => {
      i++;
      nativeSetter.call(el, text.slice(0, i));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (i >= text.length) { clearInterval(interval); setTimeout(resolve, 300); }
    }, speed);
  });

const clearInput = (selector) => {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

// ─── Hide / Show / Highlight ────────────────────────────────────────────────

const hideElement = (el) => {
  if (!el) return;
  el.dataset.tourHidden = 'true';
  el.style.display = 'none';
};

const showElement = (el, displayVal = '') => {
  if (!el) return;
  delete el.dataset.tourHidden;
  el.style.display = displayVal;
};

const showWithAnimation = (el, displayVal = '') => {
  if (!el) return;
  delete el.dataset.tourHidden;
  el.style.display = displayVal;
  el.style.transition = 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-12px) scale(0.95)';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    }),
  );
};

const pulseElement = (el, duration = 3000) => {
  if (!el) return;
  el.style.transition = 'box-shadow 0.3s ease';
  el.style.boxShadow =
    '0 0 0 4px rgba(59,130,246,0.55), 0 0 28px rgba(59,130,246,0.35)';
  el.style.borderRadius = el.style.borderRadius || '8px';
  setTimeout(() => {
    if (el) el.style.boxShadow = '';
  }, duration);
};

const highlightResult = (el) => {
  if (!el) return;
  el.style.transition = 'all 0.4s ease';
  el.style.boxShadow =
    '0 0 0 3px rgba(34,197,94,0.7), 0 0 24px rgba(34,197,94,0.35)';
  el.style.transform = 'scale(1.02)';
  el.style.position = 'relative';
  el.style.zIndex = '99997';
};

const highlightAction = (el) => {
  if (!el) return;
  el.style.transition = 'all 0.3s ease';
  el.style.boxShadow =
    '0 0 0 3px rgba(234,179,8,0.7), 0 0 24px rgba(234,179,8,0.35)';
  el.style.transform = 'scale(1.03)';
  el.style.position = 'relative';
  el.style.zIndex = '99997';
};

const unhighlight = (el) => {
  if (!el) return;
  el.style.boxShadow = '';
  el.style.transform = '';
  el.style.zIndex = '';
};

const unhighlightAll = () => {
  document.querySelectorAll('[style]').forEach((el) => {
    if (
      el.style.boxShadow &&
      (el.style.boxShadow.includes('234,179,8') ||
        el.style.boxShadow.includes('34,197,94') ||
        el.style.boxShadow.includes('59,130,246'))
    ) {
      unhighlight(el);
    }
  });
};

// ─── Expand a group (click chevron if collapsed) ────────────────────────────

const expandGroup = async (groupCard) => {
  if (!groupCard) return;
  // The inner card
  const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
  if (!innerCard) return;
  // Check if comments section is already visible
  const commentsDiv = innerCard.querySelector('.mt-3.space-y-2');
  if (commentsDiv) return; // Already expanded
  // Find the chevron button (last button in the header row)
  const buttons = innerCard.querySelectorAll('button');
  const chevronBtn = Array.from(buttons).find(
    (b) => b.querySelector('svg.h-4.w-4') || b.querySelector('[class*="ChevronDown"]'),
  );
  if (chevronBtn) {
    chevronBtn.click();
    await wait(400);
  }
};

// ─── Debate Room Analyzer ───────────────────────────────────────────────────

const analyzeDebateRoom = () => {
  const result = {
    singleGroup: null,
    singleGroupStance: null,
    singleGroupTitle: '',
    singleGroupCommentText: '',
    counterGroup: null,
    counterGroupStance: null,
    counterGroupTitle: '',
    counterGroupCommentText: '',
    multiGroup: null,
    multiGroupStance: null,
    multiGroupComment: null,
    multiGroupCommentText: '',
    offTopicComment: null,
    offTopicStance: null,
    offTopicCommentText: '',
  };

  const groupsContainer = document.querySelector('[data-tour="debate-room-groups"]');
  if (!groupsContainer) return result;

  // Collect all .mb-6 group cards (direct children of each column)
  const allGroupCards = groupsContainer.querySelectorAll('.mb-6');
  const forGroups = [];
  const againstGroups = [];

  allGroupCards.forEach((card) => {
    const stanceBadge = card.querySelector('.rounded-full');
    const badgeText = stanceBadge?.textContent || '';
    const isFor = badgeText.includes('For');
    const isAgainst = badgeText.includes('Against');

    const innerCard = card.querySelector('.rounded-lg.p-4.border');
    if (!innerCard) return;

    const expandedComments = innerCard.querySelector('.mt-3.space-y-2');
    const commentEls = expandedComments ? Array.from(expandedComments.children) : [];

    const title = innerCard.querySelector('h3')?.textContent || '';
    const hasCounter = innerCard.innerHTML.includes('Linked');

    // Count badge: "N comments" span
    const countSpan = innerCard.querySelector('.text-xs.text-gray-500');
    const countText = countSpan?.textContent || '';
    const countMatch = countText.match(/(\d+)/);
    const commentCount = countMatch ? parseInt(countMatch[1], 10) : commentEls.length;

    const groupInfo = {
      element: card,
      innerCard,
      commentCount,
      comments: commentEls,
      title,
      hasCounter,
    };

    if (isFor) forGroups.push(groupInfo);
    else if (isAgainst) againstGroups.push(groupInfo);
  });

  const allGroups = [
    ...forGroups.map((g) => ({ ...g, stance: 'for' })),
    ...againstGroups.map((g) => ({ ...g, stance: 'against' })),
  ];

  const singleCommentGroups = allGroups.filter((g) => g.commentCount <= 1);
  const multiCommentGroups = allGroups.filter((g) => g.commentCount > 1);

  // Pick a single-comment group
  if (singleCommentGroups.length > 0) {
    const picked = singleCommentGroups[0];
    result.singleGroup = picked.element;
    result.singleGroupStance = picked.stance;
    result.singleGroupTitle = picked.title;
    if (picked.comments[0]) {
      result.singleGroupCommentText =
        picked.comments[0].querySelector('p')?.textContent ||
        'This argument presents a unique perspective.';
    }
  }

  // Pick a multi-comment group + one comment inside it
  if (multiCommentGroups.length > 0) {
    const picked = multiCommentGroups[0];
    result.multiGroup = picked.element;
    result.multiGroupStance = picked.stance;
    const idx = Math.min(1, picked.comments.length - 1);
    result.multiGroupComment = picked.comments[idx] || picked.comments[0];
    result.multiGroupCommentText =
      result.multiGroupComment?.querySelector('p')?.textContent ||
      'I strongly agree with the points raised in this group.';
  }

  // Off-topic / ungrouped
  const offTopicCards = document.querySelectorAll('.border-l-4');
  if (offTopicCards.length > 0) {
    const picked = offTopicCards[0];
    result.offTopicComment = picked;
    result.offTopicStance = picked.classList.contains('border-l-green-500')
      ? 'for'
      : 'against';
    const textEl = picked.querySelector('p.text-sm');
    result.offTopicCommentText =
      textEl?.textContent || 'This comment seems unrelated to the main topic.';
  }

  // Counter group
  if (result.singleGroup) {
    const oppositePool = result.singleGroupStance === 'for' ? againstGroups : forGroups;
    const pool = oppositePool.filter(
      (g) => g.element !== result.multiGroup && g.element !== result.singleGroup,
    );
    if (pool.length > 0) {
      const picked = pool.find((g) => g.hasCounter) || pool[0];
      result.counterGroup = picked.element;
      result.counterGroupStance = picked.stance;
      result.counterGroupTitle = picked.title;
      result.counterGroupCommentText =
        picked.comments[0]?.querySelector('p')?.textContent ||
        'The evidence strongly contradicts their main claim.';
    }
  }

  return result;
};

// ─── News Feed Analyzer ─────────────────────────────────────────────────────

const analyzeNewsFeed = () => {
  const result = { firstNewsCard: null, newsTitle: '' };
  const firstCard = document.querySelector('[data-tour="home-first-news-card"]');
  if (firstCard) {
    result.firstNewsCard = firstCard;
    result.newsTitle =
      firstCard.querySelector('h3 a')?.textContent || 'Breaking News';
  }
  return result;
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

const DEBATE_MOCK = {
  similar:
    'AI moderation can efficiently handle the massive scale of online content, processing millions of posts in seconds — something human moderators simply cannot match.',
  newGroup:
    'The economic impact of AI moderation on the content moderation job market needs careful consideration and transition planning.',
  counter:
    'While AI speed is impressive, it frequently misunderstands context, satire, and cultural nuances — leading to wrongful censorship of legitimate speech.',
  offTopic:
    'I think blockchain technology is more important for the future of social media than any AI tool could ever be.',
};

const NEWS_MOCK = {
  title: 'Study: Global Renewable Energy Capacity Surpasses Coal for First Time',
  description:
    'A landmark report by the International Energy Agency reveals that global renewable energy generation capacity has officially overtaken coal-fired power for the first time in history, marking a pivotal shift in the world\'s energy landscape.',
  link: 'https://www.iea.org/news/renewable-capacity-milestone',
  comment:
    'This aligns with recent data from Bloomberg NEF showing a 40% increase in solar installations last year. The methodology appears sound and peer-reviewed.',
};

const AI_VERDICT_RULES = {
  scoring: [
    { range: '81–100', meaning: 'Highly credible and verified', color: 'bg-green-500' },
    { range: '61–80', meaning: 'Likely true with minor concerns', color: 'bg-green-400' },
    { range: '41–60', meaning: 'Uncertain / mixed evidence', color: 'bg-yellow-500' },
    { range: '21–40', meaning: 'Likely false or misleading', color: 'bg-red-400' },
    { range: '0–20', meaning: 'Definitely fake / misinformation', color: 'bg-red-600' },
  ],
  topCommentSelection: [
    'Comments split by stance: "In Favor" vs "Against" (General excluded)',
    'If AI groups exist → highest-scored comment from each group (ensures diversity)',
    'Fallback → top comments by raw score (upvotes − downvotes)',
    'Up to 8 supporting + 8 opposing = max 16 sent to AI',
  ],
  credibilityFactors: [
    'Comment score = Expert Upvotes − Expert Downvotes',
    'Only verified domain experts can vote on comments',
    'Expert comments weighted more heavily than community',
    'Evidence links increase credibility signal weight',
  ],
  aiEvaluation: [
    'Quality & credibility of the news source',
    'Evidence in top community & expert comments',
    'Expert vs community consensus alignment',
    'Consistency of information across comments',
    'Potential for harm if the news is false',
  ],
  verificationThresholds: [
    'Needs ≥5 total community votes to change status',
    '>50% upvotes → Status: "Verified"',
    '>50% downvotes → Status: "Fake"',
    '50/50 split → Status remains "Pending"',
  ],
};

// ─── Debate Steps ───────────────────────────────────────────────────────────

const buildDebateSteps = (analysis) => [
  {
    id: 'debate-welcome',
    icon: '⚔️',
    title: 'Interactive Debate Tour',
    subtitle: 'Experience live AI grouping',
    description:
      "Let's walk through the AI-powered debate features! You'll post comments and watch the system group, link, and moderate them in real time. Ready?",
    gradient: 'from-red-500 to-orange-600',
    target: null,
    action: 'hideDebateElements',
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
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: analysis.multiGroupCommentText || DEBATE_MOCK.similar,
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
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: analysis.singleGroupCommentText || DEBATE_MOCK.newGroup,
    },
    highlightSendBtn: true,
    waitForClick: 'send',
  },
  {
    id: 'debate-show-new-group',
    icon: '🆕',
    title: 'New Group Created!',
    subtitle: 'No similar group existed',
    description: `Because no existing group matched, the AI created a brand-new group: "${analysis.singleGroupTitle || 'New Discussion Point'}". It auto-generated a title and description for the cluster!`,
    gradient: 'from-amber-500 to-yellow-600',
    action: 'showNewGroup',
  },
  {
    id: 'debate-click-ideal-counter',
    icon: '🧠',
    title: 'Ideal Counter-Arguments',
    subtitle: 'Click on the group description',
    description:
      'Every group has an AI-generated description that includes the "ideal counter-argument" — a guide for what the best opposing response should address. Click the highlighted description to learn more!',
    gradient: 'from-violet-500 to-purple-600',
    target: '[data-tour="debate-room-ideal-counters"]',
    highlightClickTarget: true,
    waitForClick: 'ideal-counter',
  },
  {
    id: 'debate-explain-ideal-counter',
    icon: '💡',
    title: 'How Ideal Counters Work',
    subtitle: 'AI-generated rebuttal guide',
    description:
      'The AI analyzes each group\'s arguments and generates a description of the strongest possible counter-argument. This guides debaters to write better, more focused rebuttals — raising the overall quality of the debate. Every group gets up to 2 ideal counter descriptions stored as vectors for matching.',
    gradient: 'from-indigo-500 to-violet-600',
    target: '[data-tour="debate-room-ideal-counters"]',
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
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: analysis.counterGroupCommentText || DEBATE_MOCK.counter,
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
    autoType: {
      selector: '[data-tour="debate-room-comment-input"] textarea',
      text: DEBATE_MOCK.offTopic,
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

// ─── News Steps ─────────────────────────────────────────────────────────────

const buildNewsSteps = () => [
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
    action: 'showNewsCard',
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

// ─── Panel Position Calculator ──────────────────────────────────────────────

const calcPanelPosition = (targetRect, panelW = 420, panelH = 340) => {
  if (!targetRect) return { bottom: 24, right: 24, position: 'fixed' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 16;

  // Try right of target
  if (targetRect.right + GAP + panelW < vw - 16) {
    return {
      position: 'fixed',
      top: Math.max(16, Math.min(targetRect.top, vh - panelH - 16)),
      left: targetRect.right + GAP,
    };
  }
  // Try left of target
  if (targetRect.left - GAP - panelW > 16) {
    return {
      position: 'fixed',
      top: Math.max(16, Math.min(targetRect.top, vh - panelH - 16)),
      left: targetRect.left - GAP - panelW,
    };
  }
  // Try below
  if (targetRect.bottom + GAP + panelH < vh - 16) {
    return {
      position: 'fixed',
      top: targetRect.bottom + GAP,
      left: Math.max(16, Math.min(targetRect.left, vw - panelW - 16)),
    };
  }
  // Try above
  if (targetRect.top - GAP - panelH > 16) {
    return {
      position: 'fixed',
      top: targetRect.top - GAP - panelH,
      left: Math.max(16, Math.min(targetRect.left, vw - panelW - 16)),
    };
  }
  // Fallback bottom right
  return { position: 'fixed', bottom: 24, right: 24 };
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const RealExperienceJourney = ({ isOpen, onClose, currentPath }) => {
  const navigate = useNavigate();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [panelPos, setPanelPos] = useState({ bottom: 24, right: 24, position: 'fixed' });
  const [actionRunning, setActionRunning] = useState(false);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [waitAction, setWaitAction] = useState(null);
  const [stepsReady, setStepsReady] = useState(false);

  const hiddenElementsRef = useRef([]);
  const clearedInputsRef = useRef([]);
  const analysisRef = useRef(null);
  const animFrameRef = useRef(null);
  const stepsRef = useRef([]);
  const tourPhaseRef = useRef(''); // 'debate' | 'news-home' | 'news-submit' | 'news-back'

  const isDebate = currentPath?.startsWith('/debate-room/');
  const isHome = currentPath === '/home';
  const isSubmitPage = currentPath === '/submit-news';

  // Determine if the tour is active somewhere meaningful
  const isActiveTourPage = isDebate || isHome || isSubmitPage;

  // ── Analyze page & build steps ──
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (isDebate) {
        const analysis = analyzeDebateRoom();
        analysisRef.current = analysis;
        stepsRef.current = buildDebateSteps(analysis);
        tourPhaseRef.current = 'debate';
      } else if (isHome || isSubmitPage) {
        // News tour — can start from /home or /submit-news
        if (tourPhaseRef.current === 'news-submit' && isSubmitPage) {
          // We navigated to submit — don't rebuild steps, keep phase
          setStepsReady(true);
          return;
        }
        if (tourPhaseRef.current === 'news-back' && isHome) {
          // We navigated back home — don't rebuild steps
          setStepsReady(true);
          return;
        }
        const analysis = analyzeNewsFeed();
        analysisRef.current = analysis;
        stepsRef.current = buildNewsSteps();
        tourPhaseRef.current = 'news-home';
      }
      setStepsReady(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [isOpen, currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = stepsRef.current;
  const currentStep = steps[currentStepIndex];

  // ── Spotlight + Panel position tracking ──
  const updateSpotlight = useCallback(() => {
    if (!currentStep?.target) {
      setSpotlightRect(null);
      setPanelPos({ position: 'fixed', bottom: 24, right: 24 });
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const sr = {
        left: rect.left - 8,
        top: rect.top - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      };
      setSpotlightRect(sr);
      setPanelPos(calcPanelPosition(rect));
    } else {
      setSpotlightRect(null);
      setPanelPos({ position: 'fixed', bottom: 24, right: 24 });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const loop = () => {
      updateSpotlight();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, updateSpotlight]);

  // ── Execute step actions ──
  useEffect(() => {
    if (!isOpen || !currentStep || !stepsReady) return;
    let cancelled = false;

    const exec = async () => {
      setActionRunning(true);
      setWaitingForUser(false);
      setWaitAction(null);
      unhighlightAll();

      const analysis = analysisRef.current;

      // Scroll to target
      if (currentStep.target) {
        await scrollToTarget(currentStep.target);
        await wait(300);
      }

      // ───── ACTIONS ─────

      // DEBATE: Hide elements on welcome (silently)
      if (currentStep.action === 'hideDebateElements' && analysis) {
        if (analysis.multiGroupComment) {
          hideElement(analysis.multiGroupComment);
          hiddenElementsRef.current.push(analysis.multiGroupComment);
        }
        if (analysis.singleGroup) {
          hideElement(analysis.singleGroup);
          hiddenElementsRef.current.push(analysis.singleGroup);
        }
        if (analysis.counterGroup) {
          hideElement(analysis.counterGroup);
          hiddenElementsRef.current.push(analysis.counterGroup);
        }
        if (analysis.offTopicComment) {
          hideElement(analysis.offTopicComment);
          hiddenElementsRef.current.push(analysis.offTopicComment);
        }
      }

      // DEBATE: Show clubbed comment — expand group first, then highlight comment
      if (currentStep.action === 'showClubbedComment' && analysis?.multiGroup) {
        await expandGroup(analysis.multiGroup);
        await wait(400);
        if (analysis.multiGroupComment && !cancelled) {
          showWithAnimation(analysis.multiGroupComment);
          await wait(600);
          highlightResult(analysis.multiGroupComment);
          pulseElement(analysis.multiGroupComment, 4000);
          await scrollToTarget(analysis.multiGroupComment);
        }
      }

      // DEBATE: Show new group + highlight it
      if (currentStep.action === 'showNewGroup' && analysis?.singleGroup) {
        showWithAnimation(analysis.singleGroup);
        await wait(600);
        highlightResult(analysis.singleGroup);
        pulseElement(analysis.singleGroup, 4000);
        await scrollToTarget(analysis.singleGroup);
      }

      // DEBATE: Show counter group + highlight
      if (currentStep.action === 'showCounterGroup' && analysis?.counterGroup) {
        showWithAnimation(analysis.counterGroup);
        await wait(600);
        highlightResult(analysis.counterGroup);
        pulseElement(analysis.counterGroup, 4000);
        await scrollToTarget(analysis.counterGroup);
      }

      // DEBATE: Show off-topic comment + highlight
      if (currentStep.action === 'showOffTopic' && analysis?.offTopicComment) {
        showWithAnimation(analysis.offTopicComment);
        await wait(600);
        highlightResult(analysis.offTopicComment);
        pulseElement(analysis.offTopicComment, 4000);
        // Also scroll down to the off-topic section
        await scrollToTarget(analysis.offTopicComment);
      }

      // NEWS: Hide first card silently
      if (currentStep.action === 'hideNewsCard') {
        // Re-check since we may re-enter
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          hideElement(card);
          hiddenElementsRef.current.push(card);
          analysisRef.current = { ...analysisRef.current, firstNewsCard: card };
        }
      }

      // NEWS: Show the card back
      if (currentStep.action === 'showNewsCard') {
        const card =
          analysisRef.current?.firstNewsCard ||
          document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          showWithAnimation(card);
          await wait(600);
          highlightResult(card);
          pulseElement(card, 4000);
          await scrollToTarget(card);
        }
      }

      // NEWS: Auto-fill the submission form
      if (currentStep.action === 'autoFillNewsForm' && !cancelled) {
        // Wait for page to render
        await wait(800);
        const titleInput = document.querySelector('[data-tour="submit-title"]');
        const descInput = document.querySelector('[data-tour="submit-description"]');
        const linkInput = document.querySelector('[data-tour="submit-link"]');

        if (titleInput) {
          await scrollToTarget(titleInput);
          await wait(200);
          await typeIntoInput(titleInput, NEWS_MOCK.title, 25);
          clearedInputsRef.current.push('[data-tour="submit-title"]');
        }
        if (descInput && !cancelled) {
          await wait(300);
          await typeIntoInput(descInput, NEWS_MOCK.description, 12);
          clearedInputsRef.current.push('[data-tour="submit-description"]');
        }
        if (linkInput && !cancelled) {
          await wait(300);
          await typeIntoInput(linkInput, NEWS_MOCK.link, 20);
          clearedInputsRef.current.push('[data-tour="submit-link"]');
        }
      }

      // NEWS: Stream comments animation
      if (currentStep.action === 'streamComments' && !cancelled) {
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          const cards = section.querySelectorAll('.p-3.bg-gray-50, .p-3.bg-gray-700, [data-tour="home-comment-card"]');
          cards.forEach((c) => {
            c.style.opacity = '0';
            c.style.transform = 'translateX(-20px)';
          });
          await wait(400);
          for (let i = 0; i < cards.length && !cancelled; i++) {
            cards[i].style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            cards[i].style.opacity = '1';
            cards[i].style.transform = 'translateX(0)';
            await wait(280);
          }
        }
      }

      // NEWS: Highlight expert voting on first comment
      if (currentStep.action === 'highlightExpertVoting' && !cancelled) {
        const firstComment = document.querySelector('[data-tour="home-comment-card"]');
        if (firstComment) {
          highlightResult(firstComment);
          pulseElement(firstComment, 3000);
          await scrollToTarget(firstComment);
        }
      }

      // ───── AUTO-TYPE ─────
      if (currentStep.autoType && !cancelled) {
        const sel = currentStep.autoType.selector;
        await scrollToTarget(sel);
        await wait(300);
        await typeIntoInput(sel, currentStep.autoType.text);
        clearedInputsRef.current.push(sel);
      }

      // ───── HIGHLIGHT SEND BUTTON ─────
      if (currentStep.highlightSendBtn && !cancelled) {
        await wait(200);
        // Debate send button
        const debateSend = document.querySelector(
          '[data-tour="debate-room-comment-input"] button[type="submit"]',
        );
        if (debateSend) highlightAction(debateSend);
        // News comment post button — sibling of the input
        const newsInput = document.querySelector('[data-tour="home-comment-input"]');
        if (newsInput) {
          const sib = newsInput.nextElementSibling;
          if (sib?.tagName === 'BUTTON') highlightAction(sib);
        }
      }

      // ───── HIGHLIGHT CLICK TARGET ─────
      if (currentStep.highlightClickTarget && currentStep.target && !cancelled) {
        const el = document.querySelector(currentStep.target);
        if (el) highlightAction(el);
      }

      // ───── SET WAITING ─────
      if (currentStep.waitForClick && !cancelled) {
        setWaitingForUser(true);
        setWaitAction(currentStep.waitForClick);
      }

      if (!cancelled) setActionRunning(false);
    };

    exec();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentStepIndex, stepsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle user clicking highlighted element ──
  const handleUserAction = useCallback(() => {
    unhighlightAll();

    // Clear typed text after send actions
    if (waitAction === 'send' || waitAction === 'post-comment') {
      clearInput('[data-tour="debate-room-comment-input"] textarea');
      clearInput('[data-tour="home-comment-input"]');
    }

    // Navigation actions for news tour
    if (waitAction === 'navigate-submit') {
      tourPhaseRef.current = 'news-submit';
      navigate('/submit-news');
      // Small delay for page to mount, then advance
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 800);
      return;
    }

    if (waitAction === 'navigate-home') {
      // Clear the form inputs first
      clearedInputsRef.current.forEach((s) => clearInput(s));
      clearedInputsRef.current = [];
      tourPhaseRef.current = 'news-back';
      navigate('/home');
      // Wait for home page to render
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 1000);
      return;
    }

    setWaitingForUser(false);
    setWaitAction(null);
    setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
  }, [waitAction, navigate]);

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (actionRunning || waitingForUser || currentStepIndex >= steps.length - 1) return;
    setCurrentStepIndex((i) => i + 1);
  }, [actionRunning, waitingForUser, currentStepIndex, steps.length]);

  const goPrev = useCallback(() => {
    if (actionRunning || waitingForUser || currentStepIndex <= 0) return;
    setCurrentStepIndex((i) => i - 1);
  }, [actionRunning, waitingForUser, currentStepIndex]);

  // ── Keyboard ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
      if (waitingForUser) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, waitingForUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup ──
  const handleClose = useCallback(() => {
    hiddenElementsRef.current.forEach((el) => {
      if (el) {
        showElement(el);
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
        el.style.boxShadow = '';
      }
    });
    hiddenElementsRef.current = [];

    clearedInputsRef.current.forEach((s) => clearInput(s));
    clearedInputsRef.current = [];

    unhighlightAll();

    // Reset comment animation styles
    document.querySelectorAll('[data-tour="home-comment-section"] .p-3').forEach((c) => {
      c.style.opacity = '';
      c.style.transform = '';
      c.style.transition = '';
    });

    // If we ended on /submit-news, navigate back home
    if (window.location.pathname === '/submit-news') {
      navigate('/home');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStepIndex(0);
    setSpotlightRect(null);
    setWaitingForUser(false);
    setWaitAction(null);
    setStepsReady(false);
    analysisRef.current = null;
    stepsRef.current = [];
    tourPhaseRef.current = '';
    onClose();
  }, [onClose, navigate]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setPanelMinimized(false);
      setStepsReady(false);
      hiddenElementsRef.current = [];
      clearedInputsRef.current = [];
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  // Show "navigate first" only if not on any relevant page
  if (!isActiveTourPage) {
    return (
      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Navigate First</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            The Live Experience works on the <strong>News Feed</strong> (/home) or inside a{' '}
            <strong>Debate Room</strong>. Navigate there first.
          </p>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (!stepsReady || steps.length === 0) {
    return (
      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4 animate-bounce">🔍</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Analyzing Page...</h3>
          <div className="flex justify-center mt-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // ── Verdict rules panel ──
  const renderVerdictRules = () => (
    <div className="max-h-60 overflow-y-auto pr-1 space-y-3 text-xs">
      <div>
        <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
          📊 Credibility Score Ranges
        </h5>
        <div className="space-y-1">
          {AI_VERDICT_RULES.scoring.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${s.color}`} />
              <span className="font-mono text-gray-700 dark:text-gray-300 w-12">{s.range}</span>
              <span className="text-gray-600 dark:text-gray-400">{s.meaning}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
          🎯 Top Comment Selection
        </h5>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          {AI_VERDICT_RULES.topCommentSelection.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
          ⚖️ Comment Credibility
        </h5>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          {AI_VERDICT_RULES.credibilityFactors.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
          🤖 AI Evaluation Criteria
        </h5>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          {AI_VERDICT_RULES.aiEvaluation.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mb-1.5 uppercase tracking-wider">
          🗳️ Voting Thresholds
        </h5>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          {AI_VERDICT_RULES.verificationThresholds.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Build panel style from panelPos
  const panelStyle = {
    pointerEvents: 'auto',
    position: panelPos.position || 'fixed',
    width: panelMinimized ? '56px' : '420px',
    maxWidth: 'calc(100vw - 48px)',
    transition: 'top 0.4s ease, left 0.4s ease, bottom 0.4s ease, right 0.4s ease',
    zIndex: 99999,
  };
  if (panelPos.top !== undefined) panelStyle.top = panelPos.top;
  if (panelPos.bottom !== undefined) panelStyle.bottom = panelPos.bottom;
  if (panelPos.left !== undefined) panelStyle.left = panelPos.left;
  if (panelPos.right !== undefined) panelStyle.right = panelPos.right;

  return (
    <div className="fixed inset-0 z-[99998]" style={{ pointerEvents: 'none' }}>
      {/* ── Spotlight Overlay ── */}
      <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="real-exp-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#real-exp-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* ── Pulsing ring ── */}
      {spotlightRect && (
        <div
          className="fixed rounded-xl pointer-events-none"
          style={{
            left: spotlightRect.left - 3,
            top: spotlightRect.top - 3,
            width: spotlightRect.width + 6,
            height: spotlightRect.height + 6,
            boxShadow: '0 0 0 3px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3)',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }}
        />
      )}

      {/* ── Clickable passthrough ── */}
      {spotlightRect && waitingForUser && (
        <div
          className="fixed cursor-pointer z-[99999]"
          style={{
            pointerEvents: 'auto',
            left: spotlightRect.left,
            top: spotlightRect.top,
            width: spotlightRect.width,
            height: spotlightRect.height,
            background: 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleUserAction();
          }}
        />
      )}

      {/* ── Floating Guide Panel ── */}
      <div style={panelStyle}>
        {panelMinimized ? (
          <button
            onClick={() => setPanelMinimized(false)}
            className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-2xl flex items-center justify-center text-white text-xl hover:scale-110 transition-transform"
            title="Expand guide"
          >
            {currentStep?.icon || '🚀'}
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full bg-gradient-to-r ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}
                >
                  {currentStep?.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {currentStep?.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {currentStep?.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  onClick={() => setPanelMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                  title="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                  title="Close tour"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-3">
              {currentStep?.isRulesStep ? (
                renderVerdictRules()
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {currentStep?.description}
                </p>
              )}

              {actionRunning && (
                <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent" />
                  <span className="text-xs font-medium">Working...</span>
                </div>
              )}
            </div>

            {/* Status badges */}
            <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[10px] font-bold text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE on page
              </span>

              {waitingForUser && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-bounce">
                  👆 Click the highlighted element!
                </span>
              )}

              {currentStep?.action?.startsWith('show') && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-[10px] font-bold text-green-600 dark:text-green-400">
                  ✨ Result highlighted!
                </span>
              )}
            </div>

            {/* Navigation */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentStepIndex === 0 || actionRunning || waitingForUser}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ← Back
              </button>

              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentStepIndex
                        ? `w-4 h-1.5 bg-gradient-to-r ${currentStep?.gradient || 'from-blue-500 to-indigo-600'}`
                        : i < currentStepIndex
                          ? 'w-1.5 h-1.5 bg-blue-400'
                          : 'w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {currentStepIndex < steps.length - 1 ? (
                waitingForUser ? (
                  <button
                    disabled
                    className="px-4 py-1.5 text-xs font-semibold text-gray-400 rounded-lg bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
                  >
                    Waiting...
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    disabled={actionRunning}
                    className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50`}
                  >
                    Next →
                  </button>
                )
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 transition-opacity shadow-sm"
                >
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.3), 0 0 30px rgba(59,130,246,0.4); }
        }
      `}</style>
    </div>
  );
};

export default RealExperienceJourney;

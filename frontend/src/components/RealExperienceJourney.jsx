import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * RealExperienceJourney — Live DOM-manipulating tour
 *
 * Instead of showing features in a modal, this component:
 * - Highlights REAL page elements with a spotlight overlay
 * - Auto-types into real input fields
 * - Clicks real toggle buttons (AI analysis, comments)
 * - Shows a floating guide panel with narration
 * - Cleans up all changes when closed
 */

// ─── DOM Helpers ────────────────────────────────────────────────────────────

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrollToTarget = (selector) => {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(resolve, 600);
    } else {
      resolve();
    }
  });
};

const clickTarget = (selector) => {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      setTimeout(resolve, 400);
    } else {
      resolve();
    }
  });
};

/**
 * Type text into a real React-controlled input field char by char.
 * Uses native value setter to trigger React's onChange.
 */
const typeIntoInput = (selector, text, speed = 40) => {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (!el) { resolve(); return; }
    el.focus();
    let i = 0;
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!nativeSetter) { resolve(); return; }

    const interval = setInterval(() => {
      i++;
      nativeSetter.call(el, text.slice(0, i));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(resolve, 300);
      }
    }, speed);
  });
};

const clearInput = (selector) => {
  const el = document.querySelector(selector);
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

// ─── Step Definitions ───────────────────────────────────────────────────────

const newsExperienceSteps = [
  {
    id: 'welcome',
    target: null,
    icon: '🚀',
    title: 'Live Experience Starting',
    subtitle: 'News Verification Journey',
    description: 'Watch VoxVeritas features activate on the REAL page. Everything you see happens on the actual website — no simulations!',
    gradient: 'from-blue-600 to-indigo-700',
    action: null,
  },
  {
    id: 'news-card',
    target: '[data-tour="home-first-news-card"]',
    icon: '📰',
    title: 'A Real News Article',
    subtitle: 'Community-submitted content',
    description: 'This is an ACTUAL news article submitted by the community. Notice the verification status badge — it starts as "Pending" and changes based on community voting and AI analysis.',
    gradient: 'from-blue-500 to-cyan-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-first-news-card"]');
    },
  },
  {
    id: 'voting',
    target: '[data-tour="home-voting-buttons"]',
    icon: '🗳️',
    title: 'Community Voting System',
    subtitle: 'Democratic fact-checking',
    description: 'These are the REAL voting buttons. When enough users vote, the article status automatically updates. The upvote/downvote ratio drives the verification status through defined thresholds.',
    gradient: 'from-green-500 to-emerald-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-voting-buttons"]');
    },
  },
  {
    id: 'ai-expand',
    target: '[data-tour="home-ai-analysis"]',
    icon: '🤖',
    title: 'Opening AI Analysis...',
    subtitle: 'Google Gemini powered',
    description: 'Watch as we open the AI analysis panel LIVE on the page. This uses Google Gemini to analyze article content, sources, and patterns.',
    gradient: 'from-purple-500 to-violet-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-ai-analysis"]');
      await wait(400);
      // Click only if AI section is currently closed (toggle it open)
      const aiSection = document.querySelector('[data-tour="home-ai-verdict"]');
      if (!aiSection || aiSection.offsetParent === null) {
        await clickTarget('[data-tour="home-ai-analysis"]');
      }
    },
    isToggle: true, // Mark as toggle for cleanup
    toggleTarget: '[data-tour="home-ai-analysis"]',
  },
  {
    id: 'ai-verdict',
    target: '[data-tour="home-ai-verdict"]',
    icon: '📊',
    title: 'AI Verdict Result',
    subtitle: 'Machine learning analysis',
    description: 'This is the REAL AI verdict — showing the article analysis with confidence percentage. The AI examines content patterns, source credibility, and cross-references known facts.',
    gradient: 'from-purple-600 to-blue-700',
    action: async () => {
      await scrollToTarget('[data-tour="home-ai-verdict"]');
    },
  },
  {
    id: 'comments-open',
    target: '[data-tour="home-comments-btn"]',
    icon: '💬',
    title: 'Opening Comments...',
    subtitle: 'Stance-based discussion',
    description: 'Watch as we open the REAL comments section. Every comment in VoxVeritas has a stance tag — In Favor, Against, or General — enabling structured discourse.',
    gradient: 'from-amber-500 to-orange-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-comments-btn"]');
      await wait(400);
      const commentSection = document.querySelector('[data-tour="home-comment-section"]');
      if (!commentSection) {
        await clickTarget('[data-tour="home-comments-btn"]');
      }
    },
    isToggle: true,
    toggleTarget: '[data-tour="home-comments-btn"]',
  },
  {
    id: 'comment-cards',
    target: '[data-tour="home-comment-section"]',
    icon: '🗂️',
    title: 'Real Comments',
    subtitle: 'Community discussion',
    description: 'These are REAL comments from community members and verified experts. Notice the stance badges and expert verification shields.',
    gradient: 'from-teal-500 to-cyan-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-comment-section"]');
    },
  },
  {
    id: 'stance-select',
    target: '[data-tour="home-stance-selector"]',
    icon: '🏷️',
    title: 'Stance Selection',
    subtitle: 'Pick your position',
    description: 'Before commenting, users choose their stance. This powers the AI comment grouping — categorizing opinions into supporting, opposing, and general viewpoints.',
    gradient: 'from-indigo-500 to-blue-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-stance-selector"]');
    },
  },
  {
    id: 'comment-type',
    target: '[data-tour="home-comment-input"]',
    icon: '✍️',
    title: 'Watch Live Typing...',
    subtitle: 'Real input field',
    description: 'Watch text appear in the REAL comment field below. This is the actual input — not a simulation!',
    gradient: 'from-pink-500 to-rose-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-comment-input"]');
      await wait(300);
      await typeIntoInput(
        '[data-tour="home-comment-input"]',
        'This article is well-sourced and the methodology matches recent IPCC findings. The peer-review process adds credibility.'
      );
    },
    inputTarget: '[data-tour="home-comment-input"]', // Mark for cleanup
  },
  {
    id: 'group-topic',
    target: '[data-tour="home-group-comments"]',
    icon: '📂',
    title: 'AI Comment Grouping',
    subtitle: 'Agentic AI clustering',
    description: 'The "Group by Topic" button activates the Agentic AI — it clusters comments into meaningful topic groups using tool-calling. Similar comments get organized together for easier understanding.',
    gradient: 'from-teal-500 to-emerald-600',
    action: async () => {
      await scrollToTarget('[data-tour="home-group-comments"]');
    },
  },
  {
    id: 'complete',
    target: null,
    icon: '🎉',
    title: 'News Experience Complete!',
    subtitle: 'All features demonstrated live',
    description: 'You\'ve seen VoxVeritas news verification features operating on the REAL page! Head to a Debate Room for the debate experience.',
    gradient: 'from-amber-500 to-yellow-500',
    action: null,
  },
];

const debateExperienceSteps = [
  {
    id: 'welcome',
    target: null,
    icon: '⚔️',
    title: 'Debate Room Live Experience',
    subtitle: 'Structured argumentation',
    description: 'You\'re in a REAL debate room. Watch as we demonstrate the AI-powered structured argument system live on the actual page!',
    gradient: 'from-red-500 to-orange-600',
    action: null,
  },
  {
    id: 'header',
    target: '[data-tour="debate-room-header"]',
    icon: '📋',
    title: 'Debate Room Overview',
    subtitle: 'Topic & participants',
    description: 'Every debate has a topic, participant count, and description. The structured format ensures equal representation of all viewpoints.',
    gradient: 'from-blue-500 to-indigo-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-header"]');
    },
  },
  {
    id: 'view-toggle',
    target: '[data-tour="debate-room-view-toggle"]',
    icon: '👁️',
    title: 'View Controls',
    subtitle: 'Groups & Counter-Chat',
    description: 'Toggle between Groups View (clustered arguments) and Counter-Chat View (side-by-side comparisons). The "Relink Groups" button re-runs AI to optimize groupings.',
    gradient: 'from-purple-500 to-violet-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-view-toggle"]');
    },
  },
  {
    id: 'type-argument',
    target: '[data-tour="debate-room-comment-input"]',
    icon: '✍️',
    title: 'Writing a Real Argument...',
    subtitle: 'Watch live typing',
    description: 'Watch as text appears in the REAL comment field. In actual use, posting this would trigger AI to instantly group the argument.',
    gradient: 'from-indigo-500 to-blue-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-comment-input"]');
      await wait(300);
      await typeIntoInput(
        '[data-tour="debate-room-comment-input"] textarea',
        'AI moderation can process millions of posts instantly, catching harmful content that human moderators would miss due to sheer volume.'
      );
    },
    inputTarget: '[data-tour="debate-room-comment-input"] textarea',
  },
  {
    id: 'groups',
    target: '[data-tour="debate-room-groups"]',
    icon: '📂',
    title: 'AI-Grouped Arguments',
    subtitle: 'FOR vs AGAINST clusters',
    description: 'Arguments are automatically clustered into thematic groups by AI. The left column shows FOR arguments, the right shows AGAINST. Each group has a title and description generated by AI.',
    gradient: 'from-green-500 to-emerald-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-groups"]');
    },
  },
  {
    id: 'group-card',
    target: '[data-tour="debate-room-group-card"]',
    icon: '🗃️',
    title: 'Argument Group Card',
    subtitle: 'AI-generated cluster',
    description: 'Each card contains related arguments grouped by AI. The group title and description are AI-generated to summarize the common theme. Individual comments are listed inside.',
    gradient: 'from-emerald-500 to-teal-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-group-card"]');
    },
  },
  {
    id: 'counter-links',
    target: '[data-tour="debate-room-counter-links"]',
    icon: '🔗',
    title: 'Counter-Link Pairs',
    subtitle: 'AI-matched opposing views',
    description: 'Each group is automatically matched with its strongest opposing group. The match percentage shows how directly they counter each other — enabling balanced discourse.',
    gradient: 'from-pink-500 to-rose-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-counter-links"]');
    },
  },
  {
    id: 'ideal-counters',
    target: '[data-tour="debate-room-ideal-counters"]',
    icon: '🧠',
    title: 'AI Ideal Counter-Arguments',
    subtitle: 'Suggested rebuttals',
    description: 'AI generates the strongest possible counter-argument for each group — describing what the ideal rebuttal would address and why. Helps users construct better arguments.',
    gradient: 'from-violet-500 to-purple-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-ideal-counters"]');
    },
  },
  {
    id: 'ungrouped',
    target: '[data-tour="debate-room-ungrouped"]',
    icon: '🚫',
    title: 'Off-Topic & Ungrouped',
    subtitle: 'AI moderation',
    description: 'Comments that don\'t fit any group or are off-topic get placed here. This AI moderation keeps the main debate focused and on-track.',
    gradient: 'from-gray-500 to-slate-600',
    action: async () => {
      await scrollToTarget('[data-tour="debate-room-ungrouped"]');
    },
  },
  {
    id: 'complete',
    target: null,
    icon: '🎉',
    title: 'Debate Experience Complete!',
    subtitle: 'All debate features demonstrated',
    description: 'You\'ve seen the real AI-powered debate system in action — grouping, counter-linking, ideal counters, and off-topic detection all working on the live page!',
    gradient: 'from-amber-500 to-yellow-500',
    action: null,
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────

const RealExperienceJourney = ({ isOpen, onClose, currentPath }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [actionRunning, setActionRunning] = useState(false);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const openedTogglesRef = useRef([]);
  const clearedInputsRef = useRef([]);
  const animFrameRef = useRef(null);

  const steps = useMemo(() => {
    if (currentPath === '/home') return newsExperienceSteps;
    if (currentPath?.startsWith('/debate-room/')) return debateExperienceSteps;
    return [];
  }, [currentPath]);

  const currentStep = steps[currentStepIndex];
  const isUnavailable = steps.length === 0;

  // ── Spotlight tracking (updates on scroll/resize) ──
  const updateSpotlight = useCallback(() => {
    if (!currentStep?.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect({
        left: rect.left - 8,
        top: rect.top - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const onUpdate = () => {
      updateSpotlight();
      animFrameRef.current = requestAnimationFrame(onUpdate);
    };
    animFrameRef.current = requestAnimationFrame(onUpdate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, updateSpotlight]);

  // ── Execute step action when step changes ──
  useEffect(() => {
    if (!isOpen || !currentStep?.action) return;
    let cancelled = false;
    setActionRunning(true);
    currentStep.action().then(() => {
      if (!cancelled) {
        setActionRunning(false);
        // Track toggles and inputs for cleanup
        if (currentStep.isToggle && currentStep.toggleTarget) {
          openedTogglesRef.current.push(currentStep.toggleTarget);
        }
        if (currentStep.inputTarget) {
          clearedInputsRef.current.push(currentStep.inputTarget);
        }
      }
    });
    return () => { cancelled = true; };
  }, [isOpen, currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (actionRunning || currentStepIndex >= steps.length - 1) return;
    setCurrentStepIndex(i => i + 1);
  }, [actionRunning, currentStepIndex, steps.length]);

  const goPrev = useCallback(() => {
    if (actionRunning || currentStepIndex <= 0) return;
    setCurrentStepIndex(i => i - 1);
  }, [actionRunning, currentStepIndex]);

  // ── Keyboard nav ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup & close ──
  const handleClose = useCallback(() => {
    // Clear any text we typed into inputs
    clearedInputsRef.current.forEach(selector => clearInput(selector));
    clearedInputsRef.current = [];

    // Revert toggles we opened (click again to close)
    // We reverse so we close in LIFO order
    [...openedTogglesRef.current].reverse().forEach(selector => {
      const el = document.querySelector(selector);
      if (el) el.click();
    });
    openedTogglesRef.current = [];

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setCurrentStepIndex(0);
    setSpotlightRect(null);
    onClose();
  }, [onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setPanelMinimized(false);
      openedTogglesRef.current = [];
      clearedInputsRef.current = [];
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (isUnavailable) {
    return (
      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Navigate First</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            The Live Experience works on the <strong>News Feed</strong> (/home) or inside a <strong>Debate Room</strong>. Please navigate to one of those pages first.
          </p>
          <button onClick={handleClose} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Got it
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[99998]" style={{ pointerEvents: 'none' }}>
      {/* ── Spotlight Overlay (SVG mask) ── */}
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
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#real-exp-mask)" style={{ pointerEvents: 'auto' }} />
      </svg>

      {/* ── Pulsing highlight ring ── */}
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

      {/* ── Floating Guide Panel ── */}
      <div
        className="fixed z-[99999] transition-all duration-300"
        style={{
          pointerEvents: 'auto',
          bottom: panelMinimized ? '16px' : '24px',
          right: '24px',
          width: panelMinimized ? '56px' : '380px',
        }}
      >
        {panelMinimized ? (
          /* Minimized pill */
          <button
            onClick={() => setPanelMinimized(false)}
            className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-2xl flex items-center justify-center text-white text-xl hover:scale-110 transition-transform"
            title="Expand guide"
          >
            {currentStep?.icon || '🚀'}
          </button>
        ) : (
          /* Full panel */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Gradient progress bar */}
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full bg-gradient-to-r ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Header with controls */}
            <div className="px-5 pt-4 pb-2 flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                  {currentStep?.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{currentStep?.title}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{currentStep?.subtitle}</p>
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

            {/* Description */}
            <div className="px-5 pb-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentStep?.description}
              </p>
              {actionRunning && (
                <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent" />
                  <span className="text-xs font-medium">Executing action...</span>
                </div>
              )}
            </div>

            {/* LIVE badge */}
            <div className="px-5 pb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[10px] font-bold text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE on page
              </span>
            </div>

            {/* Navigation */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentStepIndex === 0 || actionRunning}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ← Back
              </button>

              {/* Step counter */}
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
                <button
                  onClick={goNext}
                  disabled={actionRunning}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r ${currentStep?.gradient || 'from-blue-500 to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50`}
                >
                  Next →
                </button>
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

      {/* ── Custom animations ── */}
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

/**
 * RealExperienceJourney — Interactive Hide/Show Tour (v3)
 *
 * Modular architecture — see sibling files for helpers, analyzers, and steps.
 *
 * v3 KEY FIXES:
 * - Async analyzeDebateRoom expands ALL groups behind loading screen
 * - Re-query pattern: findGroup(title, stance), findCommentInGroup(), findOffTopic()
 * - Stance selection before every debate comment
 * - Typed text = ACTUAL hidden element text (no mock mismatch)
 * - News card appears WITHOUT engagement; voting/comments/verdict revealed step by step
 * - Programmatic clicks for open-comments, vote, group-comments
 * - CSS injection hides first card during navigation transitions
 * - Counter badge highlighting (Linked / View Counter)
 * - Faster typing speed (6-10ms)
 * - Robust cleanup via [data-tour-hidden="true"] query
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { wait, scrollToTarget, typeIntoInput, clearInput } from './domHelpers';
import {
  hideElement,
  showElement,
  showWithAnimation,
  pulseElement,
  highlightResult,
  highlightAction,
  unhighlightAll,
  expandGroup,
  selectStance,
} from './hideShow';
import {
  analyzeDebateRoom,
  findGroup,
  findCommentInGroup,
  findOffTopic,
} from './debateAnalyzer';
import { analyzeNewsFeed } from './newsAnalyzer';
import { buildDebateSteps } from './debateSteps';
import { buildNewsSteps } from './newsSteps';
import { calcPanelPosition } from './panelPosition';
import VerdictRulesPanel from './VerdictRulesPanel';

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
  const isActiveTourPage = isDebate || isHome || isSubmitPage;

  // ── Analyze page & build steps ──
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      if (isDebate) {
        // ASYNC: expands all groups behind loading screen
        const analysis = await analyzeDebateRoom();
        analysisRef.current = analysis;
        stepsRef.current = buildDebateSteps(analysis);
        tourPhaseRef.current = 'debate';
      } else if (isHome || isSubmitPage) {
        // News tour — can start from /home or /submit-news
        if (tourPhaseRef.current === 'news-submit' && isSubmitPage) {
          setStepsReady(true);
          return;
        }
        if (tourPhaseRef.current === 'news-back' && isHome) {
          setStepsReady(true);
          return;
        }
        const analysis = analyzeNewsFeed();
        analysisRef.current = analysis;
        stepsRef.current = buildNewsSteps(analysis);
        tourPhaseRef.current = 'news-home';
      }
      setStepsReady(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [isOpen, currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = stepsRef.current;
  const currentStep = steps[currentStepIndex];

  // ── Spotlight + panel position tracking ──
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

      // ═══════════════════════════════════════════════════════════════════
      // DEBATE ACTIONS
      // ═══════════════════════════════════════════════════════════════════

      // DEBATE: Hide elements on welcome (silently)
      if (currentStep.action === 'hideDebateElements' && analysis) {
        // Hide a comment inside the multi-comment group
        if (analysis.multiGroupTitle && analysis.multiGroupCommentTextPrefix) {
          const grp = findGroup(analysis.multiGroupTitle, analysis.multiGroupStance);
          if (grp) {
            const comment = findCommentInGroup(grp, analysis.multiGroupCommentTextPrefix);
            if (comment) {
              hideElement(comment);
              hiddenElementsRef.current.push(comment);
            }
          }
        }
        // Hide the entire single-comment group
        if (analysis.singleGroupTitle) {
          const grp = findGroup(analysis.singleGroupTitle, analysis.singleGroupStance);
          if (grp) {
            hideElement(grp);
            hiddenElementsRef.current.push(grp);
          }
        }
        // Hide the counter group
        if (analysis.counterGroupTitle) {
          const grp = findGroup(analysis.counterGroupTitle, analysis.counterGroupStance);
          if (grp) {
            hideElement(grp);
            hiddenElementsRef.current.push(grp);
          }
        }
        // Hide off-topic comment
        if (analysis.offTopicTextPrefix) {
          const el = findOffTopic(analysis.offTopicTextPrefix);
          if (el) {
            hideElement(el);
            hiddenElementsRef.current.push(el);
          }
        }
      }

      // DEBATE: Show clubbed comment — re-query, expand, reveal, highlight
      if (currentStep.action === 'showClubbedComment' && analysis?.multiGroupTitle) {
        const grp = findGroup(analysis.multiGroupTitle, analysis.multiGroupStance);
        if (grp) {
          await expandGroup(grp);
          await wait(400);
          if (!cancelled) {
            const comment = findCommentInGroup(grp, analysis.multiGroupCommentTextPrefix);
            if (comment) {
              showWithAnimation(comment);
              await wait(600);
              highlightResult(comment);
              pulseElement(comment, 4000);
              await scrollToTarget(comment);
            }
          }
        }
      }

      // DEBATE: Show new group — re-query, reveal, highlight
      if (currentStep.action === 'showNewGroup' && analysis?.singleGroupTitle) {
        const grp = findGroup(analysis.singleGroupTitle, analysis.singleGroupStance);
        if (grp) {
          showWithAnimation(grp);
          await wait(600);
          highlightResult(grp);
          pulseElement(grp, 4000);
          await scrollToTarget(grp);
        }
      }

      // DEBATE: Show counter group — re-query, reveal, highlight + badges
      if (currentStep.action === 'showCounterGroup' && analysis?.counterGroupTitle) {
        const grp = findGroup(analysis.counterGroupTitle, analysis.counterGroupStance);
        if (grp) {
          showWithAnimation(grp);
          await wait(600);
          highlightResult(grp);
          pulseElement(grp, 4000);
          await scrollToTarget(grp);

          // Highlight counter badges (Linked / View Counter)
          if (!cancelled) {
            const innerCard = grp.querySelector('.rounded-lg.p-4.border');
            if (innerCard) {
              const allBtns = innerCard.querySelectorAll('button');
              allBtns.forEach((btn) => {
                const text = btn.textContent?.trim() || '';
                if (text.includes('Linked') || text.includes('View Counter')) {
                  btn.style.transition = 'all 0.3s ease';
                  btn.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.7), 0 0 16px rgba(249,115,22,0.35)';
                  btn.style.transform = 'scale(1.05)';
                }
              });
            }
          }
        }
      }

      // DEBATE: Show off-topic — re-query, reveal, highlight
      if (currentStep.action === 'showOffTopic' && analysis?.offTopicTextPrefix) {
        const el = findOffTopic(analysis.offTopicTextPrefix);
        if (el) {
          showWithAnimation(el);
          await wait(600);
          highlightResult(el);
          pulseElement(el, 4000);
          await scrollToTarget(el);
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // NEWS ACTIONS
      // ═══════════════════════════════════════════════════════════════════

      // NEWS: Hide first card + inject CSS for navigation persistence
      if (currentStep.action === 'hideNewsCard') {
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          hideElement(card);
          hiddenElementsRef.current.push(card);
        }
        // Inject CSS to keep it hidden during nav transitions
        const style = document.createElement('style');
        style.setAttribute('data-tour-style', 'hide-first-card');
        style.textContent = '[data-tour="home-first-news-card"] { display: none !important; }';
        document.head.appendChild(style);
      }

      // NEWS: Show card WITHOUT engagement (voting, comments btn, AI verdict hidden)
      if (currentStep.action === 'showNewsCardWithoutEngagement') {
        // Remove injected CSS
        document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          // Hide engagement elements BEFORE showing the card
          const votingBtns = card.querySelector('[data-tour="home-voting-buttons"]');
          const commentsBtn = card.querySelector('[data-tour="home-comments-btn"]');
          const aiVerdict = card.querySelector('[data-tour="home-ai-verdict"]');

          if (votingBtns) {
            hideElement(votingBtns);
            hiddenElementsRef.current.push(votingBtns);
          }
          if (commentsBtn) {
            hideElement(commentsBtn);
            hiddenElementsRef.current.push(commentsBtn);
          }
          if (aiVerdict) {
            hideElement(aiVerdict);
            hiddenElementsRef.current.push(aiVerdict);
          }

          // Now show the card
          showWithAnimation(card);
          await wait(600);
          highlightResult(card);
          pulseElement(card, 4000);
          await scrollToTarget(card);
        }
      }

      // NEWS: Reveal voting buttons
      if (currentStep.action === 'revealVoting') {
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const votingBtns = card.querySelector('[data-tour="home-voting-buttons"]');
          if (votingBtns) {
            showWithAnimation(votingBtns);
            await wait(400);
          }
        }
      }

      // NEWS: Reveal comments button
      if (currentStep.action === 'revealCommentsBtn') {
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const commentsBtn = card.querySelector('[data-tour="home-comments-btn"]');
          if (commentsBtn) {
            showWithAnimation(commentsBtn);
            await wait(400);
          }
        }
      }

      // NEWS: Reveal AI verdict section
      if (currentStep.action === 'revealAiVerdict') {
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const aiVerdict = card.querySelector('[data-tour="home-ai-verdict"]');
          if (aiVerdict) {
            showWithAnimation(aiVerdict);
            await wait(400);
          }
        }
      }

      // NEWS: Auto-fill the submission form with ACTUAL card content
      if (currentStep.action === 'autoFillNewsForm' && !cancelled) {
        await wait(800);
        const titleInput = document.querySelector('[data-tour="submit-title"]');
        const descInput = document.querySelector('[data-tour="submit-description"]');
        const linkInput = document.querySelector('[data-tour="submit-link"]');

        const newsTitle = analysis?.newsTitle || 'Breaking News';
        const newsDesc = analysis?.newsDescription || '';
        const newsLink = analysis?.newsLink || '';

        if (titleInput) {
          await scrollToTarget(titleInput);
          await wait(200);
          await typeIntoInput(titleInput, newsTitle, 8);
          clearedInputsRef.current.push('[data-tour="submit-title"]');
        }
        if (descInput && !cancelled) {
          await wait(300);
          await typeIntoInput(descInput, newsDesc, 6);
          clearedInputsRef.current.push('[data-tour="submit-description"]');
        }
        if (linkInput && !cancelled) {
          await wait(300);
          await typeIntoInput(linkInput, newsLink, 10);
          clearedInputsRef.current.push('[data-tour="submit-link"]');
        }
      }

      // NEWS: Stream comments animation
      if (currentStep.action === 'streamComments' && !cancelled) {
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          const cards = section.querySelectorAll(
            '.p-3.bg-gray-50, .p-3.bg-gray-700, [data-tour="home-comment-card"]',
          );
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

      // ═══════════════════════════════════════════════════════════════════
      // COMMON: STANCE SELECTION (debate steps)
      // ═══════════════════════════════════════════════════════════════════

      if (currentStep.stanceToSelect && !cancelled) {
        await selectStance(currentStep.stanceToSelect);
      }

      // ═══════════════════════════════════════════════════════════════════
      // COMMON: AUTO-TYPE
      // ═══════════════════════════════════════════════════════════════════

      if (currentStep.autoType && !cancelled) {
        const sel = currentStep.autoType.selector;
        await scrollToTarget(sel);
        await wait(300);
        await typeIntoInput(sel, currentStep.autoType.text);
        clearedInputsRef.current.push(sel);
      }

      // ═══════════════════════════════════════════════════════════════════
      // COMMON: HIGHLIGHT SEND BUTTON
      // ═══════════════════════════════════════════════════════════════════

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

      // ═══════════════════════════════════════════════════════════════════
      // COMMON: HIGHLIGHT CLICK TARGET
      // ═══════════════════════════════════════════════════════════════════

      if (currentStep.highlightClickTarget && currentStep.target && !cancelled) {
        const el = document.querySelector(currentStep.target);
        if (el) highlightAction(el);
      }

      // ═══════════════════════════════════════════════════════════════════
      // COMMON: SET WAITING FOR USER
      // ═══════════════════════════════════════════════════════════════════

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

    // Navigation: go to submit page
    if (waitAction === 'navigate-submit') {
      tourPhaseRef.current = 'news-submit';
      navigate('/submit-news');
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 800);
      return;
    }

    // Navigation: submit form → go back home
    if (waitAction === 'navigate-home') {
      clearedInputsRef.current.forEach((s) => clearInput(s));
      clearedInputsRef.current = [];
      tourPhaseRef.current = 'news-back';
      // Re-inject CSS to keep first card hidden during transition
      let style = document.querySelector('[data-tour-style="hide-first-card"]');
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('data-tour-style', 'hide-first-card');
        style.textContent = '[data-tour="home-first-news-card"] { display: none !important; }';
        document.head.appendChild(style);
      }
      navigate('/home');
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 1000);
      return;
    }

    // Vote: programmatically click upvote button
    if (waitAction === 'vote') {
      const votingDiv = document.querySelector('[data-tour="home-voting-buttons"]');
      if (votingDiv) {
        const upBtn = votingDiv.querySelector('button');
        if (upBtn) upBtn.click();
      }
      setWaitingForUser(false);
      setWaitAction(null);
      setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      return;
    }

    // Open comments: programmatically click the comments button
    if (waitAction === 'open-comments') {
      const commentsBtn = document.querySelector('[data-tour="home-comments-btn"]');
      if (commentsBtn) commentsBtn.click();
      // Wait for comments section to mount
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 600);
      return;
    }

    // Group comments: programmatically click "Group by Topic"
    if (waitAction === 'group-comments') {
      const groupBtn = document.querySelector('[data-tour="home-group-comments"]');
      if (groupBtn) groupBtn.click();
      setTimeout(() => {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }, 600);
      return;
    }

    // Generate AI verdict: programmatically click
    if (waitAction === 'generate-verdict') {
      const verdictSection = document.querySelector('[data-tour="home-ai-verdict"]');
      if (verdictSection) {
        const generateBtn = verdictSection.querySelector('button');
        if (generateBtn) generateBtn.click();
      }
      setWaitingForUser(false);
      setWaitAction(null);
      setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      return;
    }

    // Ideal counter: just advance (click was acknowledged)
    if (waitAction === 'ideal-counter') {
      const counterSection = document.querySelector('[data-tour="debate-room-ideal-counters"]');
      if (counterSection) counterSection.click();
      setWaitingForUser(false);
      setWaitAction(null);
      setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      return;
    }

    // Default: advance
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
    // Restore ALL hidden elements via data attribute (robust against stale refs)
    document.querySelectorAll('[data-tour-hidden="true"]').forEach((el) => {
      showElement(el);
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.boxShadow = '';
    });

    // Also iterate our ref list as fallback
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

    // Clear typed inputs
    clearedInputsRef.current.forEach((s) => clearInput(s));
    clearedInputsRef.current = [];

    // Remove all highlights
    unhighlightAll();

    // Remove injected <style> tags
    document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

    // Reset comment animation styles
    document.querySelectorAll('[data-tour="home-comment-section"] .p-3').forEach((c) => {
      c.style.opacity = '';
      c.style.transform = '';
      c.style.transition = '';
    });

    // Navigate back home if on /submit-news
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

  // "Navigate first" screen
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

  // Loading screen
  if (!stepsReady || steps.length === 0) {
    return (
      <div className="fixed inset-0 z-[99998] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4 animate-bounce">🔍</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Analyzing Page...</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Expanding groups & reading content...
          </p>
          <div className="flex justify-center mt-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Build panel style
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
                <VerdictRulesPanel />
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

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

import { wait, scrollToTarget, typeIntoInput, clearInput, waitForElement } from './domHelpers';
import {
  hideElement,
  showElement,
  showWithAnimation,
  pulseElement,
  highlightResult,
  highlightAction,
  popHighlight,
  unhighlightAll, // kept for potential direct use
  cleanupAllTourStyles,
  expandGroup,
  selectStance,
} from './hideShow';

// Mark an element so cleanupAllTourStyles() can find & reset it between steps
const markTourStyled = (el) => { if (el) el.dataset.tourStyled = 'true'; };
import { analyzeDebateRoom, findGroup, findCommentInGroup, findOffTopic } from './debateAnalyzer';
import { analyzeNewsFeed } from './newsAnalyzer';
import { buildDebateSteps } from './debateSteps';
import { buildNewsSteps } from './newsSteps';
import { calcPanelPosition } from './panelPosition';
import { NEWS_MOCK } from './constants';
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
  const [overlayHidden, setOverlayHidden] = useState(false);

  const hiddenElementsRef = useRef([]);
  const clearedInputsRef = useRef([]);
  const analysisRef = useRef(null);
  const animFrameRef = useRef(null);
  const stepsRef = useRef([]);
  const tourPhaseRef = useRef(''); // 'debate' | 'news-home' | 'news-submit' | 'news-back'
  const currentStepHiddenRef = useRef(null); // Track what was hidden for current step
  const observerRef = useRef(null);           // MutationObserver for expand detection
  const clubbedGroupDataRef = useRef(null);   // { groupCard, innerCard, searchPrefix }
  const zeroCountObserverRef = useRef(null);  // MutationObserver that forces vote/comment counts to 0

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
        console.log('[Tour] Starting debate room analysis...');
        const analysis = await analyzeDebateRoom();
        console.log('[Tour] Analysis complete:', {
          hasMultiComment: !!analysis.multiCommentElement,
          multiCommentText: analysis.multiCommentText?.slice(0, 40),
          hasSingleGroup: !!analysis.singleGroupElement,
          singleGroupText: analysis.singleGroupText?.slice(0, 40),
          hasCounterGroup: !!analysis.counterGroupElement,
          hasOffTopic: !!analysis.offTopicElement
        });
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
      const vh = window.innerHeight;
      // Find navbar/footer so the spotlight cutout never overlaps them
      const nav = document.querySelector('nav.sticky, nav.fixed, header.sticky, header.fixed');
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top : vh;

      let srTop = rect.top - 8;
      let srBottom = rect.bottom + 8;
      // Clamp so the spotlight doesn't extend above navbar or below footer
      if (srTop < navBottom) srTop = navBottom;
      if (srBottom > footerTop) srBottom = footerTop;
      // Safety: height must be positive
      const srHeight = Math.max(0, srBottom - srTop);

      const sr = {
        left: rect.left - 8,
        top: srTop,
        width: rect.width + 16,
        height: srHeight,
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
      cleanupAllTourStyles();

      const analysis = analysisRef.current;

      // Scroll to target
      if (currentStep.target) {
        await scrollToTarget(currentStep.target);
        await wait(300);
      }

      // ═══════════════════════════════════════════════════════════════════
      // DEBATE ACTIONS
      // ═══════════════════════════════════════════════════════════════════

      // DEBATE: Hide multi-comment before typing step 1
      if (currentStep.action === 'hideMultiComment' && analysis) {
        console.log('[Action] hideMultiComment — hiding the multi-comment');
        
        if (analysis.isUngroupedOnly && analysis.multiGroupCommentTextPrefix) {
          const multiComment = findOffTopic(analysis.multiGroupCommentTextPrefix);
          if (multiComment) {
            hideElement(multiComment);
            hiddenElementsRef.current.push(multiComment);
            console.log('[Tour] Hidden ungrouped multi-comment');
          }
        } else if (analysis.multiGroupTitle && analysis.multiGroupStance) {
          const multiGroup = findGroup(analysis.multiGroupTitle, analysis.multiGroupStance);
          if (multiGroup) {
            await expandGroup(multiGroup);
            await wait(100);
            const multiComment = findCommentInGroup(multiGroup, analysis.multiGroupCommentTextPrefix);
            if (multiComment) {
              hideElement(multiComment);
              hiddenElementsRef.current.push(multiComment);
              console.log('[Tour] Hidden multi-comment in group');
            }
          }
        }
      }

      // DEBATE: Hide single-comment before typing step 2
      if (currentStep.action === 'hideSingleComment' && analysis) {
        console.log('[Action] hideSingleComment — hiding the single-comment');
        
        if (analysis.isUngroupedOnly && analysis.singleGroupTextPrefix) {
          const singleComment = findOffTopic(analysis.singleGroupTextPrefix);
          if (singleComment) {
            hideElement(singleComment);
            hiddenElementsRef.current.push(singleComment);
            console.log('[Tour] Hidden ungrouped single-comment');
          }
        } else if (analysis.singleGroupTitle && analysis.singleGroupStance) {
          const singleGroup = findGroup(analysis.singleGroupTitle, analysis.singleGroupStance);
          if (singleGroup) {
            hideElement(singleGroup);
            hiddenElementsRef.current.push(singleGroup);
            console.log('[Tour] Hidden single-group');
          }
        }
      }

      // DEBATE: Hide counter-comment before typing step 3
      if (currentStep.action === 'hideCounterComment' && analysis) {
        console.log('[Action] hideCounterComment — hiding the counter-comment');
        
        if (analysis.isUngroupedOnly && analysis.counterGroupTextPrefix) {
          const counterComment = findOffTopic(analysis.counterGroupTextPrefix);
          if (counterComment) {
            hideElement(counterComment);
            hiddenElementsRef.current.push(counterComment);
            console.log('[Tour] Hidden ungrouped counter-comment');
          }
        } else if (analysis.counterGroupTitle && analysis.counterGroupStance) {
          const counterGroup = findGroup(analysis.counterGroupTitle, analysis.counterGroupStance);
          if (counterGroup) {
            hideElement(counterGroup);
            hiddenElementsRef.current.push(counterGroup);
            console.log('[Tour] Hidden counter-group');
          }
        }
      }

      // DEBATE: Hide off-topic comment before typing step 4
      if (currentStep.action === 'hideOffTopicComment' && analysis) {
        console.log('[Action] hideOffTopicComment — hiding the off-topic comment');
        
        if (analysis.offTopicTextPrefix) {
          const offTopic = findOffTopic(analysis.offTopicTextPrefix);
          if (offTopic) {
            hideElement(offTopic);
            hiddenElementsRef.current.push(offTopic);
            console.log('[Tour] Hidden off-topic comment');
          }
        }
      }

      // DEBATE: Show clubbed comment — finds the group that has the comment,
      // styles its expand button with a green glow, then sets up a MutationObserver
      // so that when the USER clicks the button, the tour auto-advances and
      // highlights the newly visible comment.
      if (currentStep.action === 'showClubbedComment' && analysis) {
        console.log('[DBG showClubbedComment] ── START ──');
        console.log('[DBG showClubbedComment] prefix:', analysis.multiGroupCommentTextPrefix?.slice(0, 50));

        // Disconnect any previous observer
        if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }

        // Step 1: wait for the API + React re-render after the post
        await wait(1500);
        if (cancelled) return;

        const searchPrefix = (analysis.multiGroupCommentTextPrefix || '').slice(0, 40).trim();

        // Helper: find a comment card in a container by checking all its <p> texts
        const findInContainer = (container) => {
          for (const child of Array.from(container.children)) {
            for (const p of child.querySelectorAll('p')) {
              const t = p.textContent?.trim() || '';
              if (t.startsWith(searchPrefix) && t.length > 20) return child;
            }
            if (searchPrefix.length >= 20 && child.textContent?.trim().includes(searchPrefix)) return child;
          }
          return null;
        };

        // Step 2: scan every group — expand temporarily to find the right one
        const groupsContainer = document.querySelector('[data-tour="debate-room-groups"]');
        const allGroupCards = groupsContainer ? Array.from(groupsContainer.querySelectorAll('.mb-6')) : [];
        console.log('[DBG showClubbedComment] groups found:', allGroupCards.length);

        let targetInnerCard = null;
        let targetExpandBtn = null;

        for (const groupCard of allGroupCards) {
          if (cancelled) break;
          const innerCard = groupCard.querySelector('.rounded-lg.p-4.border');
          const title = innerCard?.querySelector('h3')?.textContent?.trim()?.slice(0, 50);
          const wasOpen = !!innerCard?.querySelector('.mt-3.space-y-2');
          console.log('[DBG showClubbedComment] checking group:', title, '| open:', wasOpen);

          if (!wasOpen) { await expandGroup(groupCard); await wait(400); }

          const container = innerCard?.querySelector('.mt-3.space-y-2');
          console.log('[DBG showClubbedComment] children:', container?.children?.length ?? 0);

          if (container && findInContainer(container)) {
            console.log('[DBG showClubbedComment] ✓ comment is in group:', title);
            targetInnerCard = innerCard;
            // Save for skip-fallback
            clubbedGroupDataRef.current = { groupCard, innerCard, searchPrefix };
            // Collapse back so the USER clicks to open
            await expandGroup(groupCard, true);
            await wait(350);
            // Re-query expand button AFTER the collapse re-render
            targetExpandBtn = innerCard.querySelector('[data-tour="group-expand-btn"]');
            break;
          } else {
            if (!wasOpen) { await expandGroup(groupCard, true); await wait(200); }
          }
        }

        if (targetInnerCard && !cancelled) {
          // Step 3: style the expand button with a green halo
          // Inline styles survive React re-renders (React doesn’t overwrite styles it didn’t set)
          if (targetExpandBtn) {
            await scrollToTarget(targetExpandBtn);
            await wait(200);
            markTourStyled(targetExpandBtn);
            targetExpandBtn.style.transition = 'all 0.3s ease';
            targetExpandBtn.style.boxShadow = '0 0 0 5px rgba(34,197,94,0.9), 0 0 22px rgba(34,197,94,0.6)';
            targetExpandBtn.style.transform = 'scale(1.6)';
            targetExpandBtn.style.borderRadius = '50%';
            targetExpandBtn.style.background = 'rgba(34,197,94,0.15)';
            console.log('[DBG showClubbedComment] expand button styled with green halo');
          }

          // Step 4: watch for the comments container to appear (user clicked expand)
          observerRef.current = new MutationObserver(() => {
            const commentsContainer = targetInnerCard.querySelector('.mt-3.space-y-2');
            if (!commentsContainer) return;
            // Disconnect at once so it doesn’t fire again
            observerRef.current?.disconnect();
            observerRef.current = null;
            console.log('[DBG showClubbedComment] MutationObserver fired — group expanded by user');
            // Small delay for React to finish rendering all comments
            setTimeout(() => {
              const foundComment = findInContainer(commentsContainer);
              console.log('[DBG showClubbedComment] comment found after user expand:', !!foundComment);
              if (foundComment) {
                if (foundComment.style.display === 'none') showWithAnimation(foundComment);
                popHighlight(foundComment);
                scrollToTarget(foundComment);
                Array.from(commentsContainer.children).forEach((c) => pulseElement(c, 3000));
                highlightResult(targetInnerCard);
              } else {
                // Still highlight the group even if we can’t pinpoint the exact card
                highlightResult(targetInnerCard);
              }
              // Advance the tour
              setWaitingForUser(false);
              setWaitAction(null);
              setCurrentStepIndex((prev) => Math.min(prev + 1, stepsRef.current.length - 1));
            }, 400);
          });
          observerRef.current.observe(targetInnerCard, { childList: true, subtree: true });
          console.log('[DBG showClubbedComment] MutationObserver armed on innerCard ✓');
        } else if (!cancelled) {
          // No group found — ungrouped fallback
          console.log('[DBG showClubbedComment] no group found — ungrouped fallback');
          const multiComment = findOffTopic(analysis.multiGroupCommentTextPrefix);
          if (multiComment) {
            showWithAnimation(multiComment); await wait(600);
            popHighlight(multiComment); await scrollToTarget(multiComment);
          }
        }
      }

      // DEBATE: Show new group using re-query
      if (currentStep.action === 'showNewGroup' && analysis) {
        console.log('[Action] showNewGroup — re-querying single-group');
        
        // Ungrouped mode
        if (analysis.isUngroupedOnly && analysis.singleGroupTextPrefix && !cancelled) {
          const singleComment = findOffTopic(analysis.singleGroupTextPrefix);
          if (singleComment) {
            showWithAnimation(singleComment);
            await wait(600);
            popHighlight(singleComment);
            await scrollToTarget(singleComment);
            console.log('[Tour] Ungrouped single-comment shown');
          }
        // Normal grouped mode
        } else if (analysis.singleGroupTitle && analysis.singleGroupStance && !cancelled) {
          const singleGroup = findGroup(analysis.singleGroupTitle, analysis.singleGroupStance);
          if (singleGroup) {
            showWithAnimation(singleGroup);
            await wait(600);
            popHighlight(singleGroup);
            await scrollToTarget(singleGroup);
            console.log('[Tour] Single-group shown');
          }
        }
      }

      // DEBATE: Show counter group using re-query
      if (currentStep.action === 'showCounterGroup' && analysis) {
        console.log('[Action] showCounterGroup — re-querying counter-group');
        
        // Ungrouped mode
        if (analysis.isUngroupedOnly && analysis.counterGroupTextPrefix && !cancelled) {
          const counterComment = findOffTopic(analysis.counterGroupTextPrefix);
          if (counterComment) {
            showWithAnimation(counterComment);
            await wait(600);
            popHighlight(counterComment);
            await scrollToTarget(counterComment);
            console.log('[Tour] Ungrouped counter-comment shown');
          }
        // Normal grouped mode
        } else if (analysis.counterGroupTitle && analysis.counterGroupStance && !cancelled) {
          const counterGroup = findGroup(analysis.counterGroupTitle, analysis.counterGroupStance);
          if (counterGroup) {
            showWithAnimation(counterGroup);
            await wait(600);
            popHighlight(counterGroup);
            await scrollToTarget(counterGroup);
            
            // Highlight counter-link badges after pop
            await wait(500);
            const counterLinkBtns = counterGroup.querySelectorAll('[data-tour="debate-room-counter-links"] button, button[title*="counter"]');
            counterLinkBtns.forEach((btn) => {
              markTourStyled(btn);
              btn.style.transition = 'all 0.3s ease';
              btn.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.8), 0 0 18px rgba(249,115,22,0.45)';
              btn.style.transform = 'scale(1.08)';
            });
            
            console.log('[Tour] Counter-group shown');
          }
        }
      }

      // DEBATE: Highlight counter pair in Counter Chat View
      if (currentStep.action === 'highlightCounterPairInChat' && analysis && !cancelled) {
        console.log('[DBG highlightCounterPairInChat] ── START ──');
        // Wait for CounterChatView to render after user clicked the toggle
        await wait(1200);
        if (cancelled) return;

        const counterPrefix = (analysis.counterGroupTextPrefix || '').slice(0, 40).trim();
        const counterTitle  = (analysis.counterGroupTitle || '').trim();
        console.log('[DBG highlightCounterPairInChat] looking for counterPrefix:', counterPrefix, '| counterTitle:', counterTitle);

        const threads = document.querySelectorAll('[data-tour="counter-chat-thread"]');
        console.log('[DBG highlightCounterPairInChat] threads found:', threads.length);

        let matchedThread = null;

        for (const thread of threads) {
          // Check every group card ([data-group-id]) in this thread
          const groupCards = thread.querySelectorAll('[data-group-id]');
          for (const card of groupCards) {
            const titleEl = card.querySelector('h3');
            const titleText = titleEl?.textContent?.trim() || '';
            // Match by title
            if (counterTitle && titleText === counterTitle) {
              matchedThread = thread;
              console.log('[DBG highlightCounterPairInChat] ✓ matched by title:', titleText);
              break;
            }
            // Match by comment text prefix (expand each card's comments section to check)
            const commentsSection = card.querySelector('.comments-section');
            if (commentsSection) {
              for (const p of commentsSection.querySelectorAll('p')) {
                const t = p.textContent?.trim() || '';
                if (counterPrefix && t.startsWith(counterPrefix) && t.length > 20) {
                  matchedThread = thread;
                  console.log('[DBG highlightCounterPairInChat] ✓ matched by comment text:', t.slice(0, 60));
                  break;
                }
              }
            }
            if (matchedThread) break;
          }
          if (matchedThread) break;
        }

        if (matchedThread && !cancelled) {
          await scrollToTarget(matchedThread);
          await wait(300);
          // Highlight the whole thread
          markTourStyled(matchedThread);
          matchedThread.style.transition = 'all 0.4s ease';
          matchedThread.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.7), 0 0 32px rgba(236,72,153,0.35)';
          matchedThread.style.borderRadius = '16px';
          matchedThread.style.padding = '12px';
          // Also highlight and expand both sides
          const proCon = matchedThread.querySelectorAll('[data-group-id]');
          proCon.forEach(async (card) => {
            popHighlight(card);
            // Expand the comments: click the "Show N comments" button
            const showBtn = card.querySelector('button.w-full.text-left');
            if (showBtn && showBtn.textContent?.includes('Show')) {
              showBtn.click();
            }
          });
          console.log('[DBG highlightCounterPairInChat] ✓ thread highlighted with', proCon.length, 'cards');
        } else {
          console.warn('[DBG highlightCounterPairInChat] ⚠ no matching thread found');
          // Scroll to top of counter chat so user can at least see the view
          const firstThread = document.querySelector('[data-tour="counter-chat-thread"]');
          if (firstThread) {
            await scrollToTarget(firstThread);
            highlightResult(firstThread);
          }
        }
      }

      // DEBATE: Show off-topic using re-query
      if (currentStep.action === 'showOffTopic' && analysis) {
        console.log('[Action] showOffTopic — re-querying off-topic comment');
        
        if (analysis.offTopicTextPrefix && !cancelled) {
          const offTopic = findOffTopic(analysis.offTopicTextPrefix);
          if (offTopic) {
            showWithAnimation(offTopic);
            await wait(600);
            popHighlight(offTopic);
            await scrollToTarget(offTopic);
            // Also scroll to and highlight the ungrouped section header
            const ungroupedSection = document.querySelector('[data-tour="debate-room-ungrouped"]');
            if (ungroupedSection) {
              await scrollToTarget(ungroupedSection);
              highlightResult(ungroupedSection);
            }
            console.log('[Tour] Off-topic shown');
          }
        }
      }

      // DEBATE: Highlight ideal counter button and wait for user click
      if (currentStep.action === 'highlightIdealCounterBtn' && !cancelled) {
        console.log('[DBG highlightIdealCounterBtn] ── START ──');
        const idealBtns = document.querySelectorAll('[data-tour="debate-ideal-counter-btn"]');
        console.log('[DBG highlightIdealCounterBtn] found', idealBtns.length, 'ideal counter buttons');
        console.log('[DBG highlightIdealCounterBtn] step.target:', currentStep.target);
        console.log('[DBG highlightIdealCounterBtn] spotlightRect at action start:', spotlightRect);

        if (idealBtns.length > 0) {
          // Only highlight the FIRST button — the step target also points to the first one,
          // so the spotlight passthrough div will be rendered over it.
          const firstBtn = idealBtns[0];
          console.log('[DBG highlightIdealCounterBtn] firstBtn:', firstBtn.textContent?.trim(), '| rect:', firstBtn.getBoundingClientRect());
          await scrollToTarget(firstBtn);
          await wait(300);
          highlightAction(firstBtn);
          markTourStyled(firstBtn);
          firstBtn.style.boxShadow = '0 0 0 3px rgba(147,51,234,0.8), 0 0 20px rgba(147,51,234,0.45)';
          firstBtn.style.transform = 'scale(1.12)';
          firstBtn.style.borderRadius = '6px';
          firstBtn.style.padding = '2px 6px';
          // NOTE: After this action completes, setWaitingForUser(true) fires.
          // Because step.target = '[data-tour="debate-ideal-counter-btn"]', spotlightRect
          // will be set to the firstBtn rect, and the passthrough div WILL render,
          // so clicking the spotlight area calls handleUserAction correctly.
          console.log('[DBG highlightIdealCounterBtn] ✓ done — waitForClick will be set to:', currentStep.waitForClick);
        } else {
          console.warn('[DBG highlightIdealCounterBtn] ⚠ No ideal counter buttons found in DOM');
          // Log all data-tour attributes present to help diagnose
          const tourEls = document.querySelectorAll('[data-tour]');
          console.log('[DBG highlightIdealCounterBtn] All [data-tour] elements:', Array.from(tourEls).map(e => e.dataset.tour).join(', '));
        }
      }

      // DEBATE: Highlight Counter Chat View button and wait for user click  
      if (currentStep.action === 'highlightCounterChatBtn' && !cancelled) {
        console.log('[Action] highlightCounterChatBtn — highlighting Counter Chat View button');
        const counterChatBtn = document.querySelector('[data-tour="debate-counter-chat-btn"]');
        if (counterChatBtn) {
          await scrollToTarget(counterChatBtn);
          await wait(300);
          markTourStyled(counterChatBtn);
          counterChatBtn.style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
          counterChatBtn.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.85), 0 0 28px rgba(59,130,246,0.5)';
          counterChatBtn.style.transform = 'scale(1.1)';
          // Scroll to top so user can see the button
          window.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('[Tour] Counter Chat View button highlighted');
        } else {
          console.log('[Tour] Counter Chat View button not found');
        }
      }

      // DEBATE: Highlight Groups View button (same toggle button, now showing "Groups View")
      if (currentStep.action === 'highlightGroupViewBtn' && !cancelled) {
        console.log('[Action] highlightGroupViewBtn — highlighting Groups View button');
        const groupViewBtn = document.querySelector('[data-tour="debate-counter-chat-btn"]');
        if (groupViewBtn) {
          await scrollToTarget(groupViewBtn);
          await wait(300);
          markTourStyled(groupViewBtn);
          groupViewBtn.style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
          groupViewBtn.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.85), 0 0 28px rgba(59,130,246,0.5)';
          groupViewBtn.style.transform = 'scale(1.1)';
          window.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('[Tour] Groups View button highlighted');
        } else {
          console.log('[Tour] Groups View button not found');
        }
      }

      // DEBATE: Highlight ideal counter divs in comments
      if (currentStep.action === 'highlightIdealCounters' && !cancelled) {
        console.log('[Action] highlightIdealCounters — finding and highlighting ideal counter divs');
        
        // Find all ungrouped comments (border-l-4)
        const allComments = document.querySelectorAll('.border-l-4');
        let foundCounter = false;
        
        for (const comment of allComments) {
          // Look for ideal counter text or styling indicators
          const idealCounterDiv = comment.querySelector('.mt-2, .text-xs, .bg-purple-50, .bg-purple-900');
          if (idealCounterDiv) {
            const text = idealCounterDiv.textContent?.toLowerCase() || '';
            if (text.includes('ideal') || text.includes('counter') || text.includes('🎯')) {
              highlightResult(idealCounterDiv);
              pulseElement(idealCounterDiv, 4000);
              if (!foundCounter) {
                await scrollToTarget(idealCounterDiv);
                foundCounter = true;
              }
              console.log('[Tour] Highlighted ideal counter in comment');
            }
          }
        }
        
        if (!foundCounter) {
          console.log('[Tour] No ideal counter divs found in comments');
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

      // NEWS: Show card as a clean slate — hide voting, comments, AI verdict
      //       AND override vote counts + comment count to 0
      if (currentStep.action === 'showNewsCardClean') {
        document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

        // Poll for the card — it may not exist yet after navigation back to /home
        const card = await waitForElement('[data-tour="home-first-news-card"]', 12000);
        if (card) {
          // Hide engagement elements BEFORE showing the card
          const votingBtns = card.querySelector('[data-tour="home-voting-buttons"]');
          const commentsBtn = card.querySelector('[data-tour="home-comments-btn"]');
          const aiVerdict = card.querySelector('[data-tour="home-ai-verdict"]');

          if (votingBtns) { hideElement(votingBtns); hiddenElementsRef.current.push(votingBtns); }
          if (commentsBtn) { hideElement(commentsBtn); hiddenElementsRef.current.push(commentsBtn); }
          if (aiVerdict) { hideElement(aiVerdict); hiddenElementsRef.current.push(aiVerdict); }

          // Persist AI verdict hidden + zero counts + card z-index via CSS
          const tourCSS = document.createElement('style');
          tourCSS.setAttribute('data-tour-style', 'hide-ai-verdict');
          tourCSS.textContent = [
            '[data-tour="home-ai-verdict"] { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }',
            // CSS-only zero counts — immune to React re-renders
            '[data-tour="home-upvote-count"], [data-tour="home-downvote-count"] { font-size: 0 !important; line-height: 0 !important; }',
            '[data-tour="home-upvote-count"]::after, [data-tour="home-downvote-count"]::after { content: "0" !important; font-size: 0.875rem !important; line-height: normal !important; }',
            '[data-tour="home-comments-count"] { font-size: 0 !important; line-height: 0 !important; }',
            '[data-tour="home-comments-count"]::after { content: "0 Comments" !important; font-size: 0.875rem !important; line-height: normal !important; }',
            // Keep card below the sticky navbar (z-50 = z-index 50)
            '[data-tour="home-first-news-card"] { position: relative !important; z-index: 1 !important; }',
          ].join('\n');
          document.head.appendChild(tourCSS);

          // Store original counts for restoration later
          const upSpan = card.querySelector('[data-tour="home-upvote-count"]');
          const downSpan = card.querySelector('[data-tour="home-downvote-count"]');
          const commentsCountSpan = card.querySelector('[data-tour="home-comments-count"]');
          if (upSpan) upSpan.dataset.tourOriginalText = upSpan.textContent;
          if (downSpan) downSpan.dataset.tourOriginalText = downSpan.textContent;
          if (commentsCountSpan) commentsCountSpan.dataset.tourOriginalText = commentsCountSpan.textContent;

          // Also force textContent as backup
          if (upSpan) upSpan.textContent = '0';
          if (downSpan) downSpan.textContent = '0';
          if (commentsCountSpan) commentsCountSpan.textContent = '0 Comments';

          // Cleanup ref (no-op for CSS approach, but keeps interface consistent)
          if (zeroCountObserverRef.current) zeroCountObserverRef.current.disconnect();
          zeroCountObserverRef.current = { disconnect: () => {} };

          showWithAnimation(card);
          await wait(600);
          // Highlight WITHOUT z-index so the card doesn't render over navbar/footer
          markTourStyled(card);
          card.style.transition = 'all 0.4s ease';
          card.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.7), 0 0 24px rgba(34,197,94,0.35)';
          card.style.borderRadius = card.style.borderRadius || '12px';
          pulseElement(card, 4000);
          // Scroll to top of the page so the card is visible below navbar
          window.scrollTo({ top: 0, behavior: 'smooth' });
          await wait(600);
        }
      }

      // NEWS: Reveal voting buttons (counts still 0 via CSS) and wait for user to vote
      if (currentStep.action === 'revealVotingZero') {
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const votingBtns = card.querySelector('[data-tour="home-voting-buttons"]');
          if (votingBtns) {
            showWithAnimation(votingBtns);
            await wait(300);
            // Scroll so the voting area is visible
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await wait(400);
          }
        }
      }

      // NEWS: Reveal comments button (unchanged)
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

      // NEWS: Hide existing comments, pick one text, fill into input field
      if (currentStep.action === 'hideCommentsAndFillInput' && !cancelled) {
        await wait(600);
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          // Collect all visible comment cards
          const commentCards = section.querySelectorAll(
            '.p-3.bg-gray-50, .p-3.bg-gray-700, [data-tour="home-comment-card"]',
          );
          let pickedText = '';
          commentCards.forEach((c, idx) => {
            // Grab text from the first card with actual content
            if (!pickedText && idx === 0) {
              const textEl = c.querySelector('p.text-gray-800');
              pickedText = textEl?.textContent?.trim() || '';
            }
            // Hide every comment card
            hideElement(c);
            hiddenElementsRef.current.push(c);
          });
          // Fallback text if no comment found
          if (!pickedText) pickedText = analysis?.newsDescription?.slice(0, 120) || NEWS_MOCK.comment;
          // Fill the input + highlight both input and post button
          const input = document.querySelector('[data-tour="home-comment-input"]');
          if (input && !cancelled) {
            await scrollToTarget(input);
            await wait(200);
            // Highlight the input area while typing
            highlightAction(input);
            await typeIntoInput(input, pickedText, 8);
            clearedInputsRef.current.push('[data-tour="home-comment-input"]');
          }
        }
      }

      // NEWS: Reveal AI verdict section
      if (currentStep.action === 'revealAiVerdict') {
        // Remove the persistent CSS hide rule so the verdict can appear
        document.querySelectorAll('[data-tour-style="hide-ai-verdict"]').forEach((s) => s.remove());
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const aiVerdict = card.querySelector('[data-tour="home-ai-verdict"]');
          if (aiVerdict) { showWithAnimation(aiVerdict); await wait(400); }
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

      // NEWS: Stream comments animation — restore hidden cards one by one
      if (currentStep.action === 'streamComments' && !cancelled) {
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          const cards = section.querySelectorAll(
            '.p-3.bg-gray-50, .p-3.bg-gray-700, [data-tour="home-comment-card"]',
          );
          // First make sure they're all hidden (they were hidden in hideCommentsAndFillInput)
          cards.forEach((c) => {
            if (c.style.display === 'none') {
              // Already hidden — good
            } else {
              c.style.opacity = '0';
              c.style.transform = 'translateX(-20px)';
            }
          });
          await wait(400);
          for (let i = 0; i < cards.length && !cancelled; i++) {
            // Restore from tour-hidden state if needed
            if (cards[i].dataset.tourHidden === 'true') {
              showElement(cards[i]);
            }
            cards[i].style.transition = 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            cards[i].style.opacity = '1';
            cards[i].style.transform = 'translateX(0)';
            await wait(280);
          }
        }
        // Auto-advance after streaming completes so user isn't stuck
        if (!cancelled) {
          await wait(800);
          setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
        }
      }

      // NEWS: Highlight evidence link feature
      if (currentStep.action === 'highlightEvidenceLink' && !cancelled) {
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          // Find the "Add Evidence Links" button by text
          const allButtons = section.querySelectorAll('button');
          let evidenceBtn = null;
          for (const btn of allButtons) {
            if (btn.textContent?.includes('Evidence Link')) {
              evidenceBtn = btn;
              break;
            }
          }
          if (evidenceBtn) {
            await scrollToTarget(evidenceBtn);
            await wait(300);
            highlightAction(evidenceBtn);
            pulseElement(evidenceBtn, 4000);
            // Temporarily click it open to show the section
            evidenceBtn.click();
            await wait(600);
            // Highlight the evidence links section
            const evidenceSection = section.querySelector('.space-y-3:last-child') ||
              evidenceBtn.closest('.flex.flex-col')?.querySelector('.space-y-3');
            if (evidenceSection) highlightResult(evidenceSection);
          } else {
            // Fallback: highlight the comment input area
            const input = document.querySelector('[data-tour="home-comment-input"]');
            if (input) {
              await scrollToTarget(input);
              highlightAction(input.parentElement);
            }
          }
        }
      }

      // NEWS: Animate expert voting on first comment
      if (currentStep.action === 'animateExpertVote' && !cancelled) {
        const firstComment = document.querySelector('[data-tour="home-comment-card"]');
        if (firstComment) {
          await scrollToTarget(firstComment);
          await wait(300);
          highlightResult(firstComment);

          // Find the ExpertVotingSection border-t area
          const expertSection = firstComment.querySelector('.border-t.border-gray-200');
          if (expertSection) {
            // Create overlay badge — "Expert analysing..."
            const badge = document.createElement('div');
            badge.className = 'tour-expert-badge';
            badge.style.cssText =
              'position:absolute;top:-36px;left:50%;transform:translateX(-50%);' +
              'background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;' +
              'padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;' +
              'box-shadow:0 4px 15px rgba(245,158,11,0.4);z-index:99999;white-space:nowrap;' +
              'animation:pulse-ring 1.5s infinite;';
            badge.textContent = '🔍 Expert is analysing this comment...';
            markTourStyled(expertSection);
            expertSection.style.position = 'relative';
            expertSection.appendChild(badge);
            pulseElement(expertSection, 5000);

            await wait(2000);
            if (cancelled) { badge.remove(); return; }

            // Change badge to "Expert Upvoted!"
            badge.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
            badge.textContent = '👍 Expert Upvoted! Credibility score +1';

            // Animate: find the upvote count in expert section and bump it
            const upCountEls = expertSection.querySelectorAll('span.font-medium');
            if (upCountEls.length > 0) {
              const upEl = upCountEls[0];
              const original = parseInt(upEl.textContent) || 0;
              markTourStyled(upEl);
              upEl.style.transition = 'all 0.4s ease';
              upEl.style.color = '#16a34a';
              upEl.style.transform = 'scale(1.5)';
              upEl.textContent = String(original + 1);
              await wait(800);
              upEl.style.transform = 'scale(1)';
            }

            await wait(2000);
            if (cancelled) { badge.remove(); return; }
            // Remove badge
            badge.style.transition = 'opacity 0.5s ease';
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 500);
          }
        }
      }

      // NEWS: Highlight grouped comments view (after user clicked Group by Topic)
      if (currentStep.action === 'highlightGroupedView' && !cancelled) {
        await wait(800); // Wait for group API + render
        const section = document.querySelector('[data-tour="home-comment-section"]');
        if (section) {
          // Find grouped view elements (group frames)
          const groupFrames = section.querySelectorAll('.mb-4 .bg-blue-50, .mb-4');
          if (groupFrames.length > 0) {
            await scrollToTarget(section);
            await wait(300);
            // Highlight the entire comment section
            highlightResult(section);
            // Pulse each group frame
            groupFrames.forEach((frame, i) => {
              setTimeout(() => {
                pulseElement(frame, 3000);
              }, i * 400);
            });
          } else {
            // Fallback: just highlight the section area
            highlightResult(section);
            await scrollToTarget(section);
          }
        }
      }

      // NEWS: Unhide all data — restore original news card to full state
      if (currentStep.action === 'unhideAllNewsData') {
        // Disconnect zero-count observer so real counts can render
        if (zeroCountObserverRef.current) { zeroCountObserverRef.current.disconnect(); zeroCountObserverRef.current = null; }
        // Restore everything that was hidden
        document.querySelectorAll('[data-tour-hidden="true"]').forEach((el) => {
          showElement(el);
          el.style.opacity = '';
          el.style.transform = '';
          el.style.transition = '';
          el.style.boxShadow = '';
        });
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

        // Restore original vote & comment counts
        const card = document.querySelector('[data-tour="home-first-news-card"]');
        if (card) {
          const upSpan = card.querySelector('[data-tour="home-upvote-count"]');
          const downSpan = card.querySelector('[data-tour="home-downvote-count"]');
          const commentsCountSpan = card.querySelector('[data-tour="home-comments-count"]');
          if (upSpan?.dataset.tourOriginalText) { upSpan.textContent = upSpan.dataset.tourOriginalText; delete upSpan.dataset.tourOriginalText; }
          if (downSpan?.dataset.tourOriginalText) { downSpan.textContent = downSpan.dataset.tourOriginalText; delete downSpan.dataset.tourOriginalText; }
          if (commentsCountSpan?.dataset.tourOriginalText) { commentsCountSpan.textContent = commentsCountSpan.dataset.tourOriginalText; delete commentsCountSpan.dataset.tourOriginalText; }
        }

        // Remove injected styles
        document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

        // Remove any tour-expert-badge leftovers + all visual styles
        cleanupAllTourStyles();

        // Re-animate the card fully visible
        if (card) {
          await scrollToTarget(card);
          await wait(300);
          pulseElement(card, 4000);
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
        // News comment post button
        const newsPostBtn = document.querySelector('[data-tour="home-comment-post-btn"]');
        if (newsPostBtn) highlightAction(newsPostBtn);
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

      if (!cancelled) {
        console.log('[DBG exec end] step:', currentStep.action, '| waitForClick:', currentStep.waitForClick, '| cancelled:', cancelled);
      }

      if (currentStep.waitForClick && !cancelled) {
        console.log('[DBG exec] setWaitingForUser(true) for waitForClick:', currentStep.waitForClick);
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
    cleanupAllTourStyles();
    
    console.log('[Tour] handleUserAction called, waitAction:', waitAction, 'currentStepIndex:', currentStepIndex);

    // Clear typed text after send actions
    if (waitAction === 'send' || waitAction === 'post-comment') {
      clearInput('[data-tour="debate-room-comment-input"] textarea');
      clearInput('[data-tour="home-comment-input"]');
      
      // Immediately advance to next step - the next step's action will handle showing the element
      setWaitingForUser(false);
      setWaitAction(null);
      setCurrentStepIndex((i) => {
        const nextIndex = Math.min(i + 1, stepsRef.current.length - 1);
        console.log('[Tour] Advancing from step', i, 'to', nextIndex);
        return nextIndex;
      });
      return;
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

    // Vote: programmatically click upvote button, show count as 1 briefly
    if (waitAction === 'vote') {
      // Stop any previous zero-count observer
      if (zeroCountObserverRef.current) { zeroCountObserverRef.current.disconnect(); zeroCountObserverRef.current = null; }
      // Replace CSS zero-count rules with vote-count rules (1 upvote, 0 downvotes)
      document.querySelectorAll('[data-tour-style="hide-ai-verdict"]').forEach((s) => {
        // Rewrite: keep AI verdict hidden but update counts to show 1/0
        s.textContent = [
          '[data-tour="home-ai-verdict"] { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }',
          '[data-tour="home-upvote-count"], [data-tour="home-downvote-count"] { font-size: 0 !important; line-height: 0 !important; }',
          '[data-tour="home-upvote-count"]::after { content: "1" !important; font-size: 0.875rem !important; line-height: normal !important; }',
          '[data-tour="home-downvote-count"]::after { content: "0" !important; font-size: 0.875rem !important; line-height: normal !important; }',
          '[data-tour="home-comments-count"] { font-size: 0 !important; line-height: 0 !important; }',
          '[data-tour="home-comments-count"]::after { content: "0 Comments" !important; font-size: 0.875rem !important; line-height: normal !important; }',
          '[data-tour="home-first-news-card"] { position: relative !important; z-index: 1 !important; }',
        ].join('\n');
      });
      const votingDiv = document.querySelector('[data-tour="home-voting-buttons"]');
      if (votingDiv) {
        // Always click the FIRST button (upvote — green bg-green-100)
        const upBtn = votingDiv.querySelector('button');
        if (upBtn) upBtn.click();
      }
      // Also force textContent as backup
      const forceVoteCounts = () => {
        const up = document.querySelector('[data-tour="home-upvote-count"]');
        const down = document.querySelector('[data-tour="home-downvote-count"]');
        if (up && up.textContent !== '1') up.textContent = '1';
        if (down && down.textContent !== '0') down.textContent = '0';
      };
      forceVoteCounts();
      const voteInterval = setInterval(forceVoteCounts, 50);
      setTimeout(() => clearInterval(voteInterval), 2000);
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

    // Expand clubbed group (Skip fallback): disconnect observer, programmatically
    // expand the group, then find + highlight the comment.
    if (waitAction === 'expandClubbedGroup') {
      // Disconnect the MutationObserver so it doesn’t double-advance
      if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
      const data = clubbedGroupDataRef.current;
      console.log('[DBG expandClubbedGroup] skip/fallback triggered, data:', !!data);
      if (data?.groupCard) {
        const { innerCard, searchPrefix: sp } = data;
        // Expand if not already open
        const isOpen = !!innerCard.querySelector('.mt-3.space-y-2');
        if (!isOpen) {
          const expandBtn = innerCard.querySelector('[data-tour="group-expand-btn"]');
          if (expandBtn) expandBtn.click();
        }
        setTimeout(() => {
          const container = innerCard.querySelector('.mt-3.space-y-2');
          let foundComment = null;
          if (container) {
            for (const child of Array.from(container.children)) {
              for (const p of child.querySelectorAll('p')) {
                const t = p.textContent?.trim() || '';
                if (sp && t.startsWith(sp) && t.length > 20) { foundComment = child; break; }
              }
              if (foundComment) break;
              if (sp?.length >= 20 && child.textContent?.trim().includes(sp)) { foundComment = child; break; }
            }
          }
          if (foundComment) {
            if (foundComment.style.display === 'none') showWithAnimation(foundComment);
            popHighlight(foundComment);
            scrollToTarget(foundComment);
            if (container) Array.from(container.children).forEach((c) => pulseElement(c, 3000));
            highlightResult(innerCard);
          } else if (innerCard) {
            highlightResult(innerCard);
          }
          setWaitingForUser(false);
          setWaitAction(null);
          setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
        }, 700);
      } else {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }
      return;
    }

    // Ideal counter: click the button to open the modal, then wait for user to close it
    if (waitAction === 'ideal-counter' || waitAction === 'idealCounterBtn') {
      console.log('[DBG handleUserAction] idealCounterBtn — programmatically clicking first button');
      const idealBtn = document.querySelector('[data-tour="debate-ideal-counter-btn"]');
      console.log('[DBG handleUserAction] idealBtn found:', !!idealBtn, idealBtn?.textContent?.trim());
      if (idealBtn) idealBtn.click();

      // Hide the tour overlay so the z-50 modal is visible and interactive
      setOverlayHidden(true);

      // Poll for the modal to disappear (user closed it)
      const pollForClose = () => {
        const pollInterval = setInterval(() => {
          const modal = document.querySelector('.fixed.inset-0.bg-black');
          if (!modal) {
            clearInterval(pollInterval);
            console.log('[DBG handleUserAction] idealCounter modal closed — advancing');
            setOverlayHidden(false);
            setWaitingForUser(false);
            setWaitAction(null);
            setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
          }
        }, 300);
        // Safety timeout: auto-advance after 30s if modal detection fails
        setTimeout(() => {
          clearInterval(pollInterval);
          setOverlayHidden(false);
        }, 30000);
      };
      // Small delay to let the modal mount before we start polling
      setTimeout(pollForClose, 600);
      return;
    }

    // Counter chat view: click the Counter Chat View button then advance
    if (waitAction === 'counterChatBtn') {
      const counterChatBtn = document.querySelector('[data-tour="debate-counter-chat-btn"]');
      if (counterChatBtn) {
        counterChatBtn.click();
        setTimeout(() => {
          setWaitingForUser(false);
          setWaitAction(null);
          setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
        }, 600);
      } else {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }
      return;
    }

    // Groups view: click the toggle button (same button, now showing "Groups View") then advance
    if (waitAction === 'groupViewBtn') {
      const groupViewBtn = document.querySelector('[data-tour="debate-counter-chat-btn"]');
      if (groupViewBtn) {
        groupViewBtn.click();
        setTimeout(() => {
          setWaitingForUser(false);
          setWaitAction(null);
          setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
        }, 600);
      } else {
        setWaitingForUser(false);
        setWaitAction(null);
        setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
      }
      return;
    }

    // Default: advance
    setWaitingForUser(false);
    setWaitAction(null);
    setCurrentStepIndex((i) => Math.min(i + 1, stepsRef.current.length - 1));
  }, [waitAction, currentStepIndex, navigate]);

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

    // Clear tour sessionStorage
    sessionStorage.removeItem('tour_multiCommentText');
    sessionStorage.removeItem('tour_singleGroupText');
    sessionStorage.removeItem('tour_counterGroupText');
    sessionStorage.removeItem('tour_offTopicText');

    // Remove all highlights and tour visual styles
    cleanupAllTourStyles();

    // Disconnect any pending MutationObserver
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (zeroCountObserverRef.current) { zeroCountObserverRef.current.disconnect(); zeroCountObserverRef.current = null; }
    clubbedGroupDataRef.current = null;

    // Remove injected <style> tags
    document.querySelectorAll('[data-tour-style]').forEach((s) => s.remove());

    // Restore original vote & comment count text overrides
    document.querySelectorAll('[data-tour-original-text]').forEach((el) => {
      el.textContent = el.dataset.tourOriginalText;
      delete el.dataset.tourOriginalText;
    });
    // Also check specific data-tour spans
    const card = document.querySelector('[data-tour="home-first-news-card"]');
    if (card) {
      ['home-upvote-count', 'home-downvote-count', 'home-comments-count'].forEach((attr) => {
        const span = card.querySelector(`[data-tour="${attr}"]`);
        if (span?.dataset.tourOriginalText) { span.textContent = span.dataset.tourOriginalText; delete span.dataset.tourOriginalText; }
      });
    }

    // Remove any tour expert badges
    document.querySelectorAll('.tour-expert-badge').forEach((b) => b.remove());

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
    setOverlayHidden(false);
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
      if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
      clubbedGroupDataRef.current = null;
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
      <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'none', visibility: overlayHidden ? 'hidden' : 'visible' }}>
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
          style={{ pointerEvents: waitingForUser && !spotlightRect ? 'none' : 'auto' }}
        />
      </svg>

      {/* ── Pulsing ring ── */}
      {spotlightRect && !overlayHidden && (
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
      {spotlightRect && waitingForUser && !overlayHidden && (
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
                  {waitAction === 'expandClubbedGroup'
                    ? '👆 Click the ▼ button on the group!'
                    : waitAction === 'vote'
                    ? '👆 Click 👍 or 👎 to vote!'
                    : waitAction === 'post-comment'
                    ? '👆 Click the Post button!'
                    : '👆 Click the highlighted element!'}
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
                    onClick={handleUserAction}
                    className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 hover:opacity-90 transition-opacity shadow-sm`}
                  >
                    Skip →
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

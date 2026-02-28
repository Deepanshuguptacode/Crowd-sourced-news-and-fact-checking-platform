import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * PitchMode — Cinematic Interview Presentation
 *
 * Combines the best of FeaturesTour + JourneyTour into a single,
 * auto-advancing cinematic presentation designed for pitching
 * the project to interviewers. Professional, impressive, and informative.
 */

// ─── Typewriter ─────────────────────────────────────────────────────────────

function useTypewriter(text, speed = 20, active = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);
  return { displayed, done };
}

// ─── Slide Data ─────────────────────────────────────────────────────────────

const slides = [
  {
    id: 'title',
    type: 'title',
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    icon: '🛡️',
    title: 'VoxVeritas',
    subtitle: 'AI-Powered Crowd-Sourced News Verification & Fact-Checking Platform',
    points: [
      'Full-stack application combating misinformation',
      'Three-tier verification: Community + Experts + AI',
      'Structured debates with AI argument analysis',
    ],
  },
  {
    id: 'problem',
    type: 'content',
    gradient: 'from-red-500 to-orange-600',
    icon: '⚠️',
    title: 'The Problem',
    subtitle: 'Why this platform is needed',
    content: 'Misinformation spreads 6x faster than truth on social media. Echo chambers reinforce biases. Existing platforms lack structured, multi-perspective fact-checking.',
    points: [
      { icon: '📱', text: 'Fake news reaches millions before correction' },
      { icon: '🫧', text: 'Echo chambers prevent balanced discourse' },
      { icon: '❌', text: 'No single source of truth — verification requires multiple perspectives' },
    ],
  },
  {
    id: 'solution',
    type: 'content',
    gradient: 'from-green-500 to-emerald-600',
    icon: '✅',
    title: 'Our Solution',
    subtitle: '3-tier verification architecture',
    content: 'VoxVeritas combines community wisdom, expert oversight, and AI analysis to create a robust fact-checking ecosystem.',
    points: [
      { icon: '👥', text: 'Community Voting — Democratic verification through upvotes/downvotes' },
      { icon: '🛡️', text: 'Expert Oversight — Verified expert users with weighted opinions' },
      { icon: '🤖', text: 'AI Analysis — Google Gemini-powered content verification with confidence scores' },
    ],
  },
  {
    id: 'tech-stack',
    type: 'tech',
    gradient: 'from-gray-700 to-gray-900',
    icon: '⚙️',
    title: 'Technical Architecture',
    subtitle: 'Modern full-stack technology',
    techs: [
      { name: 'React 18', category: 'Frontend', color: 'bg-cyan-500' },
      { name: 'Vite', category: 'Build', color: 'bg-purple-500' },
      { name: 'TailwindCSS', category: 'Styling', color: 'bg-teal-500' },
      { name: 'Node.js', category: 'Backend', color: 'bg-green-600' },
      { name: 'Express.js', category: 'API', color: 'bg-gray-600' },
      { name: 'MongoDB', category: 'Database', color: 'bg-green-500' },
      { name: 'Google Gemini', category: 'AI', color: 'bg-blue-500' },
      { name: 'JWT + Face Auth', category: 'Security', color: 'bg-red-500' },
    ],
  },
  {
    id: 'feature-news',
    type: 'feature-demo',
    gradient: 'from-blue-500 to-cyan-600',
    icon: '📰',
    title: 'Feature: News Verification',
    subtitle: 'Complete submission → verification pipeline',
    demo: 'news-verification',
    bullets: [
      'Community submits articles with sources and evidence',
      'Real-time status: Verified, Pending, Suspicious, Likely Fake',
      'Upvote/downvote threshold system drives automatic status changes',
    ],
  },
  {
    id: 'feature-ai',
    type: 'feature-demo',
    gradient: 'from-purple-500 to-violet-600',
    icon: '🤖',
    title: 'Feature: AI Verdict Engine',
    subtitle: 'Google Gemini-powered verification',
    demo: 'ai-analysis',
    bullets: [
      'Analyzes content patterns, source credibility, cross-references',
      'Returns verdict with confidence percentage (0–100%)',
      'Explains reasoning in natural language',
    ],
  },
  {
    id: 'feature-commenting',
    type: 'feature-demo',
    gradient: 'from-amber-500 to-orange-600',
    icon: '💬',
    title: 'Feature: Smart Comments & AI Grouping',
    subtitle: 'Stance-based commenting + Agentic AI clustering',
    demo: 'commenting',
    bullets: [
      'Every comment tagged: In Favor, Against, or General',
      'Agentic AI clusters comments into meaningful topic groups',
      '"Improve Groups" button regenerates with better accuracy',
    ],
  },
  {
    id: 'feature-debate',
    type: 'feature-demo',
    gradient: 'from-red-500 to-orange-600',
    icon: '⚔️',
    title: 'Feature: Structured Debate Rooms',
    subtitle: 'FOR vs AGAINST with AI argument matching',
    demo: 'debate',
    bullets: [
      'Two-column layout: FOR and AGAINST arguments',
      'AI auto-groups arguments and finds counter-link pairs',
      'Match percentage shows how directly groups oppose each other',
    ],
  },
  {
    id: 'feature-counters',
    type: 'feature-demo',
    gradient: 'from-violet-500 to-purple-600',
    icon: '🧠',
    title: 'Feature: Ideal Counters & Moderation',
    subtitle: 'AI generates perfect rebuttals + off-topic detection',
    demo: 'counters',
    bullets: [
      'AI describes the strongest possible counter-argument for each group',
      'Off-topic detection removes irrelevant contributions',
      'Relink Groups re-runs AI to optimize all groupings',
    ],
  },
  {
    id: 'highlights',
    type: 'content',
    gradient: 'from-indigo-500 to-blue-600',
    icon: '🌟',
    title: 'Technical Highlights',
    subtitle: 'Engineering achievements',
    points: [
      { icon: '🔑', text: 'Gemini API Key Rotation — 4-key pool with automatic failover for rate limit resilience' },
      { icon: '📸', text: 'Face Authentication — Optional biometric login using face-api.js' },
      { icon: '🤖', text: 'Agentic AI — Tool-calling architecture for comment grouping and analysis' },
      { icon: '🔄', text: 'Real-time Verification — Automatic status changes based on vote thresholds' },
      { icon: '🛡️', text: 'Expert System — Verified expert users with weighted voting and evidence links' },
    ],
  },
  {
    id: 'conclusion',
    type: 'conclusion',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: '🎯',
    title: 'VoxVeritas',
    subtitle: 'Fighting misinformation through collective intelligence',
    content: 'A comprehensive platform that proves misinformation can be tackled through the combination of community participation, expert verification, and artificial intelligence — working together in a structured, transparent ecosystem.',
  },
];

// ─── Mini Demo Components ───────────────────────────────────────────────────

const NewsVerificationDemo = () => {
  const [status, setStatus] = useState('Pending');
  const [votes, setVotes] = useState(5);

  useEffect(() => {
    const t1 = setTimeout(() => { setVotes(12); setStatus('Under Review'); }, 1500);
    const t2 = setTimeout(() => { setVotes(28); setStatus('Verified'); }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const color = status === 'Verified' ? 'bg-green-500' : status === 'Under Review' ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <div className="flex items-center gap-4 p-3 bg-white/10 rounded-xl">
      <div className="flex items-center gap-2">
        <span>👍</span>
        <span className="font-bold text-white text-lg transition-all">{votes}</span>
      </div>
      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(votes * 3.5, 100)}%` }} />
      </div>
      <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${color}`}>{status}</span>
    </div>
  );
};

const AIAnalysisDemo = () => {
  const [confidence, setConfidence] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 2) return;
    let c = 0;
    const i = setInterval(() => { c += 3; if (c > 87) { clearInterval(i); return; } setConfidence(c); }, 30);
    return () => clearInterval(i);
  }, [phase]);

  return (
    <div className="p-3 bg-white/10 rounded-xl">
      {phase < 2 ? (
        <div className="flex items-center gap-3">
          <div className="animate-pulse w-6 h-6 bg-purple-400 rounded-lg" />
          <span className="text-white/80 text-sm">{phase === 0 ? 'Scanning...' : 'Cross-referencing...'}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">✅ Likely Real</span>
          <span className="text-white/80 text-sm">{confidence}% confidence</span>
        </div>
      )}
    </div>
  );
};

const CommentingDemo = () => {
  const [groups, setGroups] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGroups(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-3 bg-white/10 rounded-xl space-y-2">
      <div className="flex gap-2">
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/30 text-green-200">👍 In Favor</span>
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/30 text-red-200">👎 Against</span>
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-500/30 text-gray-200">💬 General</span>
      </div>
      {groups && (
        <div className="text-xs text-white/70 animate-fade-in">
          🤖 → 3 groups created: "Supporting Evidence", "Methodology Concerns", "General Discussion"
        </div>
      )}
    </div>
  );
};

const DebateDemo = () => {
  const [matched, setMatched] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMatched(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-3 bg-white/10 rounded-xl">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 bg-green-500/20 rounded-lg text-center">
          <p className="font-bold text-green-200">FOR</p>
          <p className="text-white/60">Efficiency & Scale</p>
        </div>
        <div className="p-2 bg-red-500/20 rounded-lg text-center">
          <p className="font-bold text-red-200">AGAINST</p>
          <p className="text-white/60">Context & Nuance</p>
        </div>
      </div>
      {matched && (
        <div className="mt-2 text-center text-[10px] text-blue-200 animate-fade-in">
          🔗 91% counter-match — directly opposing viewpoints linked
        </div>
      )}
    </div>
  );
};

const CountersDemo = () => {
  const { displayed, done } = useTypewriter(
    'An ideal counter would address real-world cases where AI moderation failed to detect harmful content...',
    25,
    true
  );
  return (
    <div className="p-3 bg-white/10 rounded-xl">
      <p className="text-xs text-purple-200 mb-1">🧠 Ideal Counter-Argument:</p>
      <p className="text-xs text-white/80">
        {displayed}
        {!done && <span className="inline-block w-0.5 h-3 bg-purple-300 animate-pulse ml-0.5" />}
      </p>
    </div>
  );
};

const DEMO_MAP = {
  'news-verification': NewsVerificationDemo,
  'ai-analysis': AIAnalysisDemo,
  'commenting': CommentingDemo,
  'debate': DebateDemo,
  'counters': CountersDemo,
};

// ─── Slide Renderers ────────────────────────────────────────────────────────

const TitleSlide = ({ slide }) => (
  <div className="text-center py-8">
    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/10 flex items-center justify-center text-5xl shadow-2xl backdrop-blur-sm border border-white/20">
      {slide.icon}
    </div>
    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">{slide.title}</h1>
    <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">{slide.subtitle}</p>
    <div className="space-y-3 max-w-md mx-auto">
      {slide.points?.map((p, i) => (
        <div key={i} className="flex items-center gap-3 text-left bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-white/90 text-sm">{p}</span>
        </div>
      ))}
    </div>
  </div>
);

const ContentSlide = ({ slide }) => (
  <div className="py-4">
    {slide.content && (
      <p className="text-white/80 leading-relaxed mb-6 text-sm">{slide.content}</p>
    )}
    <div className="space-y-3">
      {slide.points?.map((p, i) => (
        <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
          <span className="text-2xl flex-shrink-0">{p.icon}</span>
          <p className="text-white/90 text-sm leading-relaxed">{p.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const TechSlide = ({ slide }) => (
  <div className="py-4">
    <div className="grid grid-cols-2 gap-3">
      {slide.techs.map((t, i) => (
        <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
          <div className={`w-3 h-3 rounded-full ${t.color} flex-shrink-0`} />
          <div>
            <p className="text-white font-semibold text-sm">{t.name}</p>
            <p className="text-white/50 text-[10px]">{t.category}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FeatureDemoSlide = ({ slide }) => {
  const DemoComponent = DEMO_MAP[slide.demo];
  return (
    <div className="py-4">
      {/* Live demo */}
      {DemoComponent && (
        <div className="mb-5">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Live Preview</p>
          <DemoComponent />
        </div>
      )}
      {/* Bullet points */}
      <div className="space-y-2">
        {slide.bullets?.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-white/50 mt-0.5">•</span>
            <span className="text-white/80">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConclusionSlide = ({ slide }) => (
  <div className="text-center py-8">
    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shadow-2xl backdrop-blur-sm border border-white/20">
      {slide.icon}
    </div>
    <h2 className="text-3xl font-black text-white mb-3">{slide.title}</h2>
    <p className="text-white/70 text-sm mb-6">{slide.subtitle}</p>
    <p className="text-white/80 text-sm leading-relaxed max-w-lg mx-auto">{slide.content}</p>
    <div className="mt-8 flex justify-center gap-4">
      {['Community', 'Experts', 'AI'].map((label, i) => (
        <div key={i} className="px-4 py-2 bg-white/10 rounded-full text-white/80 text-xs font-medium backdrop-blur-sm border border-white/20">
          {['👥', '🛡️', '🤖'][i]} {label}
        </div>
      ))}
    </div>
  </div>
);

const SLIDE_RENDERERS = {
  title: TitleSlide,
  content: ContentSlide,
  tech: TechSlide,
  'feature-demo': FeatureDemoSlide,
  conclusion: ConclusionSlide,
};

// ─── Main Component ─────────────────────────────────────────────────────────

const PitchMode = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayRef = useRef(null);
  const slide = slides[currentIndex];

  const goTo = useCallback((index) => {
    if (isAnimating || index === currentIndex || index < 0 || index >= slides.length) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating, currentIndex]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !autoPlay) return;
    autoPlayRef.current = setTimeout(() => {
      if (currentIndex < slides.length - 1) {
        goNext();
      } else {
        setAutoPlay(false); // Stop at the end
      }
    }, currentIndex === 0 ? 10000 : 8000); // More time on title slide
    return () => clearTimeout(autoPlayRef.current);
  }, [isOpen, autoPlay, currentIndex, goNext]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); setAutoPlay(false); }
      else if (e.key === 'ArrowLeft') { goPrev(); setAutoPlay(false); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) { setCurrentIndex(0); setIsAnimating(false); setAutoPlay(true); }
  }, [isOpen]);

  if (!isOpen) return null;

  const SlideRenderer = SLIDE_RENDERERS[slide.type];
  const progress = ((currentIndex + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Full-screen gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700`} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-black/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Auto-play progress */}
        {autoPlay && (
          <div className="h-1 bg-white/20">
            <div
              className="h-full bg-white/60 transition-all"
              style={{
                width: '100%',
                animation: `shrink ${currentIndex === 0 ? 10 : 8}s linear`,
              }}
            />
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-xs font-medium">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-medium hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              {autoPlay ? '⏸ Pause' : '▶ Auto-Play'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative w-full max-w-2xl mx-6 max-h-[85vh] overflow-y-auto">
        <div className={`transition-all duration-250 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} key={slide.id}>
          {/* Slide header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl">{slide.icon}</span>
              <div className="text-left">
                <h2 className="text-2xl font-black text-white">{slide.title}</h2>
                <p className="text-white/60 text-xs">{slide.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Slide content */}
          {SlideRenderer && <SlideRenderer slide={slide} />}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => { goPrev(); setAutoPlay(false); }}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); setAutoPlay(false); }}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-white'
                    : i < currentIndex
                    ? 'w-2 h-2 bg-white/60'
                    : 'w-2 h-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          {currentIndex < slides.length - 1 ? (
            <button
              onClick={() => { goNext(); setAutoPlay(false); }}
              className="px-5 py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-lg"
            >
              Close Presentation ✓
            </button>
          )}
        </div>
      </div>

      {/* Auto-play shrink animation + fade animations */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PitchMode;

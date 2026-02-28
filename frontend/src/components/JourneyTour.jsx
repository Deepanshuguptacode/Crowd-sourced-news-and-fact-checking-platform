import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * JourneyTour — Interactive Feature Demo
 * 
 * An immersive step-by-step simulation that walks users through
 * the complete VoxVeritas experience using mock data and animations.
 * NO backend API calls — everything is simulated live within the modal.
 */

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_NEWS = {
  title: 'Breaking: New Climate Report Reveals Accelerated Arctic Ice Melt',
  author: 'Sarah J.',
  status: 'Pending',
  content: 'A new study published in Nature Climate Change shows that Arctic sea ice is melting at three times the rate previously estimated, raising urgent concerns about global sea levels and ecosystems.',
};

const MOCK_COMMENTS = [
  { id: 1, text: 'This study has been peer-reviewed and the methodology is solid.', user: 'Dr. Emily R.', type: 'expert', stance: 'in_favor' },
  { id: 2, text: 'I have seen similar findings in the IPCC 2024 report.', user: 'ClimateWatch', type: 'community', stance: 'in_favor' },
  { id: 3, text: 'The sample size seems too small for such dramatic conclusions.', user: 'DataSkeptic', type: 'community', stance: 'against' },
  { id: 4, text: 'Previous predictions from similar models have been wildly inaccurate.', user: 'FactChecker42', type: 'community', stance: 'against' },
  { id: 5, text: 'Great article, very informative!', user: 'NewsReader1', type: 'community', stance: 'general' },
];

const MOCK_GROUPED = [
  {
    label: 'Supporting Scientific Evidence',
    description: 'Comments citing peer-reviewed research and established scientific findings',
    comments: [MOCK_COMMENTS[0], MOCK_COMMENTS[1]],
  },
  {
    label: 'Questioning Methodology',
    description: 'Comments raising concerns about research methods and prediction accuracy',
    comments: [MOCK_COMMENTS[2], MOCK_COMMENTS[3]],
  },
  {
    label: 'General Discussion',
    description: 'General comments and reactions',
    comments: [MOCK_COMMENTS[4]],
  },
];

const MOCK_DEBATE = {
  title: 'Should AI Regulate Social Media Content?',
  topic: 'AI & Free Speech',
  participants: 47,
};

const MOCK_DEBATE_COMMENTS_FOR = [
  { id: 'f1', text: 'AI moderation can process millions of posts instantly, catching harmful content human moderators would miss.', author: 'TechAdvocate', stance: 'for' },
  { id: 'f2', text: 'Automated systems reduce bias — they apply rules consistently without personal prejudice.', author: 'FairPlay_AI', stance: 'for' },
];

const MOCK_DEBATE_COMMENTS_AGAINST = [
  { id: 'a1', text: 'AI cannot understand nuance, sarcasm, or cultural context — leading to wrongful censorship.', author: 'FreeSpeechNow', stance: 'against' },
  { id: 'a2', text: 'Giving AI control over speech is a slippery slope toward authoritarian information control.', author: 'DigitalRights', stance: 'against' },
];

const MOCK_GROUPS_FOR = [
  {
    title: 'Efficiency & Scale',
    description: 'Arguments about AI\'s ability to process content at scale',
    comments: [MOCK_DEBATE_COMMENTS_FOR[0]],
    counterMatch: 91,
  },
  {
    title: 'Consistency & Fairness',
    description: 'Arguments about removing human bias from moderation',
    comments: [MOCK_DEBATE_COMMENTS_FOR[1]],
    counterMatch: 84,
  },
];

const MOCK_GROUPS_AGAINST = [
  {
    title: 'Context & Nuance Limitations',
    description: 'Arguments about AI\'s inability to understand complex human communication',
    comments: [MOCK_DEBATE_COMMENTS_AGAINST[0]],
    counterMatch: 91,
  },
  {
    title: 'Power & Control Concerns',
    description: 'Arguments about the dangers of automated speech control',
    comments: [MOCK_DEBATE_COMMENTS_AGAINST[1]],
    counterMatch: 84,
  },
];

const MOCK_IDEAL_COUNTERS = [
  'An ideal counter would address real-world examples where AI moderation failed to detect harmful content, showing the gap between theoretical efficiency and practical results.',
  'A strong rebuttal would present statistics on AI false-positive rates in content moderation and compare them to human moderator accuracy.',
];

// ─── Journey Steps ──────────────────────────────────────────────────────────

const journeySteps = [
  {
    id: 'welcome',
    phase: 'intro',
    title: 'Welcome to the VoxVeritas Journey',
    subtitle: 'Experience every feature hands-on',
    icon: '🚀',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'news-card',
    phase: 'news',
    title: 'A News Article Arrives',
    subtitle: 'Community members submit news for verification',
    icon: '📰',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'voting',
    phase: 'news',
    title: 'Community Voting',
    subtitle: 'The crowd weighs in on authenticity',
    icon: '🗳️',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'ai-analysis',
    phase: 'news',
    title: 'AI Analysis',
    subtitle: 'Machine learning examines the article',
    icon: '🤖',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'commenting',
    phase: 'news',
    title: 'Commenting with Stances',
    subtitle: 'Share your perspective with evidence',
    icon: '💬',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'grouping',
    phase: 'news',
    title: 'AI Comment Grouping',
    subtitle: 'Agentic AI clusters similar opinions',
    icon: '📂',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'debate-room',
    phase: 'debate',
    title: 'Enter a Debate Room',
    subtitle: 'Structured FOR vs AGAINST discussion',
    icon: '⚔️',
    gradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'debate-comment',
    phase: 'debate',
    title: 'Post an Argument',
    subtitle: 'AI instantly groups and matches your argument',
    icon: '✍️',
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'counter-pairs',
    phase: 'debate',
    title: 'Counter-Link Pairs',
    subtitle: 'AI matches opposing viewpoints automatically',
    icon: '🔗',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'ideal-counters',
    phase: 'debate',
    title: 'Ideal Counter-Arguments',
    subtitle: 'AI suggests the strongest possible rebuttal',
    icon: '🧠',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'off-topic',
    phase: 'debate',
    title: 'Off-Topic Detection',
    subtitle: 'AI keeps debates focused and on-track',
    icon: '🚫',
    gradient: 'from-gray-500 to-slate-600',
  },
  {
    id: 'complete',
    phase: 'end',
    title: 'Journey Complete!',
    subtitle: 'You\'ve experienced the full VoxVeritas platform',
    icon: '🎉',
    gradient: 'from-amber-500 to-yellow-500',
  },
];

// ─── Typewriter Hook ────────────────────────────────────────────────────────

function useTypewriter(text, speed = 25, active = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      setDone(false);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  return { displayed, done };
}

// ─── Step Renderers ─────────────────────────────────────────────────────────

/** Welcome */
const WelcomeStep = () => (
  <div className="text-center py-6">
    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl shadow-lg">
      🚀
    </div>
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto">
      This interactive journey simulates VoxVeritas features <strong>live</strong> — watch
      as votes count up, AI analyzes articles, comments get grouped,
      and debate arguments are matched in real time.
    </p>
    <div className="mt-6 flex justify-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <span className="w-3 h-3 rounded-full bg-blue-500" /> News Verification
      </div>
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <span className="w-3 h-3 rounded-full bg-red-500" /> Debate Rooms
      </div>
    </div>
    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
      No backend calls — everything is simulated
    </p>
  </div>
);

/** News Card */
const NewsCardStep = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {MOCK_NEWS.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{MOCK_NEWS.author}</p>
              <p className="text-xs text-gray-500">Community Member</p>
            </div>
            <span className="ml-auto px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              ⏳ {MOCK_NEWS.status}
            </span>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">{MOCK_NEWS.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{MOCK_NEWS.content}</p>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        A new article has been submitted — it starts with <span className="font-semibold text-yellow-600">Pending</span> status
      </p>
    </div>
  );
};

/** Voting Simulation */
const VotingStep = () => {
  const [upvotes, setUpvotes] = useState(12);
  const [downvotes, setDownvotes] = useState(3);
  const [status, setStatus] = useState('Pending');
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let step = 0;
    const sequence = () => {
      step++;
      if (step <= 8) {
        setAnimating(true);
        setUpvotes(prev => prev + Math.floor(Math.random() * 3) + 1);
        if (step % 3 === 0) setDownvotes(prev => prev + 1);
        setTimeout(() => setAnimating(false), 300);
      }
      if (step === 5) setStatus('Under Review');
      if (step === 8) setStatus('Verified');
      if (step >= 9) clearInterval(timerRef.current);
    };
    timerRef.current = setInterval(sequence, 800);
    return () => clearInterval(timerRef.current);
  }, []);

  const statusColor = status === 'Verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : status === 'Under Review' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate pr-4">{MOCK_NEWS.title}</h4>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-500 ${statusColor}`}>
            {status === 'Verified' ? '✅' : status === 'Under Review' ? '🔍' : '⏳'} {status}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition-transform ${animating ? 'scale-110' : 'scale-100'}`}>
            <span>👍</span>
            <span className="font-bold text-lg">{upvotes}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            <span>👎</span>
            <span className="font-bold text-lg">{downvotes}</span>
          </div>
          <div className="flex-1 ml-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(upvotes / (upvotes + downvotes)) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{Math.round((upvotes / (upvotes + downvotes)) * 100)}% believe this is real</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        Watch votes come in live — when they cross thresholds, the status updates automatically
      </p>
    </div>
  );
};

/** AI Analysis Simulation */
const AIAnalysisStep = () => {
  const [phase, setPhase] = useState(0); // 0=scanning, 1=analyzing, 2=done
  const [confidence, setConfidence] = useState(0);
  const { displayed: verdictText, done: verdictDone } = useTypewriter(
    'Based on analysis of content patterns, source credibility, and cross-referenced facts: this article appears to be LIKELY REAL with supporting evidence from peer-reviewed publications.',
    20,
    phase === 2
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 2) return;
    let c = 0;
    const interval = setInterval(() => {
      c += 2;
      if (c > 87) { clearInterval(interval); return; }
      setConfidence(c);
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 p-5">
        {/* Scanner animation */}
        {phase < 2 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {phase === 0 ? 'Scanning article content...' : 'Cross-referencing sources...'}
              </p>
              <div className="h-1.5 w-48 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ${phase === 0 ? 'w-1/3' : 'w-2/3'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 2 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Verdict</p>
                  <p className="text-xs text-gray-500">Google Gemini Analysis</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                ✅ Likely Real
              </span>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Confidence</span>
                <span className="font-bold">{confidence}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-200" style={{ width: `${confidence}%` }} />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {verdictText}
              {!verdictDone && <span className="inline-block w-0.5 h-4 bg-purple-500 animate-pulse ml-0.5" />}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        AI analyzes content patterns, source credibility, and cross-references facts
      </p>
    </div>
  );
};

/** Commenting with Stances */
const CommentingStep = () => {
  const [comments, setComments] = useState([]);
  const [currentComment, setCurrentComment] = useState(0);

  useEffect(() => {
    const addNext = () => {
      setComments(prev => {
        if (prev.length >= MOCK_COMMENTS.length) return prev;
        return [...prev, MOCK_COMMENTS[prev.length]];
      });
      setCurrentComment(p => p + 1);
    };
    const timers = MOCK_COMMENTS.map((_, i) => setTimeout(addNext, 600 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, []);

  const stanceColor = (stance) => {
    if (stance === 'in_favor') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (stance === 'against') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };
  const stanceLabel = (stance) => stance === 'in_favor' ? '👍 In Favor' : stance === 'against' ? '👎 Against' : '💬 General';

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live Comments Stream</p>
        </div>
        <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
          {comments.map((c, i) => (
            <div key={c.id} className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {c.type === 'expert' ? '🛡️ Expert' : '👤 Community'} — {c.user}
                </span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${stanceColor(c.stance)}`}>
                  {stanceLabel(c.stance)}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{c.text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              <div className="animate-pulse">Comments arriving...</div>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        Every comment has a stance badge — In Favor, Against, or General
      </p>
    </div>
  );
};

/** AI Comment Grouping */
const GroupingStep = () => {
  const [phase, setPhase] = useState(0); // 0=ungrouped, 1=processing, 2=grouped
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => {
      setPhase(2);
      setGroups(MOCK_GROUPED);
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div>
      {phase === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">5 comments — unsorted</p>
          <div className="space-y-2">
            {MOCK_COMMENTS.map(c => (
              <div key={c.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300 truncate">
                {c.text}
              </div>
            ))}
          </div>
        </div>
      )}
      {phase === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center animate-spin-slow shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Agentic AI Processing...</p>
          <p className="text-xs text-gray-500">Clustering similar comments by topic using tool-calling</p>
        </div>
      )}
      {phase === 2 && (
        <div className="space-y-3">
          {groups.map((g, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">{g.label}</h5>
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">{g.description}</p>
                <span className="text-[10px] text-blue-500 dark:text-blue-300">{g.comments.length} comments</span>
              </div>
              <div className="p-2 space-y-1">
                {g.comments.map(c => (
                  <div key={c.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 border-l-3 border-blue-300">
                    <span className="font-medium">{c.user}:</span> {c.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        {phase < 2 ? 'Click "Group by Topic" to activate the Agentic AI' : 'Comments clustered into meaningful topic groups by AI'}
      </p>
    </div>
  );
};

/** Debate Room Intro */
const DebateRoomStep = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-800">
          <h4 className="font-bold text-gray-900 dark:text-white">{MOCK_DEBATE.title}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">Topic: {MOCK_DEBATE.topic} • {MOCK_DEBATE.participants} participants</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">FOR</p>
            <p className="text-xs text-green-600 dark:text-green-300">Supporting arguments</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">AGAINST</p>
            <p className="text-xs text-red-600 dark:text-red-300">Opposing arguments</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        Two-column layout ensures equal representation of both sides
      </p>
    </div>
  );
};

/** Post Argument — shows typing + grouping animation */
const DebateCommentStep = () => {
  const [phase, setPhase] = useState(0); // 0=typing, 1=posted, 2=grouped
  const newArg = 'AI moderation can process millions of posts instantly, catching harmful content human moderators would miss.';
  const { displayed, done } = useTypewriter(newArg, 18, true);

  useEffect(() => {
    if (done) {
      const t1 = setTimeout(() => setPhase(1), 500);
      const t2 = setTimeout(() => setPhase(2), 1800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [done]);

  return (
    <div>
      {/* Input area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center text-sm">
            <span className="w-4 h-4 rounded-full bg-green-500 mr-2" />
            <span className="font-medium text-green-600 dark:text-green-400">FOR</span>
          </label>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 min-h-[60px] text-sm text-gray-800 dark:text-gray-200">
          {displayed}
          {!done && <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5" />}
        </div>
        {phase >= 1 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium animate-fade-in">
            <span>✅</span> Argument posted successfully!
          </div>
        )}
      </div>

      {/* Grouped result */}
      {phase >= 2 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-green-700 dark:text-green-300">🤖 AI grouped your argument into:</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-500">
            <h5 className="font-semibold text-gray-900 dark:text-white text-sm">Efficiency & Scale</h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Arguments about AI's ability to process content at scale</p>
          </div>
        </div>
      )}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        AI instantly groups your argument with similar viewpoints
      </p>
    </div>
  );
};

/** Counter-Link Pairs */
const CounterPairsStep = () => {
  const [showLines, setShowLines] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowLines(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {/* FOR column */}
        <div>
          <h5 className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> Supporting
          </h5>
          {MOCK_GROUPS_FOR.map((g, i) => (
            <div key={i} className="mb-2 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 border border-gray-200 dark:border-gray-700 p-2.5">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{g.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{g.comments.length} comment</p>
              {showLines && (
                <div className="mt-1.5 animate-fade-in">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${g.counterMatch >= 85 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    🔗 {g.counterMatch}% match
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AGAINST column */}
        <div>
          <h5 className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full" /> Opposing
          </h5>
          {MOCK_GROUPS_AGAINST.map((g, i) => (
            <div key={i} className="mb-2 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500 border border-gray-200 dark:border-gray-700 p-2.5">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{g.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{g.comments.length} comment</p>
              {showLines && (
                <div className="mt-1.5 animate-fade-in">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${g.counterMatch >= 85 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    🔗 {g.counterMatch}% match
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showLines && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fade-in">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>AI Counter-Matching:</strong> "Efficiency & Scale" ← 91% match → "Context & Nuance Limitations" — these groups are permanently linked as the most directly opposing viewpoints.
          </p>
        </div>
      )}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        AI finds the strongest opposing argument for every group
      </p>
    </div>
  );
};

/** Ideal Counter-Arguments */
const IdealCountersStep = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">Efficiency & Scale</h5>
        <p className="text-xs text-gray-500 italic">Supporting arguments about AI's processing capabilities</p>
        <button className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
          ℹ️ View Ideal Counters
        </button>
      </div>

      {show && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4 animate-fade-in">
          <h5 className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-3 flex items-center gap-2">
            🧠 AI-Generated Ideal Counter-Arguments
          </h5>
          <div className="space-y-2">
            {MOCK_IDEAL_COUNTERS.map((ic, i) => (
              <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20' : 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20'}`}>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium text-white ${i === 0 ? 'bg-orange-600' : 'bg-teal-600'} mb-1 inline-block`}>
                  Angle {i + 1}
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{ic}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        AI describes what the perfect counter-argument would look like
      </p>
    </div>
  );
};

/** Off-Topic Detection */
const OffTopicStep = () => {
  const [phase, setPhase] = useState(0);
  const offTopicComment = 'I just had pizza for lunch, it was amazing!';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div>
      {/* Normal comment */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">RandomUser99</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700">FOR</span>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200">{offTopicComment}</p>
      </div>

      {/* AI scanning */}
      {phase >= 1 && phase < 2 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 mb-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">AI analyzing topic relevance...</p>
          </div>
        </div>
      )}

      {/* Result */}
      {phase >= 2 && (
        <div className="animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-gray-400 border border-gray-200 dark:border-gray-700 p-3 opacity-60 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">RandomUser99</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-700 font-medium">🚫 Off-Topic</span>
            </div>
            <p className="text-sm text-gray-500 italic">{offTopicComment}</p>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500">
              <strong>AI Moderator:</strong> This comment is unrelated to the debate topic "AI & Free Speech".
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-2 text-xs text-green-700 dark:text-green-300">
            ✅ Comment moved to "Off-Topic & Ungrouped" section — main discussion stays focused!
          </div>
        </div>
      )}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        AI detects off-topic contributions and separates them to keep debates focused
      </p>
    </div>
  );
};

/** Complete */
const CompleteStep = () => (
  <div className="text-center py-4">
    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-4xl shadow-lg">
      🎉
    </div>
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto mb-4">
      You've experienced the complete VoxVeritas workflow — from news submission and community voting, through AI analysis and comment grouping, to structured debates with counter-argument matching.
    </p>
    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="font-bold text-blue-700 dark:text-blue-400">News Verification</p>
        <p className="text-blue-600 dark:text-blue-300">3-tier system</p>
      </div>
      <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="font-bold text-purple-700 dark:text-purple-400">AI Analysis</p>
        <p className="text-purple-600 dark:text-purple-300">Gemini-powered</p>
      </div>
      <div className="p-2.5 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
        <p className="font-bold text-teal-700 dark:text-teal-400">Smart Grouping</p>
        <p className="text-teal-600 dark:text-teal-300">Agentic AI clustering</p>
      </div>
      <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="font-bold text-red-700 dark:text-red-400">Debate Matching</p>
        <p className="text-red-600 dark:text-red-300">Counter-link pairs</p>
      </div>
    </div>
  </div>
);

// ─── Step Renderer Map ──────────────────────────────────────────────────────

const STEP_COMPONENTS = {
  'welcome': WelcomeStep,
  'news-card': NewsCardStep,
  'voting': VotingStep,
  'ai-analysis': AIAnalysisStep,
  'commenting': CommentingStep,
  'grouping': GroupingStep,
  'debate-room': DebateRoomStep,
  'debate-comment': DebateCommentStep,
  'counter-pairs': CounterPairsStep,
  'ideal-counters': IdealCountersStep,
  'off-topic': OffTopicStep,
  'complete': CompleteStep,
};

// ─── Phase Labels ───────────────────────────────────────────────────────────

const PHASE_LABELS = {
  intro: { label: 'Introduction', color: 'text-blue-600 dark:text-blue-400' },
  news: { label: 'News Verification', color: 'text-emerald-600 dark:text-emerald-400' },
  debate: { label: 'Debate Rooms', color: 'text-red-600 dark:text-red-400' },
  end: { label: 'Complete', color: 'text-amber-600 dark:text-amber-400' },
};

// ─── Main Component ─────────────────────────────────────────────────────────

const JourneyTour = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const step = journeySteps[currentIndex];

  const goTo = useCallback((index) => {
    if (isAnimating || index === currentIndex || index < 0 || index >= journeySteps.length) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, currentIndex]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const StepComponent = STEP_COMPONENTS[step.id];
  const phaseInfo = PHASE_LABELS[step.phase];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${step.gradient} flex-shrink-0`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Step {currentIndex + 1} of {journeySteps.length}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 ${phaseInfo.color}`}>
                {phaseInfo.label}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${step.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${((currentIndex + 1) / journeySteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Title */}
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
              {step.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`px-6 pb-4 overflow-y-auto flex-1 transition-all duration-200 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
          key={step.id} // Force re-mount on step change for animation resets
        >
          {StepComponent && <StepComponent />}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1">
            {journeySteps.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? `w-5 h-2 bg-gradient-to-r ${step.gradient}`
                    : i < currentIndex
                    ? 'w-2 h-2 bg-blue-400 dark:bg-blue-500'
                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
                }`}
                title={s.title}
              />
            ))}
          </div>

          {currentIndex < journeySteps.length - 1 ? (
            <button
              onClick={goNext}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r ${step.gradient} hover:opacity-90 transition-opacity shadow-sm`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 transition-opacity shadow-sm"
            >
              Finish ✓
            </button>
          )}
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default JourneyTour;

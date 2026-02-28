import { useState, useEffect, useCallback } from 'react';

/**
 * Features Tour — Full-screen modal slideshow
 * Shows all VoxVeritas features one-by-one with rich descriptions
 */

const features = [
  {
    icon: '📰',
    title: 'News Feed & 3-Tier Verification',
    description: 'Browse crowd-submitted news articles, each going through a rigorous verification pipeline.',
    details: [
      'Community members submit news articles with sources and evidence',
      'Each article gets a real-time status: Verified Real, Likely Fake, Suspicious, or Pending',
      'Three verification layers ensure no single point of failure in fact-checking',
    ],
    category: 'Core',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-500/10',
    visual: '📝 → 🗳️ → 🤖 → ✅',
  },
  {
    icon: '🗳️',
    title: 'Democratic Voting System',
    description: 'The community collectively determines authenticity through upvotes and downvotes.',
    details: [
      'Upvote articles you believe are real, downvote ones that seem fake',
      'When votes cross thresholds, the article status automatically updates',
      'Vote counts are transparent — see exactly what the community thinks',
    ],
    category: 'Community',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-500/10',
    visual: '👍 Real  |  👎 Fake  |  ⏳ Pending',
  },
  {
    icon: '🤖',
    title: 'AI Verdict Engine',
    description: 'Every article gets an AI-powered analysis with a confidence percentage.',
    details: [
      'Google Gemini AI analyzes article content, sources, and patterns',
      'Returns a verdict: Likely Real, Likely Fake, Uncertain, or Suspicious',
      'Confidence score (0-100%) shows how certain the AI is about its analysis',
    ],
    category: 'AI',
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-500/10',
    visual: '🧠 AI Analysis → 📊 78% Confidence → ✅ Likely Real',
  },
  {
    icon: '💬',
    title: 'Smart Comment Clustering',
    description: 'Agentic AI automatically groups comments by topic using tool-calling architecture.',
    details: [
      'Click "Group by Topic" to activate the Agentic AI comment organizer',
      'AI uses tool-calling to intelligently cluster similar opinions together',
      'Each cluster gets an AI-generated title and description for easy navigation',
    ],
    category: 'Agentic AI',
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10',
    visual: '💬💬💬 → 🤖 AI Groups → 📂 Organized Topics',
  },
  {
    icon: '📊',
    title: 'Stance Detection & Organization',
    description: 'Choose your stance before commenting — discussions are organized by perspective.',
    details: [
      'Select In Favor 👍, Against 👎, or Neutral 💬 before posting',
      'AI sorts comments by stance for balanced, structured discussions',
      'See all perspectives at a glance without endless scrolling',
    ],
    category: 'Community',
    gradient: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-500/10',
    visual: '👍 In Favor  |  👎 Against  |  💬 Neutral',
  },
  {
    icon: '🛡️',
    title: 'Expert Verification Panel',
    description: 'Verified journalists and fact-checkers provide professional opinions weighted more heavily.',
    details: [
      'Experts are verified through credentials and professional background checks',
      'Expert votes carry more weight than community votes in the final verdict',
      'Browse the Experts page to see all verified professionals and their specialties',
    ],
    category: 'Trust',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/10',
    visual: '🧑‍🔬 Expert → ⭐ Weighted Vote → 🏅 Higher Impact',
  },
  {
    icon: '⚔️',
    title: 'Debate Rooms — Pro vs Con',
    description: 'Structured debate spaces where arguments are organized FOR and AGAINST.',
    details: [
      'Create or join debate rooms on any topic or news article',
      'Two-column layout ensures equal visual representation of both sides',
      'Choose your stance (FOR or AGAINST) before sharing your argument',
    ],
    category: 'Debate',
    gradient: 'from-red-500 to-orange-600',
    bg: 'bg-red-500/10',
    visual: '🟢 FOR  ⚔️  AGAINST 🔴',
  },
  {
    icon: '🧠',
    title: 'AI Counter-Arguments',
    description: 'Our Agentic AI automatically pairs opposing viewpoints for balanced debate.',
    details: [
      'When someone argues FOR, the AI finds the strongest matching AGAINST argument',
      'Counter Chat View shows argument pairs side-by-side for easy comparison',
      'AI detects off-topic contributions and labels them to keep debates focused',
    ],
    category: 'Agentic AI',
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-500/10',
    visual: '💚 Argument → 🤖 AI Match → ❤️ Counter-Argument',
  },
  {
    icon: '🌐',
    title: 'Trending News Discovery',
    description: 'Real-time news aggregated from trusted sources, ranked by AI.',
    details: [
      'AI engine scans multiple platforms every 10 minutes for trending stories',
      'Smart ranking by engagement, recency, and source credibility — not just clicks',
      'Repost any trending story to the VoxVeritas feed for community verification',
    ],
    category: 'Discovery',
    gradient: 'from-orange-500 to-red-600',
    bg: 'bg-orange-500/10',
    visual: '🌍 Sources → 📊 AI Rank → 🔄 Repost to Verify',
  },
  {
    icon: '🔐',
    title: 'Face Authentication (Anti-Spam)',
    description: 'ArcFace biometric verification prevents fake accounts and bot manipulation.',
    details: [
      'InsightFace/ArcFace deep learning model verifies real human identity',
      'Prevents the same person from creating multiple fake accounts',
      'Ensures every vote and comment comes from a verified, unique individual',
    ],
    category: 'Security',
    gradient: 'from-slate-600 to-gray-800',
    bg: 'bg-slate-500/10',
    visual: '📸 Face Scan → 🧬 ArcFace AI → ✅ Verified Human',
  },
];

const categoryColors = {
  Core: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Community: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  AI: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Agentic AI': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Trust: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  Debate: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Discovery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Security: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const FeaturesTour = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 left, 0 none, 1 right
  const [isAnimating, setIsAnimating] = useState(false);

  const feature = features[currentIndex];

  const goTo = useCallback((index, dir) => {
    if (isAnimating || index === currentIndex) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < features.length - 1) goTo(currentIndex + 1, 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, -1);
  }, [currentIndex, goTo]);

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
      setDirection(0);
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${feature.gradient}`} />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Feature {currentIndex + 1} of {features.length}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[feature.category]}`}>
              {feature.category}
            </span>
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${feature.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${((currentIndex + 1) / features.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 py-6 transition-all duration-200 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
              {feature.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {feature.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {feature.description}
              </p>
            </div>
          </div>

          {/* Visual flow */}
          <div className={`mb-5 px-4 py-3 rounded-xl ${feature.bg} dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50`}>
            <p className="text-center font-mono text-sm text-gray-700 dark:text-gray-300 tracking-wide">
              {feature.visual}
            </p>
          </div>

          {/* Detail bullets */}
          <div className="space-y-3 mb-2">
            {feature.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-[10px] font-bold text-white">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation dots */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-center gap-1.5">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-gradient-to-r ' + feature.gradient
                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 pt-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {currentIndex < features.length - 1 ? (
            <button
              onClick={goNext}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r ${feature.gradient} rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
            >
              Next Feature
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Got it! Let's go
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesTour;

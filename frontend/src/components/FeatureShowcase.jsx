import React, { useState, useEffect } from 'react';

/**
 * FeatureShowcase - A beautiful, animated feature discovery component
 * Shows new users what each page/feature does with creative visuals
 */

const FeatureShowcase = ({ features, title, subtitle, variant = 'cards', onDismiss, storageKey }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (storageKey && localStorage.getItem(`showcase_dismissed_${storageKey}`)) {
      setIsVisible(false);
    }
  }, [storageKey]);

  // Auto-rotate features
  useEffect(() => {
    if (variant === 'spotlight' && isVisible) {
      const interval = setInterval(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setActiveFeature(prev => (prev + 1) % features.length);
          setIsAnimating(true);
        }, 300);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [features.length, variant, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (storageKey) {
      localStorage.setItem(`showcase_dismissed_${storageKey}`, 'true');
    }
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  // VARIANT: Horizontal scrolling cards with glassmorphism
  if (variant === 'cards') {
    return (
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-x opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0aDR2MmgtNHYtMnptMC04aDR2MmgtNHYtMnptMCA4aDR2MmgtNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
              </div>
              <p className="text-white/70 text-sm md:text-base max-w-xl">{subtitle}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/80 hover:text-white text-sm rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              <span>Got it</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Feature Cards */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64 md:w-72 snap-center group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="h-full bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-default">
                  {/* Icon with glow */}
                  <div className="relative mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient || 'from-amber-400 to-orange-500'} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${feature.gradient || 'from-amber-400 to-orange-500'} opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-amber-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Tag */}
                  {feature.tag && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-full text-xs text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {feature.tag}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Spotlight - single feature with animated transition
  if (variant === 'spotlight') {
    const feature = features[activeFeature];
    return (
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient || 'from-slate-900 via-purple-900 to-slate-900'} transition-all duration-1000`} />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 px-6 py-8 md:px-8 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm rounded-xl transition-all border border-white/10"
            >
              Dismiss
            </button>
          </div>

          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Left: Visual */}
              <div className="flex-shrink-0">
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${feature.gradient || 'from-amber-400 to-orange-500'} flex items-center justify-center shadow-2xl`}>
                  <span className="text-5xl md:text-6xl">{feature.icon}</span>
                </div>
              </div>
              
              {/* Right: Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-4">{feature.description}</p>
                {feature.highlight && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-white/80">{feature.highlight}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(false);
                  setTimeout(() => {
                    setActiveFeature(index);
                    setIsAnimating(true);
                  }, 300);
                }}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === activeFeature 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Timeline - vertical step-by-step
  if (variant === 'timeline') {
    return (
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] " />
        
        <div className="relative z-10 px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>
            <button onClick={handleDismiss} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-xl transition-all border border-white/5">
              Got it
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="relative group">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 z-10">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient || 'from-blue-500 to-cyan-500'} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {index + 1}
                  </div>
                </div>
                
                <div className="h-full bg-white/5 hover:bg-white/10 rounded-xl p-6 pt-8 border border-white/5 hover:border-white/15 transition-all duration-500 group-hover:translate-y-[-2px]">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient || 'from-blue-500 to-cyan-500'} flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base mb-1.5">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
                    </div>
                  </div>
                  
                  {feature.stats && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                      {feature.stats.map((stat, i) => (
                        <div key={i} className="text-center">
                          <div className="text-white font-bold text-lg">{stat.value}</div>
                          <div className="text-gray-500 text-xs">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Banner - compact horizontal banner
  if (variant === 'banner') {
    return (
      <div className="relative mb-6 overflow-hidden rounded-xl">
        <div className={`absolute inset-0 bg-gradient-to-r ${features[0]?.bgGradient || 'from-blue-600 to-indigo-700'}`} />
        <div className="absolute inset-0 bg-black/10" />
        
        <div className="relative z-10 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">{features[0]?.icon || '💡'}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{title}</h3>
              <p className="text-white/70 text-sm">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              {features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white/80">
                  <span>{f.icon}</span>
                  <span>{f.title}</span>
                </div>
              ))}
            </div>
            <button onClick={handleDismiss} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeatureShowcase;

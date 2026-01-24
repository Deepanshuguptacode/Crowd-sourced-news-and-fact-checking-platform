# 12 - AI Components: Verdict Generation and Analysis

## What You'll Learn
- How AI verdicts are generated and displayed
- The AIVerdictSection component structure
- Credibility scoring system
- Integration with Gemini AI on the backend
- Permission-based feature access

---

## AI Verdict System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI VERDICT SYSTEM                                        │
└─────────────────────────────────────────────────────────────────────────────┘

                    User clicks "Generate AI Verdict"
                              │
                              ▼
                    Frontend: aiVerdictAPI.generateVerdict(newsId)
                              │
                              ▼
                    Backend: AIVerdictController
                              │
                    ┌─────────┴──────────────────────────────────────┐
                    │                                                │
                    │  1. Fetch news article                        │
                    │  2. Fetch all comments (community + expert)    │
                    │  3. Analyze source link metadata              │
                    │  4. Build comprehensive prompt                │
                    │                                                │
                    └─────────┬──────────────────────────────────────┘
                              │
                              ▼
                    Gemini AI (with function calling)
                              │
                    ┌─────────┴──────────────────────────────────────┐
                    │                                                │
                    │  Analyzes:                                     │
                    │  - News content vs source                     │
                    │  - Expert opinions                            │
                    │  - Community sentiment                        │
                    │  - Evidence provided                          │
                    │                                                │
                    │  Returns:                                      │
                    │  - Credibility score (0-100)                  │
                    │  - Verdict text                               │
                    │  - Confidence level                           │
                    │  - Reasoning breakdown                        │
                    │                                                │
                    └─────────┬──────────────────────────────────────┘
                              │
                              ▼
                    Frontend displays verdict with visual indicators
```

---

## AIVerdictSection Component

```jsx
// frontend/src/components/AIVerdictSection.jsx

import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { aiVerdictAPI } from '../services/api';
import { UserContext } from '../context/userContext';
import { toast } from 'react-toastify';

const AIVerdictSection = ({ newsId, onVerdictUpdate }) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [verdict, setVerdict] = useState(null);          // Verdict data
  const [loading, setLoading] = useState(false);          // Initial load
  const [generating, setGenerating] = useState(false);    // Generation in progress
  const [showVerdict, setShowVerdict] = useState(false);  // Expand/collapse
  const [error, setError] = useState(null);               // Error message
  
  const { isAuthenticated, userType } = useContext(UserContext);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK FOR EXISTING VERDICT ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    checkExistingVerdict();
  }, [newsId]);

  const checkExistingVerdict = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get existing verdict
      const response = await aiVerdictAPI.getVerdict(newsId);
      
      if (response.success) {
        setVerdict(response.data);
      }
      
    } catch (error) {
      // 404 means no verdict exists yet - that's okay
      if (error.response?.status !== 404) {
        console.error('Error checking existing verdict:', error);
        setError('Failed to check existing verdict');
      }
    } finally {
      setLoading(false);
    }
  };
```

### Generate Verdict Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE NEW VERDICT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const generateVerdict = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      // Call AI verdict generation API
      const response = await aiVerdictAPI.generateVerdict(newsId);
      
      if (response.success) {
        setVerdict(response.data);
        setShowVerdict(true);
        toast.success('AI verdict generated successfully!');
        
        // Notify parent component
        if (onVerdictUpdate) {
          onVerdictUpdate(response.data);
        }
      }
      
    } catch (error) {
      console.error('Error generating verdict:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate AI verdict';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REGENERATE VERDICT (Update with latest comments)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const regenerateVerdict = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      // Call regenerate endpoint
      const response = await aiVerdictAPI.regenerateVerdict(newsId);
      
      if (response.success) {
        setVerdict(response.data);
        toast.success('AI verdict regenerated successfully!');
        
        if (onVerdictUpdate) {
          onVerdictUpdate(response.data);
        }
      }
      
    } catch (error) {
      console.error('Error regenerating verdict:', error);
      const errorMessage = error.response?.data?.message || 'Failed to regenerate AI verdict';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };
```

### Score Visualization Helpers

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE VISUALIZATION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Get text color based on score
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';   // High credibility
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'; // Mixed
    return 'text-red-600 dark:text-red-400';                        // Low credibility
  };

  // Get background gradient for progress bar
  const getScoreBackground = (score) => {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  // Get human-readable label
  const getCredibilityLabel = (score) => {
    if (score >= 80) return 'Highly Credible';
    if (score >= 60) return 'Likely Credible';
    if (score >= 40) return 'Mixed Evidence';
    if (score >= 20) return 'Likely False';
    return 'Highly Suspicious';
  };

  // Check if user can generate verdicts
  const canGenerateVerdict = isAuthenticated && 
                              (userType === 'community' || userType === 'expert');
```

### Verdict UI Structure

```jsx
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      {/* ─────────────────────────────────────────────────────────────────
          HEADER WITH ACTION BUTTONS
      ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* AI Icon */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 
                          rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              {/* Brain/AI icon */}
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              AI Verdict
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Comprehensive credibility analysis
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Generate Button (only if no verdict exists) */}
          {!verdict && canGenerateVerdict && (
            <button
              onClick={generateVerdict}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 
                         text-white text-sm font-medium rounded-lg 
                         hover:from-purple-600 hover:to-indigo-600 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200 flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 
                                  border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    {/* Checkmark icon */}
                  </svg>
                  <span>Generate AI Verdict</span>
                </>
              )}
            </button>
          )}

          {/* Show/Hide + Regenerate (only if verdict exists) */}
          {verdict && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowVerdict(!showVerdict)}
                className="px-3 py-1 text-sm text-purple-600 dark:text-purple-400 
                           hover:text-purple-700 transition-colors"
              >
                {showVerdict ? 'Hide' : 'Show'} Details
              </button>
              
              {canGenerateVerdict && (
                <button
                  onClick={regenerateVerdict}
                  disabled={generating}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 
                             hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Updating...' : 'Regenerate'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ERROR DISPLAY
      ───────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 
                        border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          NO VERDICT STATE (Guest/Normal users)
      ───────────────────────────────────────────────────────────────── */}
      {!verdict && !canGenerateVerdict && (
        <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800/50 
                        rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" 
               fill="currentColor" viewBox="0 0 24 24">
            {/* Icon */}
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No AI verdict available
          </p>
          <p className="text-xs text-gray-500">
            Login as community/expert user to generate analysis
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          VERDICT SUMMARY (Always visible when verdict exists)
      ───────────────────────────────────────────────────────────────── */}
      {verdict && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 
                        dark:from-purple-900/20 dark:to-indigo-900/20 
                        rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* Credibility Label */}
              <h4 className={`text-lg font-bold ${getScoreColor(verdict.score)}`}>
                {getCredibilityLabel(verdict.score)}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Credibility Score: {verdict.score}/100
              </p>
            </div>
            
            {/* Confidence Indicator */}
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Confidence</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(verdict.confidence * 100)}%
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 
                              rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 
                              ${getScoreBackground(verdict.score)}`}
                  style={{ width: `${verdict.score}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Verdict Text */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {verdict.verdict}
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          DETAILED ANALYSIS (Expandable)
      ───────────────────────────────────────────────────────────────── */}
      {verdict && showVerdict && (
        <div className="space-y-4">
          {/* Analysis Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 
                          bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {verdict.analysisMetadata?.totalCommentsAnalyzed || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Comments Analyzed
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {verdict.topComments?.inFavor?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Supporting Comments
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {verdict.topComments?.against?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Opposing Comments
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {verdict.analysisMetadata?.expertComments || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Expert Comments
              </div>
            </div>
          </div>
          
          {/* Reasoning sections would go here */}
        </div>
      )}
    </div>
  );
};
```

---

## Verdict Data Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERDICT DATA STRUCTURE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

{
  "_id": "verdict123",
  "newsId": "news456",
  
  // Main verdict output
  "score": 75,                    // 0-100 credibility score
  "verdict": "The news appears credible based on...",  // Text summary
  "confidence": 0.85,             // AI's confidence in its analysis
  
  // Breakdown
  "reasoning": {
    "sourceAnalysis": "Source appears legitimate...",
    "contentAnalysis": "Claims are consistent with...",
    "communityConsensus": "Community largely agrees...",
    "expertOpinion": "Experts have verified..."
  },
  
  // Top contributing comments
  "topComments": {
    "inFavor": [
      { "text": "This is accurate because...", "username": "expert1" }
    ],
    "against": [
      { "text": "This seems false because...", "username": "user2" }
    ]
  },
  
  // Metadata
  "analysisMetadata": {
    "totalCommentsAnalyzed": 25,
    "expertComments": 5,
    "communityComments": 20,
    "analyzedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## Score Interpretation Guide

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREDIBILITY SCORE INTERPRETATION                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┬───────────────────┬────────────────────────────────────────┐
│  SCORE RANGE   │  LABEL            │  VISUAL                                │
├────────────────┼───────────────────┼────────────────────────────────────────┤
│  80 - 100      │  Highly Credible  │  🟢 Green, high confidence             │
│  60 - 79       │  Likely Credible  │  🟢 Green, moderate confidence         │
│  40 - 59       │  Mixed Evidence   │  🟡 Yellow, needs investigation        │
│  20 - 39       │  Likely False     │  🔴 Red, low credibility               │
│  0 - 19        │  Highly Suspicious│  🔴 Red, very low credibility          │
└────────────────┴───────────────────┴────────────────────────────────────────┘
```

---

## Permission-Based Access

```jsx
// Only community and expert users can generate verdicts

const canGenerateVerdict = isAuthenticated && 
                            (userType === 'community' || userType === 'expert');

// In the UI:
{!verdict && canGenerateVerdict && (
  <button onClick={generateVerdict}>Generate AI Verdict</button>
)}

// If user can't generate:
{!verdict && !canGenerateVerdict && (
  <p>Login as community/expert user to generate analysis</p>
)}
```

---

## Interview Questions & Answers

### Q1: How does the AI verdict work?

**Answer:**
1. User clicks "Generate AI Verdict"
2. Frontend calls `aiVerdictAPI.generateVerdict(newsId)`
3. Backend collects news content + all comments
4. Data is sent to Gemini AI with analysis prompt
5. AI returns score (0-100), verdict text, and reasoning
6. Result is saved to database and displayed

### Q2: Why cache verdicts?

**Answer:** AI calls are expensive (API costs + latency). By caching:
- Subsequent views load instantly
- Reduces API costs
- Users can still "Regenerate" to update with new comments

### Q3: What factors affect the credibility score?

**Answer:**
- Source legitimacy (domain analysis)
- Content consistency with source
- Expert opinions (weighted more heavily)
- Community consensus
- Evidence links provided
- Comparison with known fact-checks

### Q4: Why restrict verdict generation to community/expert users?

**Answer:**
- Prevents abuse (API costs)
- Ensures engaged users generate verdicts
- Guests are just browsing, not fact-checking
- Normal users have limited platform engagement

---

**Next: [13-DEBATE-COMPONENTS.md](./13-DEBATE-COMPONENTS.md)** - Debate rooms and discussion features →

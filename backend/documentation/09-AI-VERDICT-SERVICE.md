# 09 - AI Verdict Service: Fact-Checking Engine

## What You'll Learn
- How the AI verdict system works end-to-end
- The `generate_news_verdict` function definition
- Comment selection and weighting logic
- Metadata calculation for transparency
- Error handling and fallback strategies
- Complete code walkthrough with explanations

---

## AI Verdict Service Overview

The **AIVerdictService** is the core fact-checking engine. It analyzes news articles and their comments to generate credibility verdicts.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI VERDICT SERVICE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

      NEWS ARTICLE                 COMMENTS
           │                           │
           │                           │
           ▼                           ▼
    ┌──────────────┐            ┌──────────────┐
    │ title        │            │ CommunityComment │
    │ description  │            │ ExpertComment    │
    │ link         │            │ (with stances)   │
    │ status       │            └───────┬──────────┘
    └──────┬───────┘                    │
           │                            │
           │         ┌──────────────────┘
           │         │
           ▼         ▼
    ┌────────────────────────┐
    │   selectTopComments()  │
    │                        │
    │  • Separate by stance  │
    │  • Score by quality    │
    │  • Select top 8 each   │
    └───────────┬────────────┘
                │
                ▼
    ┌────────────────────────┐
    │   callAIForVerdict()   │
    │                        │
    │  • Build prompt        │
    │  • Call Gemini         │
    │  • Parse function call │
    └───────────┬────────────┘
                │
                ▼
    ┌────────────────────────┐
    │   calculateMetadata()  │
    │                        │
    │  • Count comments      │
    │  • Stance distribution │
    │  • Average scores      │
    └───────────┬────────────┘
                │
                ▼
    ┌────────────────────────┐
    │   Save AIVerdict       │
    │                        │
    │  • verdict text        │
    │  • score (0-100)       │
    │  • confidence (0-1)    │
    │  • keyFactors[]        │
    │  • riskLevel           │
    │  • topComments         │
    │  • analysisMetadata    │
    └────────────────────────┘
```

---

## File Location

**Location:** `backend/services/aiVerdictService.js`

---

## The Function Definition

This is the heart of the AI verdict system - the function that Gemini will "call" with its analysis:

```javascript
const { GoogleGenAI, Type } = require('@google/genai');

const generateVerdictFn = {
  name: 'generate_news_verdict',
  description: 'Analyzes news article and comments to generate a credibility verdict.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      
      // ═══════════════════════════════════════════════════════════
      // VERDICT TEXT
      // ═══════════════════════════════════════════════════════════
      verdict: { 
        type: Type.STRING, 
        description: 'Comprehensive analysis in EXACTLY 250 words or less. 
                      Explains reasoning based on evidence and sources.' 
      },
      // WHY: Human-readable explanation of the decision
      // WHAT: Detailed text analysis
      // CONSTRAINT: Max 250 words to be concise but thorough
      
      // ═══════════════════════════════════════════════════════════
      // CREDIBILITY SCORE
      // ═══════════════════════════════════════════════════════════
      score: { 
        type: Type.NUMBER, 
        description: 'Credibility score from 0-100. 
                      0=completely fake, 100=completely real.' 
      },
      // WHY: Quantifiable metric for comparison and display
      // WHAT: Number on 0-100 scale
      // USAGE: Determines news.status (Fake/Verified)
      
      // ═══════════════════════════════════════════════════════════
      // CONFIDENCE LEVEL
      // ═══════════════════════════════════════════════════════════
      confidence: { 
        type: Type.NUMBER, 
        description: 'Confidence level from 0-1 indicating certainty.' 
      },
      // WHY: Indicates how reliable the verdict is
      // WHAT: Decimal between 0 and 1
      // LOW (< 0.5): Few comments, conflicting evidence
      // HIGH (> 0.8): Strong expert consensus, good evidence
      
      // ═══════════════════════════════════════════════════════════
      // KEY FACTORS
      // ═══════════════════════════════════════════════════════════
      keyFactors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of 3-5 key factors that influenced the verdict' 
      },
      // WHY: Transparency in decision-making
      // WHAT: Array of strings explaining the reasoning
      // EXAMPLES:
      //   - "Strong expert consensus (4 experts agree)"
      //   - "Multiple credible sources cited"
      //   - "Original source is not reputable"
      //   - "Statistics are exaggerated from original study"
      
      // ═══════════════════════════════════════════════════════════
      // RISK LEVEL
      // ═══════════════════════════════════════════════════════════
      riskLevel: {
        type: Type.STRING,
        description: 'Risk assessment: LOW, MEDIUM, or HIGH' 
      }
      // WHY: Prioritize fact-checking for high-risk misinformation
      // WHAT: Categorical risk assessment
      // HIGH: Health misinformation, election fraud claims
      // MEDIUM: General misleading news
      // LOW: Minor inaccuracies, opinion pieces
    },
    required: ['verdict', 'score', 'confidence', 'keyFactors', 'riskLevel']
  }
};
```

### Why This Structure?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHY THESE SPECIFIC FIELDS?                               │
└─────────────────────────────────────────────────────────────────────────────┘

verdict (text):
  ✓ User needs explanation, not just a score
  ✓ Builds trust through transparency
  ✓ Educational value for readers

score (0-100):
  ✓ Easy to understand metric
  ✓ Can be displayed as progress bar
  ✓ Enables sorting/filtering news by credibility

confidence (0-1):
  ✓ Acknowledges AI uncertainty
  ✓ Low confidence = needs human review
  ✓ Helps prioritize moderation efforts

keyFactors (array):
  ✓ Bullet points are easy to scan
  ✓ Highlights most important evidence
  ✓ Enables quick fact-checking verification

riskLevel (LOW/MEDIUM/HIGH):
  ✓ Prioritizes dangerous misinformation
  ✓ Health, safety, election topics get HIGH
  ✓ Helps with resource allocation
```

---

## Method 1: generateVerdict()

**Purpose:** Generate a new verdict for a news article that doesn't have one.

```javascript
async generateVerdict(newsId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: VALIDATE NEWS EXISTS
    // ═══════════════════════════════════════════════════════════
    const news = await News.findById(newsId);
    if (!news) {
      throw new Error('News article not found');
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: CHECK FOR EXISTING VERDICT
    // ═══════════════════════════════════════════════════════════
    const existingVerdict = await AIVerdict.findOne({ newsId });
    if (existingVerdict) {
      throw new Error('Verdict already exists. Use regenerate instead.');
    }
    // WHY: Prevent duplicate verdicts (newsId is unique in AIVerdict)
    // If you need to update, use regenerateVerdict() instead

    // ═══════════════════════════════════════════════════════════
    // STEP 3: SELECT TOP COMMENTS
    // ═══════════════════════════════════════════════════════════
    const topComments = await this.selectTopComments(newsId);
    
    if (topComments.inFavor.length === 0 && topComments.against.length === 0) {
      throw new Error('No comments available for analysis');
    }
    // WHY: Can't generate verdict without community input
    // This ensures some fact-checking has occurred

    // ═══════════════════════════════════════════════════════════
    // STEP 4: CALL AI FOR VERDICT
    // ═══════════════════════════════════════════════════════════
    const verdictResult = await this.callAIForVerdict(news, topComments);
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: SAVE TO DATABASE
    // ═══════════════════════════════════════════════════════════
    const aiVerdict = new AIVerdict({
      newsId,
      verdict: verdictResult.verdict,
      score: verdictResult.score,
      confidence: verdictResult.confidence,
      topComments,  // Snapshot of comments used
      analysisMetadata: await this.calculateMetadata(newsId),
      generatedBy: {
        model: 'gemini-3-flash-preview',
        version: '1.0'
      }
    });

    await aiVerdict.save();
    return aiVerdict;

  } catch (error) {
    console.error('Error generating AI verdict:', error);
    throw error;
  }
}
```

---

## Method 2: selectTopComments()

**Purpose:** Select the most relevant comments to send to the AI.

### Why Select Comments?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WHY SELECT TOP COMMENTS?                                │
└─────────────────────────────────────────────────────────────────────────────┘

Problem: News article might have 500 comments
         Sending all to AI would be:
         ✗ Too expensive (pay per token)
         ✗ Too slow (long prompts = slow responses)
         ✗ Low quality (noise drowns out signal)

Solution: Select the BEST comments
          ✓ Expert comments weighted higher
          ✓ Comments with evidence ranked up
          ✓ High vote scores preferred
          ✓ Diversity through group selection

Result: Send 16 comments (8 per stance) instead of 500
        Better quality, faster, cheaper!
```

### Complete Code

```javascript
async selectTopComments(newsId) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: FETCH ALL COMMENTS
    // ═══════════════════════════════════════════════════════════
    const [communityComments, expertComments] = await Promise.all([
      CommunityComment.find({ newsId }).populate('commenter', 'username'),
      ExpertComment.find({ newsId }).populate('expert', 'username')
    ]);
    // WHY Promise.all: Fetch both types in parallel (faster)
    // WHY populate: Get username for display

    // ═══════════════════════════════════════════════════════════
    // STEP 2: COMBINE AND FORMAT
    // ═══════════════════════════════════════════════════════════
    const allComments = [
      ...communityComments.map(c => ({
        ...c.toObject(),
        commentType: 'community',
        username: c.commenter?.username || 'Anonymous'
      })),
      ...expertComments.map(c => ({
        ...c.toObject(),
        commentType: 'expert',
        username: c.expert?.username || 'Anonymous'
      }))
    ];
    // WHY toObject(): Convert Mongoose document to plain object
    // WHY add commentType: Distinguish in AI prompt

    // ═══════════════════════════════════════════════════════════
    // STEP 3: SEPARATE BY STANCE
    // ═══════════════════════════════════════════════════════════
    const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
    const againstComments = allComments.filter(c => c.stance === 'against');
    // WHY: AI needs both sides for balanced analysis

    // ═══════════════════════════════════════════════════════════
    // STEP 4: SELECTION LOGIC
    // ═══════════════════════════════════════════════════════════
    const selectTopFromGroup = (comments) => {
      // Check if comments have been grouped by AI filtering
      const hasValidGroups = comments.some(c => c.filterGroupId);
      
      if (hasValidGroups) {
        // GROUP-BASED SELECTION
        // Select best comment from each group for diversity
        
        const groups = {};
        comments.forEach(comment => {
          const groupKey = comment.filterGroupId?.toString() || 'ungrouped';
          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(comment);
        });

        // Best from each group
        const topFromGroups = Object.values(groups).map(groupComments => {
          return groupComments.reduce((highest, current) => 
            (current.score || 0) > (highest.score || 0) ? current : highest
          );
        });

        // Sort by score, take top 8
        return topFromGroups
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 8)
          .map(formatComment);
          
      } else {
        // SCORE-BASED SELECTION
        // Simply take top 8 by vote score
        
        return comments
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 8)
          .map(formatComment);
      }
    };
    
    // Format comment for storage
    const formatComment = (comment) => ({
      commentId: comment._id,
      commentType: comment.commentType,
      commentText: comment.comment,
      evidenceLinks: comment.evidenceLinks || [],
      upvoteCount: comment.upvoteCount || 0,
      downvoteCount: comment.downvoteCount || 0,
      score: comment.score || 0
    });

    return {
      inFavor: selectTopFromGroup(inFavorComments),
      against: selectTopFromGroup(againstComments)
    };

  } catch (error) {
    console.error('Error selecting top comments:', error);
    throw error;
  }
}
```

### Visual: Comment Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMMENT SELECTION PROCESS                              │
└─────────────────────────────────────────────────────────────────────────────┘

Input: 45 comments (30 community + 15 expert)

Step 1: Separate by stance
──────────────────────────
  in_favor: 18 comments
  against: 22 comments
  general: 5 comments (ignored - need clear stance)

Step 2: Group-based selection (if groups exist)
───────────────────────────────────────────────
  IN_FAVOR groups:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Group A: "Scientific Evidence"                                          │
  │   ├─ Comment 1: score=12 ← Selected (highest)                          │
  │   ├─ Comment 4: score=8                                                 │
  │   └─ Comment 7: score=5                                                 │
  │                                                                         │
  │ Group B: "Source Credibility"                                           │
  │   └─ Comment 12: score=6 ← Selected (only one)                         │
  │                                                                         │
  │ Group C: "Historical Context"                                           │
  │   ├─ Comment 15: score=10 ← Selected (highest)                         │
  │   └─ Comment 18: score=3                                                │
  └─────────────────────────────────────────────────────────────────────────┘
  
  Selected: 3 comments (best from each group)
  Then sort by score and take up to 8

Step 3: Final output
────────────────────
  topComments: {
    inFavor: [Comment 1, Comment 15, Comment 12, ...],  // up to 8
    against: [Comment 3, Comment 9, Comment 22, ...]    // up to 8
  }

Total sent to AI: 16 comments (much less than 45!)
```

---

## Method 3: callAIForVerdict()

**Purpose:** Construct the prompt and call Gemini to generate the verdict.

```javascript
async callAIForVerdict(news, topComments) {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: FORMAT COMMENTS FOR PROMPT
    // ═══════════════════════════════════════════════════════════
    
    const inFavorText = topComments.inFavor.map((c, i) => 
      `${i+1}. "${c.commentText}" (Score: ${c.score}, Evidence: ${c.evidenceLinks.length} links)`
    ).join('\n');

    const againstText = topComments.against.map((c, i) => 
      `${i+1}. "${c.commentText}" (Score: ${c.score}, Evidence: ${c.evidenceLinks.length} links)`
    ).join('\n');
    // WHY include score: Helps AI weight comment importance
    // WHY include evidence count: Comments with sources are more credible

    // ═══════════════════════════════════════════════════════════
    // STEP 2: BUILD COMPREHENSIVE PROMPT
    // ═══════════════════════════════════════════════════════════
    
    const systemPrompt = `
Analyze this news article for credibility:

NEWS ARTICLE:
Title: "${news.title}"
Description: "${news.description}"
Source Link: ${news.link}
Current Status: ${news.status}

SUPPORTING COMMENTS (${topComments.inFavor.length}):
${inFavorText || 'No supporting comments found'}

OPPOSING COMMENTS (${topComments.against.length}):
${againstText || 'No opposing comments found'}

ANALYSIS INSTRUCTIONS:
1. Evaluate based on:
   - Quality and credibility of source
   - Evidence provided in comments
   - Expert vs community consensus
   - Consistency of information
   - Potential for harm if false

2. Generate verdict (MAX 250 words)

3. Assign credibility score (0-100):
   - 0-20: Definitely fake
   - 21-40: Likely false
   - 41-60: Mixed evidence
   - 61-80: Likely true
   - 81-100: Highly credible

4. Assess confidence (0-1)

5. Identify key factors

6. Assess risk level (LOW/MEDIUM/HIGH)

Return the JSON arguments for generate_news_verdict function.
    `;

    // ═══════════════════════════════════════════════════════════
    // STEP 3: CALL GEMINI API
    // ═══════════════════════════════════════════════════════════
    
    console.log('🤖 Calling AI for verdict...');
    
    const ai = getAI();  // Get AI instance with rotated key
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      config: { 
        tools: [{ functionDeclarations: [generateVerdictFn] }], 
        functionInvocation: 'auto' 
      }
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 4: PARSE RESPONSE (Multiple Fallbacks)
    // ═══════════════════════════════════════════════════════════
    
    // Try primary parsing
    let call = response.functionCalls?.[0];
    
    // Alternative: Check candidates structure
    if (!call && response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      call = parts.find(part => part.functionCall)?.functionCall;
    }
    
    // Another alternative
    if (!call && response.response?.candidates) {
      call = response.response.candidates[0]?.content?.parts?.[0]?.functionCall;
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: EXTRACT AND VALIDATE RESULT
    // ═══════════════════════════════════════════════════════════
    
    if (call?.name === 'generate_news_verdict') {
      return {
        verdict: call.args.verdict || call.arguments?.verdict,
        score: Math.min(100, Math.max(0, call.args.score || 50)),  // Clamp 0-100
        confidence: Math.min(1, Math.max(0, call.args.confidence || 0.5)),  // Clamp 0-1
        keyFactors: call.args.keyFactors || ['AI analysis completed'],
        riskLevel: call.args.riskLevel || 'MEDIUM'
      };
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 6: FALLBACK PARSING (Text Response)
    // ═══════════════════════════════════════════════════════════
    
    // Sometimes Gemini returns text instead of function call
    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textContent) {
      try {
        // Try to extract JSON from text
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          return {
            verdict: parsedData.verdict || 'Analysis completed.',
            score: Math.min(100, Math.max(0, parsedData.score || 60)),
            confidence: Math.min(1, Math.max(0, parsedData.confidence || 0.6)),
            keyFactors: parsedData.keyFactors || ['Parsed from text'],
            riskLevel: parsedData.riskLevel || 'MEDIUM'
          };
        }
      } catch (parseError) {
        console.log('Failed to parse JSON from text');
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 7: ULTIMATE FALLBACK
    // ═══════════════════════════════════════════════════════════
    
    return {
      verdict: 'Unable to generate analysis. Please try again.',
      score: 50,
      confidence: 0.1,
      keyFactors: ['AI service error'],
      riskLevel: 'MEDIUM'
    };

  } catch (error) {
    console.error('Error calling AI:', error);
    return {
      verdict: 'AI analysis temporarily unavailable.',
      score: 50,
      confidence: 0.1,
      keyFactors: ['AI service error'],
      riskLevel: 'MEDIUM'
    };
  }
}
```

### Why So Many Fallbacks?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PARSING FALLBACK LAYERS                             │
└─────────────────────────────────────────────────────────────────────────────┘

Google's API response structure can vary:

Format 1 (Expected):
  response.functionCalls[0].args
  
Format 2 (Alternative):
  response.candidates[0].content.parts[0].functionCall
  
Format 3 (Another Alternative):
  response.response.candidates[0].content.parts[0].functionCall
  
Format 4 (Text Response):
  response.candidates[0].content.parts[0].text = "{\"verdict\": \"...\", ...}"

Why This Happens:
  • SDK version differences
  • API version updates
  • Network/response variations
  • Edge cases in Gemini's behavior

Solution:
  Try each format in order, use first one that works
  Always have a safe fallback (score: 50, "try again")
```

---

## Method 4: calculateMetadata()

**Purpose:** Generate statistics about the comments analyzed.

```javascript
async calculateMetadata(newsId) {
  try {
    // Fetch all comments
    const [communityComments, expertComments] = await Promise.all([
      CommunityComment.find({ newsId }),
      ExpertComment.find({ newsId })
    ]);

    const allComments = [...communityComments, ...expertComments];
    
    // Build metadata object
    const metadata = {
      totalCommentsAnalyzed: allComments.length,
      
      commentsByStance: {
        inFavor: allComments.filter(c => c.stance === 'in_favor').length,
        against: allComments.filter(c => c.stance === 'against').length,
        general: allComments.filter(c => c.stance === 'general').length
      },
      
      averageScore: {
        inFavor: 0,
        against: 0
      }
    };

    // Calculate average scores per stance
    const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
    const againstComments = allComments.filter(c => c.stance === 'against');

    if (inFavorComments.length > 0) {
      metadata.averageScore.inFavor = 
        inFavorComments.reduce((sum, c) => sum + (c.score || 0), 0) / inFavorComments.length;
    }

    if (againstComments.length > 0) {
      metadata.averageScore.against = 
        againstComments.reduce((sum, c) => sum + (c.score || 0), 0) / againstComments.length;
    }

    return metadata;

  } catch (error) {
    // Safe fallback
    return {
      totalCommentsAnalyzed: 0,
      commentsByStance: { inFavor: 0, against: 0, general: 0 },
      averageScore: { inFavor: 0, against: 0 }
    };
  }
}
```

### Metadata Usage

```javascript
// Example metadata output:
{
  totalCommentsAnalyzed: 47,
  commentsByStance: {
    inFavor: 15,   // 15 support the news
    against: 27,   // 27 dispute the news ← Strong opposition!
    general: 5     // 5 are neutral/informational
  },
  averageScore: {
    inFavor: 3.2,  // Average vote score of supporting comments
    against: 7.8   // Average vote score of opposing comments ← Higher = more agreement
  }
}

// UI Display:
"Based on analysis of 47 comments:
 • 15 supporting (avg score: 3.2)
 • 27 opposing (avg score: 7.8) 
 • 5 neutral"
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE AI VERDICT FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Generate AI Verdict"
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ Controller: AIVerdictController.generateVerdict(newsId)           │
│                                                                   │
│   const verdict = await aiVerdictService.generateVerdict(newsId); │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 1. Validate: Does news exist?                                     │
│    News.findById(newsId)                                          │
│    ✗ Not found → throw Error('News not found')                   │
│    ✓ Found → continue                                             │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 2. Check: Verdict already exists?                                 │
│    AIVerdict.findOne({ newsId })                                  │
│    ✓ Exists → throw Error('Use regenerate instead')              │
│    ✗ Not found → continue                                        │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 3. selectTopComments(newsId)                                      │
│    ├─ Fetch CommunityComment + ExpertComment                      │
│    ├─ Separate by stance (inFavor vs against)                     │
│    ├─ Score and rank each group                                   │
│    └─ Return top 8 per stance                                     │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 4. callAIForVerdict(news, topComments)                            │
│    ├─ Build prompt with news + comments                           │
│    ├─ Call Gemini with generate_news_verdict function             │
│    ├─ Parse function call response                                │
│    └─ Return { verdict, score, confidence, keyFactors, riskLevel }│
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 5. calculateMetadata(newsId)                                      │
│    ├─ Count total comments                                        │
│    ├─ Count by stance                                             │
│    └─ Calculate average scores                                    │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ 6. Save AIVerdict to database                                     │
│    new AIVerdict({                                                │
│      newsId,                                                      │
│      verdict: "Based on analysis...",                             │
│      score: 35,                                                   │
│      confidence: 0.82,                                            │
│      topComments: { inFavor: [...], against: [...] },            │
│      analysisMetadata: { ... },                                   │
│      generatedBy: { model: 'gemini-3-flash-preview' }            │
│    }).save()                                                      │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
    Return AIVerdict to controller
        │
        ▼
    Send response to user
```

---

## Interview Questions & Answers

### Q1: Why limit the verdict to 250 words?
**Answer:**
1. **Readability**: Long analyses overwhelm users
2. **Focus**: Forces AI to prioritize key points
3. **Performance**: Shorter output = faster generation
4. **Storage**: Less database space per verdict
5. **Token cost**: Fewer output tokens = lower API costs

### Q2: How does comment selection ensure fairness?
**Answer:** The selection algorithm:
1. Separates by stance (doesn't mix in_favor with against)
2. Selects equal number from each side (up to 8 each)
3. Uses group-based selection for diversity
4. Scores by community votes, not arbitrary criteria
5. Includes both expert and community comments

### Q3: What happens if Gemini returns an invalid score?
**Answer:** The code clamps values to valid ranges:
```javascript
score: Math.min(100, Math.max(0, call.args.score || 50))
// If score = 150 → becomes 100
// If score = -10 → becomes 0
// If score = undefined → becomes 50 (default)
```

### Q4: Why store topComments as a snapshot?
**Answer:**
1. **Historical accuracy**: Comments can be edited/deleted later
2. **Audit trail**: Know exactly what AI analyzed
3. **Consistency**: Verdict + evidence stay in sync
4. **Performance**: No population needed for display
5. **Reproducibility**: Can explain decision with original data

### Q5: How does the service handle API failures?
**Answer:** Multi-layer fallback:
1. Try primary parsing of function call
2. Try alternative response structures
3. Try extracting JSON from text response
4. Return safe fallback (score: 50, confidence: 0.1)

The app never crashes - it always returns something usable.

---

## Summary

- **AIVerdictService** generates fact-checking verdicts using Gemini
- **generate_news_verdict** function defines structured output format
- **selectTopComments** chooses best comments for balanced analysis
- **callAIForVerdict** handles API call with multiple fallback parsers
- **calculateMetadata** provides transparency statistics
- Error handling ensures the system never fully fails

---

**Next: [10-GEMINI-KEY-ROTATION.md](./10-GEMINI-KEY-ROTATION.md)** - API key management →

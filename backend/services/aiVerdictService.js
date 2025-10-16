const { GoogleGenAI, Type } = require('@google/genai');
const { CommunityComment, ExpertComment } = require('../models/Comments');
const News = require('../models/News');
const AIVerdict = require('../models/AIVerdict');
require('dotenv').config();

// Initialize Google GenAI with proper API key configuration
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyCBp-890BKo0InjWvJLOI9Xh-8JWvK02q8"
});

// Function definition for AI verdict generation
const generateVerdictFn = {
  name: 'generate_news_verdict',
  description: 'Analyzes news article and comments to generate a credibility verdict with score.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      verdict: { 
        type: Type.STRING, 
        description: 'Comprehensive analysis of news credibility in EXACTLY 250 words or less. Should explain reasoning based on evidence, sources, and comment quality. Be concise and focused.' 
      },
      score: { 
        type: Type.NUMBER, 
        description: 'Credibility score from 0-100 where 0=completely fake, 100=completely real. Base on evidence quality, source credibility, and expert consensus.' 
      },
      confidence: { 
        type: Type.NUMBER, 
        description: 'Confidence level from 0-1 indicating how certain the AI is about this verdict.' 
      },
      keyFactors: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of 3-5 key factors that influenced the verdict (e.g., "Strong expert consensus", "Credible sources cited", "Conflicting evidence")'
      },
      riskLevel: {
        type: Type.STRING,
        description: 'Risk assessment: LOW, MEDIUM, or HIGH based on potential harm of misinformation'
      }
    },
    required: ['verdict', 'score', 'confidence', 'keyFactors', 'riskLevel']
  }
};

class AIVerdictService {
  
  /**
   * Generate AI verdict for a news article
   * @param {string} newsId - The news article ID
   * @returns {Promise<Object>} - Generated verdict object
   */
  async generateVerdict(newsId) {
    try {
      // Get news article
      const news = await News.findById(newsId);
      if (!news) {
        throw new Error('News article not found');
      }

      // Check if verdict already exists
      const existingVerdict = await AIVerdict.findOne({ newsId });
      if (existingVerdict) {
        throw new Error('Verdict already exists. Use regenerate instead.');
      }

      // Get comments and select top ones
      const topComments = await this.selectTopComments(newsId);
      
      if (topComments.inFavor.length === 0 && topComments.against.length === 0) {
        throw new Error('No comments available for analysis');
      }

      // Generate verdict using AI
      const verdictResult = await this.callAIForVerdict(news, topComments);
      
      // Save to database
      const aiVerdict = new AIVerdict({
        newsId,
        verdict: verdictResult.verdict,
        score: verdictResult.score,
        confidence: verdictResult.confidence,
        topComments,
        analysisMetadata: await this.calculateMetadata(newsId),
        generatedBy: {
          model: 'Gemini-Pro',
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

  /**
   * Regenerate existing verdict
   * @param {string} newsId - The news article ID
   * @returns {Promise<Object>} - Updated verdict object
   */
  async regenerateVerdict(newsId) {
    try {
      // Get news article
      const news = await News.findById(newsId);
      if (!news) {
        throw new Error('News article not found');
      }

      // Get updated comments
      const topComments = await this.selectTopComments(newsId);
      
      if (topComments.inFavor.length === 0 && topComments.against.length === 0) {
        throw new Error('No comments available for analysis');
      }

      // Generate new verdict
      const verdictResult = await this.callAIForVerdict(news, topComments);
      
      // Update existing or create new
      const updatedVerdict = await AIVerdict.findOneAndUpdate(
        { newsId },
        {
          verdict: verdictResult.verdict,
          score: verdictResult.score,
          confidence: verdictResult.confidence,
          topComments,
          analysisMetadata: await this.calculateMetadata(newsId),
          lastRegenerated: new Date()
        },
        { new: true, upsert: true }
      );

      return updatedVerdict;

    } catch (error) {
      console.error('Error regenerating AI verdict:', error);
      throw error;
    }
  }

  /**
   * Get existing verdict for a news article
   * @param {string} newsId - The news article ID
   * @returns {Promise<Object|null>} - Existing verdict or null
   */
  async getVerdict(newsId) {
    try {
      return await AIVerdict.findOne({ newsId }).populate('newsId', 'title description');
    } catch (error) {
      console.error('Error getting AI verdict:', error);
      throw error;
    }
  }

  /**
   * Select top comments based on score and stance
   * @param {string} newsId - The news article ID
   * @returns {Promise<Object>} - Object with inFavor and against comment arrays
   */
  async selectTopComments(newsId) {
    try {
      // Get all comments for the news article
      const [communityComments, expertComments] = await Promise.all([
        CommunityComment.find({ newsId }).populate('commenter', 'username'),
        ExpertComment.find({ newsId }).populate('expert', 'username')
      ]);

      // Combine and format comments
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

      // Separate by stance
      const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
      const againstComments = allComments.filter(c => c.stance === 'against');

      // Select top comments - improved logic for better representation
      const selectTopFromGroups = (comments) => {
        // If we have filterGroupId, use group-based selection
        const hasValidGroups = comments.some(c => c.filterGroupId);
        
        if (hasValidGroups) {
          const groups = {};
          
          // Group comments by filterGroupId
          comments.forEach(comment => {
            const groupKey = comment.filterGroupId?.toString() || 'ungrouped';
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(comment);
          });

          // Select highest scoring comment from each group
          const topFromGroups = Object.values(groups).map(groupComments => {
            return groupComments.reduce((highest, current) => 
              (current.score || 0) > (highest.score || 0) ? current : highest
            );
          });

          // Sort by score and return top 8 (increased from 5)
          return topFromGroups
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8)
            .map(comment => ({
              commentId: comment._id,
              commentType: comment.commentType,
              commentText: comment.comment,
              evidenceLinks: comment.evidenceLinks || [],
              upvoteCount: comment.upvoteCount || 0,
              downvoteCount: comment.downvoteCount || 0,
              score: comment.score || 0
            }));
        } else {
          // If no valid groups, select top comments by score directly
          return comments
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8) // Select top 8 comments
            .map(comment => ({
              commentId: comment._id,
              commentType: comment.commentType,
              commentText: comment.comment,
              evidenceLinks: comment.evidenceLinks || [],
              upvoteCount: comment.upvoteCount || 0,
              downvoteCount: comment.downvoteCount || 0,
              score: comment.score || 0
            }));
        }
      };

      return {
        inFavor: selectTopFromGroups(inFavorComments),
        against: selectTopFromGroups(againstComments)
      };

    } catch (error) {
      console.error('Error selecting top comments:', error);
      throw error;
    }
  }

  /**
   * Call AI service to generate verdict
   * @param {Object} news - News article object
   * @param {Object} topComments - Selected top comments
   * @returns {Promise<Object>} - AI verdict result
   */
  async callAIForVerdict(news, topComments) {
    try {
      const inFavorText = topComments.inFavor.map((c, i) => 
        `${i+1}. "${c.commentText}" (Score: ${c.score}, Evidence: ${c.evidenceLinks.length} links)`
      ).join('\n');

      const againstText = topComments.against.map((c, i) => 
        `${i+1}. "${c.commentText}" (Score: ${c.score}, Evidence: ${c.evidenceLinks.length} links)`
      ).join('\n');

      const systemPrompt = `
Analyze this news article for credibility based on the article content and community feedback:

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
1. Evaluate the credibility of the news based on:
   - Quality and credibility of source
   - Evidence provided in comments
   - Expert vs community consensus
   - Consistency of information
   - Potential for harm if false

2. Generate a comprehensive verdict (MAXIMUM 250 words, be concise) explaining your analysis

3. Assign a credibility score (0-100):
   - 0-20: Definitely fake/misinformation
   - 21-40: Likely false or misleading
   - 41-60: Uncertain/mixed evidence
   - 61-80: Likely true with minor concerns
   - 81-100: Highly credible and verified

4. Assess confidence level (0-1) based on available evidence quality

5. Identify key factors that influenced your decision

6. Assess risk level if this information is false

Return only the JSON arguments for the function invocation.
      `;

      console.log('🤖 Calling AI for verdict with prompt length:', systemPrompt.length);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        config: { 
          tools: [{ functionDeclarations: [generateVerdictFn] }], 
          functionInvocation: 'auto' 
        }
      });

      console.log('🔍 AI Response received:', JSON.stringify(response, null, 2));
      
      // Try multiple ways to parse the response
      let call = response.functionCalls?.[0];
      
      // Alternative parsing if functionCalls is structured differently
      if (!call && response.candidates?.[0]?.content?.parts) {
        const parts = response.candidates[0].content.parts;
        call = parts.find(part => part.functionCall)?.functionCall;
      }
      
      // Another alternative parsing method
      if (!call && response.response?.candidates) {
        call = response.response.candidates[0]?.content?.parts?.[0]?.functionCall;
      }
      
      console.log('🎯 Function call detected:', call?.name, call ? 'YES' : 'NO');
      
      if (call?.name === 'generate_news_verdict') {
        console.log('✅ Parsing successful AI verdict response');
        const result = {
          verdict: call.args.verdict || call.arguments?.verdict,
          score: Math.min(100, Math.max(0, call.args.score || call.arguments?.score || 50)), 
          confidence: Math.min(1, Math.max(0, call.args.confidence || call.arguments?.confidence || 0.5)), 
          keyFactors: call.args.keyFactors || call.arguments?.keyFactors || ['AI analysis completed'],
          riskLevel: call.args.riskLevel || call.arguments?.riskLevel || 'MEDIUM'
        };
        console.log('📊 Generated verdict score:', result.score, 'verdict length:', result.verdict?.length);
        return result;
      } else {
        // Check if response has text content instead of function call
        const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text || 
                           response.response?.text || 
                           response.text;
        
        if (textContent) {
          console.log('📝 Received text response instead of function call:', textContent.substring(0, 200));
          
          // Try to parse JSON from text response
          try {
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully parsed JSON from text response');
              return {
                verdict: parsedData.verdict || 'AI analysis completed but response format unexpected.',
                score: Math.min(100, Math.max(0, parsedData.score || 60)),
                confidence: Math.min(1, Math.max(0, parsedData.confidence || 0.6)),
                keyFactors: parsedData.keyFactors || ['Parsed from text response'],
                riskLevel: parsedData.riskLevel || 'MEDIUM'
              };
            }
          } catch (parseError) {
            console.log('❌ Failed to parse JSON from text response:', parseError.message);
          }
        }
        
        // Fallback response
        console.log('⚠️  Function call failed, using fallback response');
        console.log('Response details:', response);
        return {
          verdict: 'Unable to generate detailed analysis due to AI service error. Please try again.',
          score: 50,
          confidence: 0.1,
          keyFactors: ['AI service error - function calling failed'],
          riskLevel: 'MEDIUM'
        };
      }

    } catch (error) {
      console.error('Error calling AI for verdict:', error);
      // Return fallback verdict
      return {
        verdict: 'AI analysis temporarily unavailable. Manual review recommended.',
        score: 50,
        confidence: 0.1,
        keyFactors: ['AI service error'],
        riskLevel: 'MEDIUM'
      };
    }
  }

  /**
   * Calculate metadata about comments for analysis
   * @param {string} newsId - The news article ID
   * @returns {Promise<Object>} - Metadata object
   */
  async calculateMetadata(newsId) {
    try {
      const [communityComments, expertComments] = await Promise.all([
        CommunityComment.find({ newsId }),
        ExpertComment.find({ newsId })
      ]);

      const allComments = [...communityComments, ...expertComments];
      
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

      // Calculate average scores
      const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
      const againstComments = allComments.filter(c => c.stance === 'against');

      if (inFavorComments.length > 0) {
        metadata.averageScore.inFavor = inFavorComments.reduce((sum, c) => sum + (c.score || 0), 0) / inFavorComments.length;
      }

      if (againstComments.length > 0) {
        metadata.averageScore.against = againstComments.reduce((sum, c) => sum + (c.score || 0), 0) / againstComments.length;
      }

      return metadata;

    } catch (error) {
      console.error('Error calculating metadata:', error);
      return {
        totalCommentsAnalyzed: 0,
        commentsByStance: { inFavor: 0, against: 0, general: 0 },
        averageScore: { inFavor: 0, against: 0 }
      };
    }
  }
}

module.exports = new AIVerdictService();
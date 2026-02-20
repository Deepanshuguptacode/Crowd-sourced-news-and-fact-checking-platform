const { GoogleGenAI } = require('@google/genai');
const geminiKeyRotation = require('./geminiKeyRotation');
const dotenv = require('dotenv');
dotenv.config();

class LLMService {
  constructor() {
    // Ensure we load dotenv first
    require('dotenv').config();
    
    // Use rotation service for API key
    this.geminiKeyRotation = geminiKeyRotation;
    
    // Initialize with rotated API key configuration
    this.genAI = new GoogleGenAI({ 
      apiKey: this.geminiKeyRotation.getApiKey(),
      // Force API key authentication instead of ADC
      authConfig: {
        keyFilename: undefined,
        credentials: undefined
      }
    });
  }
  
  // Get fresh GenAI instance with rotated key
  getGenAI() {
    return new GoogleGenAI({ 
      apiKey: this.geminiKeyRotation.getApiKey(),
      authConfig: {
        keyFilename: undefined,
        credentials: undefined
      }
    });
  }

  async classifyComment(comment, existingLabels) {
    try {
      // Use the working DebateRoom classification logic
      return await this.classifyCommentWithGemini(comment, existingLabels);
    } catch (error) {
      console.error('Error in comment classification, falling back to simple classification:', error);
      return await this.simpleClassifyComment(comment, existingLabels);
    }
  }

  async generateGroupDescription(commentText) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const prompt = `Generate a brief, descriptive explanation (2-3 sentences) for a comment group based on this comment:

"${commentText}"

The description should explain what type of comments would be grouped together with this one. Make it informative and specific to help users understand the group's theme. Focus on the main topic, sentiment, or perspective being discussed.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const description = response.text().trim();
      
      return description;
    } catch (error) {
      console.error('Error generating group description:', error);
      // Fallback to simple description
      const topic = commentText.split(' ').slice(0, 5).join(' ');
      return `Comments related to: ${topic}${topic.length < commentText.length ? '...' : ''}`;
    }
  }

  async classifyCommentWithDescriptions(text, existingGroups) {
    try {
      // If no existing groups, create new
      if (existingGroups.length === 0) {
        return {
          matchedGroup: null,
          shouldCreateNew: true,
          newLabel: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
          confidence: 1.0
        };
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      // Create a detailed prompt with group descriptions
      const groupDescriptions = existingGroups.map((group, index) => 
        `${index + 1}. "${group.label}": ${group.description || 'No description'}`
      ).join('\n');

      const prompt = `Given this comment: "${text}"

Existing comment groups:
${groupDescriptions}

Task: Determine if this comment fits into any existing group based on topic similarity and thematic coherence.

Respond with JSON in this format:
{
  "matchedGroup": "exact label name if it fits (or null if no good match)",
  "newLabel": "concise label for this comment's theme",
  "confidence": 0.85,
  "reasoning": "brief explanation of the decision"
}

Only match to an existing group if there's strong thematic similarity (confidence > 0.7).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      
      try {
        // Try to parse JSON response
        const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));
        
        const exists = existingGroups.some(group => group.label === parsed.matchedGroup);
        
        return {
          matchedGroup: exists && parsed.confidence > 0.7 ? parsed.matchedGroup : null,
          shouldCreateNew: !exists || parsed.confidence <= 0.7,
          newLabel: parsed.newLabel || text.substring(0, 30) + '...',
          confidence: parsed.confidence || 0.5
        };
      } catch (parseError) {
        console.error('Error parsing classification response:', parseError);
        // Fallback to simple classification
        return await this.classifyComment(text, existingGroups.map(g => g.label));
      }
    } catch (error) {
      console.error('Error in description-based classification:', error);
      // Fallback to simple classification
      return await this.classifyComment(text, existingGroups.map(g => g.label));
    }
  }

  async classifyCommentWithGemini(text, existingLabels) {
    try {
      const { GoogleGenAI, Type } = require('@google/genai');
      // Use instance GenAI instead of creating new one
      const ai = this.genAI;

      const classifyCommentFn = {
        name: 'classify_comment',
        description: 'Assigns a comment to an existing group or, if none match, suggests a concise group title that summarizes all comments in that group.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            comment: { type: Type.STRING, description: 'The single user comment to classify.' },
            matchedGroup: { type: Type.STRING, description: 'The label of the matching group, or an empty string if no existing group matches.' },
            newLabel: { type: Type.STRING, description: 'A concise label that best summarizes all comments in this group (including the incoming one).' }
          },
          required: ['comment', 'matchedGroup', 'newLabel']
        }
      };

      const systemPrompt = [
        `Here's a new user comment:
"${text}"

`,
        `1) Compare it against these existing groups: ${existingLabels.join(', ')}.
`,
        `   • If it fits one, set matchedGroup to that label.
`,
        `   • Otherwise, matchedGroup should be an empty string.

`,
        `2) Then generate newLabel: a single, concise phrase that best summarizes all comments in the matched group, including this one.
`,
        `
Return only the JSON arguments for the function invocation.`
      ].join('');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        config: { tools: [{ functionDeclarations: [classifyCommentFn] }], functionInvocation: 'auto' }
      });

      const call = response.functionCalls?.[0];
      const { comment: incoming, matchedGroup, newLabel } =
        call?.name === 'classify_comment'
          ? call.args
          : { comment: text, matchedGroup: '', newLabel: text };

      const exists = existingLabels.includes(matchedGroup);
      return {
        matchedGroup: exists ? matchedGroup : null,
        shouldCreateNew: !exists,
        newLabel
      };
    } catch (error) {
      console.error('Error with Gemini AI classification:', error);
      return await this.simpleClassifyComment(text, existingLabels);
    }
  }

  // Simple keyword-based classification fallback
  async simpleClassifyComment(comment, existingLabels) {
    try {
      // Simple keyword matching logic
      const lowerComment = comment.toLowerCase();
      
      // Check if comment matches any existing group
      for (const label of existingLabels) {
        const labelWords = label.toLowerCase().split(' ');
        const matchCount = labelWords.filter(word => 
          lowerComment.includes(word) && word.length > 2
        ).length;
        
        if (matchCount > 0) {
          return {
            matchedGroup: label,
            shouldCreateNew: false,
            newLabel: label
          };
        }
      }

      // Generate new label based on comment content
      const newLabel = this.generateLabel(comment);
      
      return {
        matchedGroup: null,
        shouldCreateNew: true,
        newLabel: newLabel
      };
    } catch (error) {
      console.error('Error in simple comment classification:', error);
      return {
        matchedGroup: null,
        shouldCreateNew: true,
        newLabel: comment.substring(0, 50) + (comment.length > 50 ? '...' : '')
      };
    }
  }

  async classifyCommentWithGemini(comment, existingLabels) {
    try {
      const { Type } = require('@google/genai');
      
      const classifyCommentFn = {
        name: 'classify_comment',
        description: 'Assigns a comment to an existing group or, if none match, suggests a concise group title that summarizes all comments in that group.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            comment: { type: Type.STRING, description: 'The single user comment to classify.' },
            matchedGroup: { type: Type.STRING, description: 'The label of the matching group, or an empty string if no existing group matches.' },
            newLabel: { type: Type.STRING, description: 'A concise label that best summarizes all comments in this group (including the incoming one).' }
          },
          required: ['comment', 'matchedGroup', 'newLabel']
        }
      };

      const systemPrompt = [
        `Here's a new user comment:
"${comment}"

`,
        `1) Compare it against these existing groups: ${existingLabels.join(', ')}.
`,
        `   • If it fits one, set matchedGroup to that label.
`,
        `   • Otherwise, matchedGroup should be an empty string.

`,
        `2) Then generate newLabel: a single, concise phrase that best summarizes all comments in the matched group, including this one.
`,
        `
Return only the JSON arguments for the function invocation.`
      ].join('');

      const response = await this.genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        config: { tools: [{ functionDeclarations: [classifyCommentFn] }], functionInvocation: 'auto' }
      });

      const call = response.functionCalls?.[0];
      const { comment: incoming, matchedGroup, newLabel } =
        call?.name === 'classify_comment'
          ? call.args
          : { comment: comment, matchedGroup: '', newLabel: comment };

      const exists = existingLabels.includes(matchedGroup);
      return {
        matchedGroup: exists ? matchedGroup : null,
        shouldCreateNew: !exists,
        newLabel
      };
    } catch (error) {
      console.error('Error with Gemini AI classification:', error);
      return await this.simpleClassifyComment(comment, existingLabels);
    }
  }

  generateLabel(comment) {
    // Enhanced label generation - extract key topics with better logic
    const words = comment.toLowerCase().split(' ');
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'very', 'really', 'just', 'only', 'also', 'even', 'still', 'much', 'many', 'some', 'all', 'any'];
    
    // Extract meaningful words with better filtering
    const meaningfulWords = words
      .filter(word => {
        // Remove punctuation and check length
        const cleanWord = word.replace(/[^\w]/g, '');
        return cleanWord.length > 3 && !stopWords.includes(cleanWord);
      })
      .slice(0, 3);
    
    if (meaningfulWords.length === 0) {
      return 'General Discussion';
    }
    
    // Capitalize and join words
    const label = meaningfulWords.map(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    }).join(' ');
    
    return label || 'General Discussion';
  }

  // New method to regenerate group name based on multiple comments
  async regenerateGroupName(comments, currentGroupName) {
    try {
      if (this.apiKey && this.apiKey !== "your-gemini-api-key") {
        return await this.regenerateGroupNameWithGemini(comments, currentGroupName);
      } else {
        return await this.simpleRegenerateGroupName(comments, currentGroupName);
      }
    } catch (error) {
      console.error('Error regenerating group name, keeping current name:', error);
      return currentGroupName;
    }
  }

  async regenerateGroupNameWithGemini(comments, currentGroupName) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const commentsText = comments.map((comment, index) => 
        `${index + 1}. ${comment}`
      ).join('\n');

      const prompt = `
        Analyze these similar comments and suggest the best group name that represents all of them:

        Current group name: "${currentGroupName}"
        
        Comments:
        ${commentsText}
        
        Task: Suggest a concise, descriptive group name (2-4 words) that best represents the common theme of ALL these comments.
        
        Response format (JSON only):
        {
          "suggestedName": "new_group_name",
          "reasoning": "brief explanation"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        return parsed.suggestedName || currentGroupName;
      } catch (parseError) {
        console.error('Error parsing Gemini response for group name:', parseError);
        return await this.simpleRegenerateGroupName(comments, currentGroupName);
      }

    } catch (error) {
      console.error('Error with Gemini AI group name generation:', error);
      return await this.simpleRegenerateGroupName(comments, currentGroupName);
    }
  }

  async simpleRegenerateGroupName(comments, currentGroupName) {
    try {
      // Combine all comments and extract common keywords
      const allText = comments.join(' ').toLowerCase();
      const words = allText.split(' ');
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
      
      // Count word frequency
      const wordCount = {};
      words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });

      // Get most frequent meaningful words
      const topWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

      if (topWords.length === 0) {
        return currentGroupName || 'General Discussion';
      }

      return topWords.join(' ');
    } catch (error) {
      console.error('Error in simple group name regeneration:', error);
      return currentGroupName || 'General Discussion';
    }
  }

  // New method for off-topic detection
  async analyzeCommentRelevance(comment, debateTitle, debateDescription) {
    try {
      if (this.geminiKeyRotation.isConfigured()) {
        return await this.analyzeRelevanceWithGemini(comment, debateTitle, debateDescription);
      } else {
        return await this.simpleRelevanceAnalysis(comment, debateTitle, debateDescription);
      }
    } catch (error) {
      console.error('Error analyzing comment relevance:', error);
      return {
        isOffTopic: false,
        reason: 'Analysis failed, defaulting to relevant',
        label: 'Relevant'
      };
    }
  }

  async analyzeRelevanceWithGemini(comment, debateTitle, debateDescription) {
    try {
      const { GoogleGenAI, Type } = require('@google/genai');
      // Use instance GenAI instead of creating new one
      const ai = this.genAI;

      const analyzeRelevanceFn = {
        name: 'analyze_comment_relevance',
        description: 'Analyze if a comment is relevant to a debate topic and classify its relevance level.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            isOffTopic: { 
              type: Type.BOOLEAN, 
              description: 'True if the comment is off-topic or completely unrelated to the debate' 
            },
            reason: { 
              type: Type.STRING, 
              description: 'Clear explanation of why the comment is relevant, tangential, or off-topic' 
            },
            label: { 
              type: Type.STRING, 
              description: 'Classification label for the comment relevance',
              enum: ['Relevant', 'Tangential', 'Off-Topic']
            }
          },
          required: ['isOffTopic', 'reason', 'label']
        }
      };

      const systemPrompt = `
        Debate Topic: "${debateTitle}"
        Debate Description: "${debateDescription}"
        Comment to analyze: "${comment}"

        Analyze if this comment is relevant to the debate topic:

        1. RELEVANT: Directly addresses the debate topic with meaningful contribution
        2. TANGENTIAL: Somewhat related but goes off-topic or only loosely connects
        3. OFF-TOPIC: Completely unrelated, spam, or doesn't contribute to debate

        Also check for:
        - Spam patterns (repeated chars, all caps, promotional content)
        - Personal attacks or inappropriate content  
        - Comments that don't engage with the debate

        Return only the JSON arguments for the function invocation.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        config: { 
          tools: [{ functionDeclarations: [analyzeRelevanceFn] }], 
          functionInvocation: 'auto' 
        }
      });

      const call = response.functionCalls?.[0];
      const { isOffTopic, reason, label } = call?.name === 'analyze_comment_relevance'
        ? call.args
        : { isOffTopic: false, reason: 'Failed to analyze comment', label: 'Relevant' };

      return {
        isOffTopic: isOffTopic || label === 'Off-Topic',
        reason: reason || 'AI analysis completed',
        label: label || 'Relevant'
      };

    } catch (error) {
      console.error('Error with Gemini relevance analysis:', error);
      return await this.simpleRelevanceAnalysis(comment, debateTitle, debateDescription);
    }
  }

  async simpleRelevanceAnalysis(comment, debateTitle, debateDescription) {
    try {
      const commentLower = comment.toLowerCase();
      const titleWords = debateTitle.toLowerCase().split(' ');
      const descriptionWords = debateDescription.toLowerCase().split(' ');
      
      // Combine topic keywords
      const topicKeywords = [...titleWords, ...descriptionWords]
        .filter(word => word.length > 3) // Filter short words
        .slice(0, 10); // Take top 10 keywords

      // Check for spam patterns
      const spamPatterns = [
        /(.)\1{4,}/g, // Repeated characters
        /^[A-Z\s!]{10,}$/g, // All caps
        /(buy|sell|click|visit|www\.|http)/gi // Commercial content
      ];

      // Check for common off-topic patterns
      const offTopicPatterns = [
        /\b(pizza|food|recipe|cooking|eat|meal)\b/gi, // Food topics
        /\b(cat|dog|pet|animal|cute|fluffy)\b/gi, // Pet topics
        /\b(movie|film|music|song|artist|band)\b/gi, // Entertainment
        /\b(weather|sunny|rain|snow|hot|cold)\b/gi, // Weather
        /\b(vacation|holiday|travel|trip|beach)\b/gi, // Travel
        /\b(love|hate|like|dislike)\s+(you|me|this|that)\b/gi, // Personal preferences
        /^(lol|haha|omg|wow|cool|nice|good|bad|ok|okay)\s*[!.]*$/gi, // Simple reactions
        /\b(first|second|third|last)\s*[!.]*$/gi // Position comments
      ];

      const hasSpam = spamPatterns.some(pattern => pattern.test(comment));
      const hasOffTopicContent = offTopicPatterns.some(pattern => pattern.test(comment));
      
      if (hasSpam) {
        return {
          isOffTopic: true,
          reason: 'Comment appears to be spam or promotional content',
          label: 'Off-Topic'
        };
      }

      if (hasOffTopicContent) {
        return {
          isOffTopic: true,
          reason: 'Comment contains off-topic content unrelated to the debate',
          label: 'Off-Topic'
        };
      }

      // Check topic relevance with improved logic
      const relevantWords = topicKeywords.filter(keyword => 
        commentLower.includes(keyword)
      );

      // More strict off-topic detection
      // Short comments with no relevant words
      if (relevantWords.length === 0 && comment.length > 20) {
        return {
          isOffTopic: true,
          reason: 'Comment does not address the debate topic',
          label: 'Off-Topic'
        };
      }

      // Long comments with very few relevant words (less than 15% relevance)
      if (comment.length > 100 && relevantWords.length < Math.max(1, Math.ceil(topicKeywords.length * 0.15))) {
        return {
          isOffTopic: true,
          reason: 'Comment appears to be off-topic with minimal relevance to the debate',
          label: 'Off-Topic'
        };
      }

      // Medium comments with insufficient relevant words
      if (comment.length > 50 && relevantWords.length === 0) {
        return {
          isOffTopic: true,
          reason: 'Comment does not contain any topic-relevant keywords',
          label: 'Off-Topic'
        };
      }

      // Tangential detection - some relevance but not strong
      if (relevantWords.length === 1 && comment.length > 80) {
        return {
          isOffTopic: false,
          reason: 'Comment has minimal topic relevance but may be tangential',
          label: 'Tangential'
        };
      }

      return {
        isOffTopic: false,
        reason: 'Comment appears relevant to the debate topic',
        label: 'Relevant'
      };
    } catch (error) {
      console.error('Error in simple relevance analysis:', error);
      return {
        isOffTopic: false,
        reason: 'Analysis failed, defaulting to relevant',
        label: 'Relevant'
      };
    }
  }
}

module.exports = new LLMService();

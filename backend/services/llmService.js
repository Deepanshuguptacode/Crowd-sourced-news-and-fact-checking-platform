const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

class LLMService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "AIzaSyCBp-890BKo0InjWvJLOI9Xh-8JWvK02q8";
    this.genAI = new GoogleGenAI(this.apiKey);
  }

  async classifyComment(comment, existingLabels) {
    try {
      // Try Gemini AI first, fallback to simple classification
      if (this.apiKey && this.apiKey !== "your-gemini-api-key") {
        return await this.classifyCommentWithGemini(comment, existingLabels);
      } else {
        return await this.simpleClassifyComment(comment, existingLabels);
      }
    } catch (error) {
      console.error('Error in comment classification, falling back to simple classification:', error);
      return await this.simpleClassifyComment(comment, existingLabels);
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Analyze this comment: "${comment}"
        
        Existing comment groups: ${existingLabels.join(', ')}
        
        Task:
        1. If this comment fits into one of the existing groups, return the group name exactly as provided.
        2. If it doesn't fit any existing group, suggest a concise, descriptive new group label (2-4 words) that captures the main topic/theme of the comment.
        
        Guidelines for new group names:
        - Be specific and descriptive
        - Use 2-4 words maximum
        - Capture the main theme or topic
        - Avoid generic terms unless necessary
        
        Response format (JSON only):
        {
          "matchedGroup": "existing_group_name_or_null",
          "shouldCreateNew": true_or_false,
          "newLabel": "suggested_label"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        return {
          matchedGroup: parsed.matchedGroup === 'null' ? null : parsed.matchedGroup,
          shouldCreateNew: parsed.shouldCreateNew,
          newLabel: parsed.newLabel || this.generateLabel(comment)
        };
      } catch (parseError) {
        console.error('Error parsing Gemini response, using fallback:', parseError);
        return await this.simpleClassifyComment(comment, existingLabels);
      }

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
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

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
}

module.exports = new LLMService();

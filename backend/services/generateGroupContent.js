const { GoogleGenAI, Type } = require('@google/genai');

// Initialize Google GenAI - you'll need to add GEMINI_API_KEY to your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateGroupContentFn = {
  name: 'generate_group_content',
  description: 'Generates a crisp title and rich description for a group of related comments.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { 
        type: Type.STRING, 
        description: 'A short, crisp, and meaningful title that reflects the core idea/theme of the grouped comments.' 
      },
      description: { 
        type: Type.STRING, 
        description: 'A rich paragraph that captures the combined meaning of all the grouped comments, including every unique point made across the comments with no duplication.' 
      }
    },
    required: ['title', 'description']
  }
};

const generateGroupContent = async (comments) => {
  try {
    const commentTexts = comments.map((comment, index) => `${index + 1}. "${comment.text}"`).join('\n');
    
    const systemPrompt = [
      `You are tasked with creating a title and description for a group of related comments. Here are the comments in this group:

${commentTexts}

Instructions:
1. Create a short, crisp, and meaningful TITLE that reflects the core idea/theme of all these grouped comments.

2. Create a rich DESCRIPTION paragraph that:
   - Captures the combined meaning of all the grouped comments
   - Includes every unique point made across the comments
   - Has no duplication and no missed ideas
   - Reads like a human-written summary, not just a list or bullet points
   - Avoids repetition and merges similar points
   - Uses a tone consistent and suitable for public display
   - Flows cohesively as a single paragraph

The description should read like an evolving summary that reflects the collective state of the group.

Return only the JSON arguments for the function invocation.`
    ].join('');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      config: { tools: [{ functionDeclarations: [generateGroupContentFn] }], functionInvocation: 'auto' }
    });

    const call = response.functionCalls?.[0];
    const result = call?.name === 'generate_group_content' 
      ? call.args 
      : { title: 'Discussion Group', description: 'A group of related comments discussing a topic.' };

    return result;
  } catch (error) {
    console.error('Error generating group content:', error);
    // Fallback behavior
    return {
      title: 'Discussion Group',
      description: 'A group of related comments discussing a topic.'
    };
  }
}

module.exports = { generateGroupContent };

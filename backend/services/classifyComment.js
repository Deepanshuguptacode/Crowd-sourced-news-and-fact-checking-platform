const { GoogleGenAI, Type } = require('@google/genai');

// Initialize Google GenAI - you'll need to add GEMINI_API_KEY to your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

async function classifyComment(text, existingLabels) {
  try {
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
      model: 'gemini-2.5-flash',
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
    console.error('Error classifying comment:', error);
    // Fallback behavior
    return {
      matchedGroup: null,
      shouldCreateNew: true,
      newLabel: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    };
  }
}

module.exports = { classifyComment };

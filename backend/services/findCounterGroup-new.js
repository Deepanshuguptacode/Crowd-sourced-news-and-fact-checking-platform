const { GoogleGenAI, Type } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const findCounterGroupFn = {
  name: 'find_counter_group',
  description: 'Finds the most semantically similar opposing group based on description content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      matchedGroupId: { 
        type: Type.STRING, 
        description: 'The ID of the most relevant opposing group that this group counters, or empty string if no good match exists.' 
      },
      confidence: { 
        type: Type.NUMBER, 
        description: 'Confidence score from 0-1 indicating how well the groups match as opposing viewpoints.' 
      },
      reasoning: { 
        type: Type.STRING, 
        description: 'Brief explanation of why these groups are opposing counterparts or why no match was found.' 
      }
    },
    required: ['matchedGroupId', 'confidence', 'reasoning']
  }
};

const findCounterGroup = async (newGroup, opposingGroups) => {
  if (!opposingGroups.length) {
    return { counterGroupId: null, confidence: 0, reasoning: 'No opposing groups available' };
  }

  const opposingGroupsText = opposingGroups.map(g => 
    `ID: ${g._id}\nTitle: ${g.title}\nDescription: ${g.description}`
  ).join('\n\n---\n\n');

  const systemPrompt = [
    `You need to find the most relevant opposing group for this new group:

NEW GROUP:
Title: ${newGroup.title}
Description: ${newGroup.description}
Stance: ${newGroup.stance}

OPPOSING GROUPS TO MATCH AGAINST:
${opposingGroupsText}

Instructions:
1. Analyze the semantic meaning and core themes of the new group's description
2. Find the opposing group that discusses the most similar topic but from the opposite perspective
3. Consider topics, themes, and subject matter - not just keywords
4. Only return a match if there's a clear thematic opposition (confidence > 0.3)
5. If no good match exists, return empty string for matchedGroupId

Return only the JSON arguments for the function invocation.`
  ].join('');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      config: { tools: [{ functionDeclarations: [findCounterGroupFn] }], functionInvocation: 'auto' }
    });

    const call = response.functionCalls?.[0];
    const { matchedGroupId, confidence, reasoning } = call?.name === 'find_counter_group'
      ? call.args
      : { matchedGroupId: '', confidence: 0, reasoning: 'Failed to analyze groups' };

    return { 
      counterGroupId: (confidence > 0.4 && matchedGroupId) ? matchedGroupId : null, 
      confidence, 
      reasoning 
    };
  } catch (error) {
    console.error('Error finding counter group:', error);
    return { counterGroupId: null, confidence: 0, reasoning: 'Error during analysis' };
  }
};

module.exports = { findCounterGroup };

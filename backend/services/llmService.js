/**
 * LLM Service — Gemini AI Integration  (cleaned & vector-aware)
 *
 * Responsibilities kept here (things that NEED an LLM):
 *   • generateGroupContent   – title + description from comments
 *   • classifyComment        – fallback when vector match is low-confidence
 *   • analyzeCommentRelevance – fallback off-topic detection via LLM
 *   • regenerateGroupName    – regenerate label from multiple comments
 *
 * Everything that can be done with embeddings goes through vectorService.
 */

const { GoogleGenAI, Type } = require('@google/genai');
const geminiKeyRotation = require('./geminiKeyRotation');
require('dotenv').config();

class LLMService {
  constructor() {
    this.geminiKeyRotation = geminiKeyRotation;
  }

  /** Fresh GenAI instance with rotated key */
  _ai() {
    return new GoogleGenAI({
      apiKey: this.geminiKeyRotation.getApiKey(),
    });
  }

  // =====================================================================
  //  COMBINED CLASSIFY + GENERATE (single LLM call, saves 1 call)
  // =====================================================================

  /**
   * Classify a comment AND generate group title/description in ONE LLM call.
   * Replaces separate classifyComment + generateGroupContent calls.
   */
  async classifyAndGenerateContent(comment, existingLabels) {
    console.log(`🧠 LLM: classifyAndGenerateContent called`);
    console.log(`📝 Comment: "${comment.substring(0, 80)}..."`);
    console.log(`📋 Existing labels (${existingLabels.length}): [${existingLabels.slice(0, 3).join(', ')}${existingLabels.length > 3 ? '...' : ''}]`);
    
    try {
      const startTime = Date.now();
      const result = await this._classifyAndGenerateWithGemini(comment, existingLabels);
      const duration = Date.now() - startTime;
      
      console.log(`✅ LLM classify+generate completed (${duration}ms)`);
      console.log(`🎯 Result: ${result.shouldCreateNew ? 'NEW GROUP' : 'MATCHED'} - "${result.newLabel}"`);
      console.log(`📝 Title: "${result.title}"`);
      console.log(`📄 Description: "${result.description?.substring(0, 60)}..."`);
      
      return result;
    } catch (err) {
      console.error('❌ LLM classifyAndGenerateContent failed, using fallback:', err.message);
      const fallback = this._keywordClassify(comment, existingLabels);
      console.log(`🔄 Fallback classification result: "${fallback.newLabel}"`);
      
      return {
        ...fallback,
        title: `Argument: ${comment.substring(0, 30)}…`,
        description: `Debate arguments focusing on: ${comment.substring(0, 80)}. This group contains comments with similar reasoning, evidence, or claims about this topic.`,
      };
    }
  }

  async _classifyAndGenerateWithGemini(comment, existingLabels) {
    console.log(`🔍 Gemini LLM call: classifyAndGenerate`);
    console.log(`📊 Prompt context: ${existingLabels.length} existing groups, comment length: ${comment.length}`);
    
    const fn = {
      name: 'classify_and_generate',
      description: 'Classifies a comment into existing or new group. Always generates a title and description for the group.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          matchedGroup: { type: Type.STRING, description: 'Matching existing group label, or empty string if none match.' },
          newLabel:     { type: Type.STRING, description: 'Concise label for the group (whether matched or new).' },
          title:        { type: Type.STRING, description: 'Short meaningful title for the group.' },
          description:  { type: Type.STRING, description: 'Rich paragraph summarising the group theme based on the comment.' },
        },
        required: ['matchedGroup', 'newLabel', 'title', 'description'],
      },
    };

    const prompt = [
      `New debate comment: "${comment}"\n`,
      existingLabels.length > 0
        ? `Existing argument groups: ${existingLabels.join(', ')}\n`
        : `No existing groups yet.\n`,
      `Analyze this comment's specific argument, evidence, and reasoning.\n`,
      `If it matches the core argument of an existing group, set matchedGroup to that label.\n`,
      `Otherwise leave matchedGroup empty and create a new focused group.\n`,
      `Generate SPECIFIC content:\n`,
      `- newLabel: Concise argument category (2-4 words)\n`,
      `- title: Clear argument theme from the comment (5-8 words)\n`,
      `- description: Detailed summary of the specific argument, evidence type, and reasoning pattern (30-50 words)\n`,
      `Focus on the comment's actual claims, not generic discussion themes.\n`,
      `Return only the JSON arguments.`,
    ].join('');

    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🔑 Using API key rotation...`);
    
    const startTime = Date.now();
    const ai = this._ai();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ functionDeclarations: [fn] }], functionInvocation: 'auto' },
    });
    const duration = Date.now() - startTime;

    console.log(`⚡ Gemini response received (${duration}ms)`);
    console.log(`📊 Response structure:`, {
      functionCalls: res.functionCalls?.length || 0,
      text: res.text ? 'present' : 'none',
      candidates: res.candidates?.length || 0
    });

    const call = res.functionCalls?.[0];
    const args = call?.args ?? {};
    
    console.log(`🎯 Function call args:`, JSON.stringify(args, null, 2));
    
    const exists = existingLabels.includes(args.matchedGroup);
    const result = {
      matchedGroup: exists ? args.matchedGroup : null,
      shouldCreateNew: !exists,
      newLabel: args.newLabel || comment.substring(0, 40),
      title: args.title || 'Discussion Group',
      description: args.description || 'A group of related comments.',
    };
    
    console.log(`✅ Processed LLM result:`, {
      matched: exists ? args.matchedGroup : 'NONE',
      newGroup: !exists,
      label: result.newLabel
    });

    return result;
  }

  // =====================================================================
  //  COMMENT  CLASSIFICATION  (LLM fallback — vector miss)
  // =====================================================================

  /**
   * Classify a comment into an existing group or suggest a new one.
   * Only called when vectorService match is below threshold.
   */
  async classifyComment(comment, existingLabels) {
    console.log(`🧠 LLM: classifyComment (fallback) called`);
    console.log(`📝 Comment: "${comment.substring(0, 60)}..."`);
    console.log(`📋 Available labels (${existingLabels.length}): [${existingLabels.slice(0, 5).join(', ')}...]`);
    
    try {
      const startTime = Date.now();
      const result = await this._classifyWithGemini(comment, existingLabels);
      const duration = Date.now() - startTime;
      
      console.log(`✅ LLM classification completed (${duration}ms)`);
      console.log(`🎯 Classification result: ${result.shouldCreateNew ? 'NEW GROUP' : 'MATCHED'} - "${result.newLabel}"`);
      
      return result;
    } catch (err) {
      console.error('❌ LLM classification failed, using keyword fallback:', err.message);
      const fallback = this._keywordClassify(comment, existingLabels);
      console.log(`🔄 Keyword fallback result: "${fallback.newLabel}"`);
      return fallback;
    }
  }

  async _classifyWithGemini(comment, existingLabels) {
    const classifyFn = {
      name: 'classify_comment',
      description: 'Assigns a comment to an existing group or suggests a new group label.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          matchedGroup: { type: Type.STRING, description: 'Matching group label, or empty string if none.' },
          newLabel:     { type: Type.STRING, description: 'Concise label for this comment\'s group.' },
        },
        required: ['matchedGroup', 'newLabel'],
      },
    };

    const prompt = [
      `New comment: "${comment}"\n`,
      `Existing groups: ${existingLabels.join(', ')}\n`,
      `If it fits an existing group, set matchedGroup. Otherwise leave empty.\n`,
      `Generate a concise newLabel that summarises the group theme.\n`,
      `Return only the JSON arguments.`,
    ].join('');

    const ai = this._ai();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ functionDeclarations: [classifyFn] }], functionInvocation: 'auto' },
    });

    const call = res.functionCalls?.[0];
    const { matchedGroup = '', newLabel = '' } = call?.args ?? {};
    const exists = existingLabels.includes(matchedGroup);

    return {
      matchedGroup: exists ? matchedGroup : null,
      shouldCreateNew: !exists,
      newLabel: newLabel || comment.substring(0, 40),
    };
  }

  /** Simple keyword-based fallback */
  _keywordClassify(comment, existingLabels) {
    const lower = comment.toLowerCase();
    for (const label of existingLabels) {
      const words = label.toLowerCase().split(' ').filter(w => w.length > 2);
      if (words.some(w => lower.includes(w))) {
        return { matchedGroup: label, shouldCreateNew: false, newLabel: label };
      }
    }
    return { matchedGroup: null, shouldCreateNew: true, newLabel: this._extractLabel(comment) };
  }

  // =====================================================================
  //  GROUP CONTENT GENERATION
  // =====================================================================

  /**
   * Generate { title, description } for a debate group from its comments.
   */
  async generateGroupContent(comments) {
    console.log(`🧠 LLM: generateGroupContent called`);
    console.log(`📝 Processing ${comments.length} comments`);
    console.log(`📊 First comment preview: "${(comments[0]?.text ?? comments[0])?.substring(0, 50)}..."`);
    
    const texts = comments.map((c, i) => `${i + 1}. "${c.text ?? c}"`).join('\n');

    const fn = {
      name: 'generate_group_content',
      description: 'Generates title and description for a group of comments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title:       { type: Type.STRING, description: 'Short meaningful title.' },
          description: { type: Type.STRING, description: 'Rich paragraph summarising all comments.' },
        },
        required: ['title', 'description'],
      },
    };

    const prompt = `Create a title and description for this group of related comments:\n${texts}\n\nReturn only the JSON arguments.`;
    
    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🔑 Using API key rotation...`);

    try {
      const startTime = Date.now();
      const ai = this._ai();
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { tools: [{ functionDeclarations: [fn] }], functionInvocation: 'auto' },
      });
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Gemini response received (${duration}ms)`);
      
      const call = res.functionCalls?.[0];
      const result = call?.args ?? { title: 'Discussion Group', description: 'Related comments.' };
      
      console.log(`✅ Group content generated successfully`);
      console.log(`📝 Title: "${result.title}"`);
      console.log(`📄 Description: "${result.description?.substring(0, 80)}..."`);
      
      return result;
    } catch (err) {
      console.error('❌ generateGroupContent error:', err.message);
      const fallback = { title: 'Discussion Group', description: 'A group of related comments.' };
      console.log(`🔄 Using fallback content: "${fallback.title}"`);
      return fallback;
    }
  }

  /**
   * Generate a short description for a CommentGroup (news page).
   */
  async generateGroupDescription(commentText) {
    try {
      const prompt = `Analyze this debate comment and create a focused description:\n"${commentText}"\n\nGenerate 2-3 sentences that:\n1. Identify the specific argument or evidence presented\n2. Describe what type of similar reasoning/claims would belong in this group\n3. Highlight the key points that define this argument category\n\nBe specific about the argument's content, not generic discussion topics.`;
      const ai = this._ai();
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return res.text?.trim() || res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'General discussion.';
    } catch (err) {
      console.error('generateGroupDescription error:', err.message);
      return `Arguments focusing on: ${commentText.substring(0, 50)}…`;
    }
  }

  // =====================================================================
  //  GROUP NAME REGENERATION
  // =====================================================================

  async regenerateGroupName(commentTexts, currentName) {
    try {
      return await this._regenerateWithGemini(commentTexts, currentName);
    } catch (err) {
      console.error('regenerateGroupName error:', err.message);
      return this._frequencyLabel(commentTexts) || currentName;
    }
  }

  async _regenerateWithGemini(commentTexts, currentName) {
    const list = commentTexts.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const fn = {
      name: 'regenerate_name',
      description: 'Suggest a better group name.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          suggestedName: { type: Type.STRING, description: '2-4 word group name.' },
        },
        required: ['suggestedName'],
      },
    };

    const prompt = `Current name: "${currentName}"\nComments:\n${list}\n\nSuggest a concise group name. Return only JSON.`;
    const ai = this._ai();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ functionDeclarations: [fn] }], functionInvocation: 'auto' },
    });
    const call = res.functionCalls?.[0];
    return call?.args?.suggestedName || currentName;
  }

  // =====================================================================
  //  OFF-TOPIC ANALYSIS  (LLM fallback)
  // =====================================================================

  async analyzeCommentRelevance(comment, debateTitle, debateDescription) {
    try {
      if (!this.geminiKeyRotation.isConfigured()) {
        return this._simpleRelevance(comment, debateTitle, debateDescription);
      }
      return await this._relevanceWithGemini(comment, debateTitle, debateDescription);
    } catch (err) {
      console.error('analyzeCommentRelevance error:', err.message);
      return { isOffTopic: false, reason: 'Analysis failed, defaulting to relevant', label: 'Relevant' };
    }
  }

  async _relevanceWithGemini(comment, debateTitle, debateDescription) {
    const fn = {
      name: 'analyze_comment_relevance',
      description: 'Classify comment relevance to debate topic.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          isOffTopic: { type: Type.BOOLEAN, description: 'True if off-topic.' },
          reason:     { type: Type.STRING,  description: 'Why relevant or off-topic.' },
          label:      { type: Type.STRING,  description: 'Relevant | Tangential | Off-Topic' },
        },
        required: ['isOffTopic', 'reason', 'label'],
      },
    };

    const prompt = `Topic: "${debateTitle}" — ${debateDescription}\nComment: "${comment}"\nClassify relevance. Return only JSON.`;
    const ai = this._ai();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ functionDeclarations: [fn] }], functionInvocation: 'auto' },
    });
    const call = res.functionCalls?.[0];
    const { isOffTopic = false, reason = '', label = 'Relevant' } = call?.args ?? {};
    return { isOffTopic: isOffTopic || label === 'Off-Topic', reason, label };
  }

  _simpleRelevance(comment, debateTitle, debateDescription) {
    const lower = comment.toLowerCase();
    const keywords = `${debateTitle} ${debateDescription}`.toLowerCase().split(' ').filter(w => w.length > 3);
    const hits = keywords.filter(k => lower.includes(k)).length;
    if (hits === 0 && comment.length > 20) {
      return { isOffTopic: true, reason: 'No topic keywords found', label: 'Off-Topic' };
    }
    if (hits <= 1 && comment.length > 80) {
      return { isOffTopic: false, reason: 'Minimal relevance', label: 'Tangential' };
    }
    return { isOffTopic: false, reason: 'Appears relevant', label: 'Relevant' };
  }

  // =====================================================================
  //  PRIVATE HELPERS
  // =====================================================================

  _extractLabel(comment) {
    const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','very','really','just','only','also','even','still','much','many','some','all','any']);
    const words = comment.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !stop.has(w))
      .slice(0, 3);
    if (!words.length) return 'General Discussion';
    return words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  _frequencyLabel(texts) {
    const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','have','has','had','this','that','these','those']);
    const freq = {};
    texts.join(' ').toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 3 && !stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    const top = Object.entries(freq).sort(([,a],[,b]) => b - a).slice(0, 3).map(([w]) => w[0].toUpperCase() + w.slice(1));
    return top.length ? top.join(' ') : null;
  }
}

module.exports = new LLMService();

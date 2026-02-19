/**
 * LLM Service — Gemini AI Integration  (ideal-counter approach)
 *
 * Responsibilities:
 *   • classifyAndGenerateContent – classify + title + description + 2 ideal counters
 *   • generateGroupContent      – title + description + 2 ideal counters (regeneration)
 *   • classifyComment            – fallback when vector match is low-confidence
 *   • analyzeCommentRelevance    – fallback off-topic detection via LLM
 *   • regenerateGroupName        – regenerate label from multiple comments
 *
 * ALL LLM work uses Gemini function calling.
 * Counter-matching is done via embeddings of "ideal counters" in vectorService.
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
        idealCounters: [],
      };
    }
  }

  async _classifyAndGenerateWithGemini(comment, existingLabels) {
    console.log(`🔍 Gemini LLM call: classifyAndGenerate`);
    console.log(`📊 Prompt context: ${existingLabels.length} existing groups, comment length: ${comment.length}`);
    
    const fn = {
      name: 'classify_and_generate',
      description: 'Classifies a comment into existing or new group. Generates title, description, and two ideal counter-argument descriptions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          matchedGroup: { type: Type.STRING, description: 'Matching existing group label, or empty string if none match.' },
          newLabel:     { type: Type.STRING, description: 'Concise label for the group (whether matched or new).' },
          title:        { type: Type.STRING, description: 'Short meaningful title for the group.' },
          description:  { type: Type.STRING, description: 'Rich paragraph summarising the group theme based on the comment.' },
          idealCounter1: { type: Type.STRING, description: 'A specific counter-comment (30-50 words MAX) written as if it were a real opposing argument. Should directly contradict this group with concrete claims and evidence. Write it like an actual debate comment, not a description.' },
          idealCounter2: { type: Type.STRING, description: 'A variation of idealCounter1 (30-50 words MAX) that presents the SAME opposing position but phrased differently or emphasizing a different aspect. Should feel like another person making the same counter-argument with slightly different wording or focus.' },
        },
        required: ['matchedGroup', 'newLabel', 'title', 'description', 'idealCounter1', 'idealCounter2'],
      },
    };

    const prompt = [
      `New debate comment: "${comment}"\n`,
      existingLabels.length > 0
        ? `Existing argument groups: ${existingLabels.join(', ')}\n`
        : `No existing groups yet.\n`,
      `Task: Analyze this comment's SPECIFIC argument, concrete evidence, and unique reasoning.\n`,
      `\nGrouping Rules:\n`,
      `- Match ONLY if the core claim, evidence type, and reasoning approach are substantially the same\n`,
      `- Create a NEW group if the argument angle, evidence source, or reasoning differs\n`,
      `- If matched, set 'matchedGroup' to the exact label. Otherwise leave it empty.\n`,
      `\nContent Generation Requirements:\n`,
      `1. newLabel: Ultra-specific argument category (2-5 words)\n`,
      `   - Bad: "Economic Impact" Good: "Job Market Disruption Concerns"\n`,
      `   - Bad: "Safety Issues" Good: "Child Safety Data Privacy"\n`,
      `2. title: Crystal-clear argument theme derived from the comment (6-10 words)\n`,
      `   - Must capture the SPECIFIC claim/position, not generic discussion\n`,
      `   - Bad: "Discussion about privacy" Good: "Arguments that AI surveillance violates user privacy rights"\n`,
      `3. description: Highly detailed summary (40-70 words) that includes:\n`,
      `   - The exact argument/claim being made\n`,
      `   - Type of evidence referenced (statistics, expert opinion, case studies, etc.)\n`,
      `   - The reasoning pattern (causal, comparative, ethical, practical, etc.)\n`,
      `   - Key themes that would make other comments belong here\n`,
      `   - Bad: "Comments about economic aspects"\n`,
      `   - Good: "Arguments claiming AI moderation destroys jobs by replacing human moderators, citing unemployment statistics and industry reports. Focuses on economic displacement concerns and workforce transition challenges."\n`,
      `4. idealCounter1 & idealCounter2: Two variations of the ideal counter-argument (30-50 words each, MAX 50 words).\n`,
      `   - Write them as ACTUAL counter-comments, not descriptions\n`,
      `   - Both should make the SAME opposing argument but with different phrasing/emphasis\n`,
      `   - Use concrete, specific language like a real debate participant would\n`,
      `   - Example for "AI creates jobs":\n`,
      `     idealCounter1: "AI automation destroys far more jobs than it creates. Manufacturing and service industries have shed millions of positions due to AI replacements, with no comparable job growth. The retraining programs can't keep pace with displacement."\n`,
      `     idealCounter2: "The jobs AI supposedly creates are inaccessible to most displaced workers. These positions require advanced degrees and technical skills that most people losing their jobs simply don't have. We're creating inequality, not opportunity."\n`,
      `\nFocus on CONCRETE specifics from the comment, not abstract themes.\n`,
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
      idealCounters: [
        args.idealCounter1 || '',
        args.idealCounter2 || '',
      ].filter(Boolean),
    };
    
    console.log(`✅ Processed LLM result:`, {
      matched: exists ? args.matchedGroup : 'NONE',
      newGroup: !exists,
      label: result.newLabel,
      idealCounters: result.idealCounters.length,
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
  //  GROUP CONTENT GENERATION  (with ideal counters)
  // =====================================================================

  /**
   * Generate { title, description, idealCounters } for a debate group from its comments.
   * Also produces two ideal counter-argument descriptions used for embedding-based matching.
   */
  async generateGroupContent(comments) {
    console.log(`🧠 LLM: generateGroupContent called`);
    console.log(`📝 Processing ${comments.length} comments`);
    console.log(`📊 First comment preview: "${(comments[0]?.text ?? comments[0])?.substring(0, 50)}..."`);
    
    const texts = comments.map((c, i) => `${i + 1}. "${c.text ?? c}"`).join('\n');

    const fn = {
      name: 'generate_group_content',
      description: 'Generates title, description, and two ideal counter-argument descriptions for a group of debate comments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title:         { type: Type.STRING, description: 'Specific, detailed title capturing the exact argument theme (8-12 words).' },
          description:   { type: Type.STRING, description: 'Comprehensive paragraph (50-80 words) detailing the specific arguments, evidence types, reasoning patterns, and key themes of all comments.' },
          idealCounter1: { type: Type.STRING, description: 'A specific counter-comment (30-50 words MAX) written as if it were a real opposing argument. Should directly contradict this group with concrete claims and evidence. Write it like an actual debate comment, not a description.' },
          idealCounter2: { type: Type.STRING, description: 'A variation of idealCounter1 (30-50 words MAX) that presents the SAME opposing position but phrased differently or emphasizing a different aspect. Should feel like another person making the same counter-argument with slightly different wording or focus.' },
        },
        required: ['title', 'description', 'idealCounter1', 'idealCounter2'],
      },
    };

    const prompt = [
      `Analyze this group of related debate comments and generate focused content:\n${texts}`,
      `\n\nGeneration Requirements:`,
      `\n1. Title (8-12 words): SPECIFIC to the actual argument/claim, not generic`,
      `\n   - Bad: "Economic Concerns" Good: "Arguments that AI reduces human oversight and accountability"`,
      `\n2. Description (50-80 words): Synthesize specific claims, evidence types, reasoning approach`,
      `\n3. idealCounter1 (30-50 words MAX): Write an ACTUAL counter-comment:`,
      `\n   - NOT a description of what a counter would say`,
      `\n   - Write it AS IF you're making the opposing argument yourself`,
      `\n   - Be specific, concrete, and direct like a real debate comment`,
      `\n   - Example for "AI creates new jobs": "AI automation destroys far more jobs than it creates. Manufacturing and service industries have shed millions of positions due to AI replacements. The retraining programs can't keep pace with displacement."`,
      `\n4. idealCounter2 (30-50 words MAX): A variation of the same counter-argument:`,
      `\n   - Same opposing position as idealCounter1, but rephrased or emphasizing different details`,
      `\n   - Should feel like another person making the same point with different words`,
      `\n   - Example: "The jobs AI supposedly creates are inaccessible to most displaced workers. These positions require advanced technical skills that most people losing their jobs don't have. We're creating inequality, not opportunity."`,
      `\n\nFocus on actual substance, not vague discussion themes.`,
      `\nReturn only the JSON arguments.`,
    ].join('');
    
    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🔑 Using API key rotation...`);

    try {
      const startTime = Date.now();
      const ai = this._ai();
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ functionDeclarations: [fn] }],
          functionInvocation: 'auto',
          temperature: 0.0,
        },
      });
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Gemini response received (${duration}ms)`);
      
      const call = res.functionCalls?.[0];
      const args = call?.args ?? {};
      
      const result = {
        title: args.title || 'Discussion Group',
        description: args.description || 'Related comments.',
        idealCounters: [args.idealCounter1 || '', args.idealCounter2 || ''].filter(Boolean),
      };
      
      console.log(`✅ Group content generated successfully`);
      console.log(`📝 Title: "${result.title}"`);
      console.log(`📄 Description: "${result.description?.substring(0, 80)}..."`);
      console.log(`🎯 Ideal counters: ${result.idealCounters.length}`);
      result.idealCounters.forEach((ic, i) => console.log(`   IC${i+1}: "${ic.substring(0, 80)}..."`));
      
      return result;
    } catch (err) {
      console.error('❌ generateGroupContent error:', err.message);
      return { title: 'Discussion Group', description: 'A group of related comments.', idealCounters: [] };
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
  //  OFF-TOPIC ANALYSIS  (LLM-based with context)
  // =====================================================================

  /**
   * Analyze whether a comment is relevant to the debate topic.
   * Uses LLM with recent comment context for accurate classification.
   * @param {string} comment - The comment to analyze
   * @param {string} debateTitle - The debate room title
   * @param {string} debateDescription - The debate room description
   * @param {Array} recentComments - Recent comments for context (optional)
   * @returns {Promise<{isOffTopic: boolean, label: string, reason: string, confidence: number}>}
   */
  async analyzeCommentRelevance(comment, debateTitle, debateDescription, recentComments = []) {
    console.log(`🔍 LLM: Analyzing topic relevance...`);
    console.log(`📝 Comment length: ${comment.length} chars`);
    console.log(`📋 Context: ${recentComments.length} recent comments`);
    
    try {
      if (!this.geminiKeyRotation.isConfigured()) {
        console.log(`⚠️ Gemini not configured, using simple keyword-based relevance`);
        return this._simpleRelevance(comment, debateTitle, debateDescription);
      }
      
      const startTime = Date.now();
      const result = await this._relevanceWithGemini(comment, debateTitle, debateDescription, recentComments);
      const duration = Date.now() - startTime;
      
      console.log(`✅ LLM relevance analysis completed (${duration}ms)`);
      console.log(`🎯 Result: ${result.label} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
      console.log(`💬 Reason: ${result.reason}`);
      
      return result;
    } catch (err) {
      console.error('❌ analyzeCommentRelevance error:', err.message);
      return { isOffTopic: false, reason: 'Analysis failed, defaulting to relevant', label: 'Relevant', confidence: 0.5 };
    }
  }

  async _relevanceWithGemini(comment, debateTitle, debateDescription, recentComments) {
    const fn = {
      name: 'analyze_comment_relevance',
      description: 'Classify comment relevance to debate topic with context awareness.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          isOffTopic: { type: Type.BOOLEAN, description: 'True if the comment is completely off-topic and unrelated to the debate.' },
          reason:     { type: Type.STRING,  description: 'Detailed explanation of why the comment is relevant, tangential, or off-topic.' },
          label:      { type: Type.STRING,  description: 'Must be one of: "Relevant", "Tangential", or "Off-Topic"' },
          confidence: { type: Type.NUMBER,  description: 'Confidence score between 0.0 and 1.0' },
        },
        required: ['isOffTopic', 'reason', 'label', 'confidence'],
      },
    };

    const contextSection = recentComments.length > 0
      ? `\n\nRECENT DEBATE CONTEXT (last ${recentComments.length} comments):\n${recentComments.map((c, i) => `${i + 1}. [${c.stance}] "${c.text}"`).join('\n')}`
      : '';

    const prompt = [
      `You are analyzing whether a comment is relevant to an ongoing debate.\n`,
      `DEBATE TOPIC: "${debateTitle}"`,
      debateDescription ? `DESCRIPTION: ${debateDescription}` : '',
      contextSection,
      `\n\nNEW COMMENT TO EVALUATE:\n"${comment}"\n`,
      `\nANALYSIS GUIDELINES:`,
      `- RELEVANT: Directly addresses the debate topic, responds to recent points, or presents arguments related to the core theme`,
      `- TANGENTIAL: Loosely related but goes off on a side topic or makes indirect connections`,
      `- OFF-TOPIC: Completely unrelated to the debate topic and recent discussion flow`,
      `\nConsider:`,
      `1. Does it address the core debate topic or closely related themes?`,
      `2. Does it respond to or engage with points made in recent comments?`,
      `3. Is it a reasonable tangent vs completely off-topic?`,
      `4. Would this comment make sense in this debate context?`,
      `\nProvide your classification with confidence score and detailed reasoning.`,
    ].filter(Boolean).join('\n');

    console.log(`📝 Prompt length: ${prompt.length} chars`);
    
    const ai = this._ai();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        tools: [{ functionDeclarations: [fn] }], 
        functionInvocation: 'auto',
        temperature: 0.0,
      },
    });
    
    const call = res.functionCalls?.[0];
    const { isOffTopic = false, reason = '', label = 'Relevant', confidence = 0.8 } = call?.args ?? {};
    
    return { 
      isOffTopic: isOffTopic || label === 'Off-Topic', 
      reason, 
      label,
      confidence: Math.min(Math.max(confidence, 0), 1)
    };
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

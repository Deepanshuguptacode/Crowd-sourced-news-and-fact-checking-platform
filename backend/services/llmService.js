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
      description: 'Generates highly specific title and description for a group of debate comments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title:       { type: Type.STRING, description: 'Specific, detailed title capturing the exact argument theme (8-12 words).' },
          description: { type: Type.STRING, description: 'Comprehensive paragraph (50-80 words) detailing the specific arguments, evidence types, reasoning patterns, and key themes of all comments.' },
        },
        required: ['title', 'description'],
      },
    };

    const prompt = `Analyze this group of related debate comments and generate focused content:\n${texts}\n\nGeneration Requirements:\n1. Title (8-12 words):\n   - Must be SPECIFIC to the actual argument/claim\n   - Include key distinguishing details\n   - Bad: "Economic Concerns" Good: "Arguments that AI reduces human oversight and accountability"\n\n2. Description (50-80 words):\n   - Synthesize the SPECIFIC claims across all comments\n   - Identify common evidence types (statistics, case studies, expert quotes, etc.)\n   - Note the reasoning approach (ethical, practical, comparative, causal)\n   - Describe what makes comments belong in this group\n   - Be concrete about the argument's content, not generic\n\nFocus on actual substance, not vague discussion themes.\nReturn only the JSON arguments.`;
    
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

  // =====================================================================
  //  COMBINED GROUP CONTENT + COUNTER-GROUP MATCHING  (single LLM call)
  // =====================================================================

  /**
   * Generate { title, description } AND pick the best counter-group from
   * a list of opposing groups — all in ONE LLM call.
   *
   * @param {Array} comments       – DebateComment docs (or strings) in this group
   * @param {Array} opposingGroups – [{ _id, title, description }] from opposite stance
   * @returns {{ title, description, counterGroupId, counterGroupTitle, counterReason }}
   */
  async generateGroupContentWithCounter(comments, opposingGroups = [], debateContext = '') {
    console.log(`🧠 LLM: generateGroupContentWithCounter called`);
    console.log(`📝 Comments: ${comments.length}, Opposing groups: ${opposingGroups.length}`);

    const texts = comments.map((c, i) => `${i + 1}. "${c.text ?? c}"`).join('\n');

    // Build opposing groups list for the prompt
    let opposingSection = '';
    if (opposingGroups.length > 0) {
      const opposingList = opposingGroups.map((g, i) => {
        // Include up to 3 comment previews for richer context
        const commentPreviews = (g.commentTexts || [])
          .slice(0, 3)
          .map(t => `     • "${t.substring(0, 120)}"`);
        const previewStr = commentPreviews.length > 0 ? `\n${commentPreviews.join('\n')}` : '';
        return `${i + 1}. [ID: ${g._id}] "${g.title}" — ${g.description}${previewStr}`;
      }).join('\n');
      opposingSection = [
        `\n\n═══ OPPOSING ARGUMENT GROUPS (these argue the OPPOSITE stance) ═══`,
        `\n${opposingList}`,
        `\n\n═══ COUNTER-GROUP MATCHING RULES (STRICT CONFIDENCE THRESHOLD) ═══`,
        `\n⚠️ CRITICAL: Only return a counterGroupId if your confidence is ≥85%. Otherwise leave it empty.`,
        `\n`,
        `\nYou MUST find the single opposing group that most directly CONTRADICTS, REBUTS, or RESPONDS to this group's core claim.`,
        `\n`,
        `\nWhat makes a GOOD counter-pair (confidence ≥85%):`,
        `\n  ✓ "AI creates new jobs" ↔ "AI destroys existing jobs" (same topic, opposite conclusion) - CONFIDENCE: 95%`,
        `\n  ✓ "Social media improves mental health" ↔ "Social media harms mental health" (direct opposition) - CONFIDENCE: 98%`,
        `\n  ✓ "Regulation helps innovation" ↔ "Regulation stifles innovation" (same mechanism, opposite effect) - CONFIDENCE: 92%`,
        `\n  ✓ "Evidence shows vaccines are safe" ↔ "Studies question vaccine side effects" (same evidence domain, opposing claims) - CONFIDENCE: 88%`,
        `\n`,
        `\nWhat makes a BAD counter-pair (confidence <85%, return empty):`,
        `\n  ✗ "AI creates jobs" ↔ "AI has privacy issues" (completely different argument angle) - CONFIDENCE: 20%`,
        `\n  ✗ "Vaccines save lives" ↔ "Healthcare is expensive" (different topic entirely) - CONFIDENCE: 10%`,
        `\n  ✗ "Free speech matters" ↔ "Climate change is real" (unrelated arguments) - CONFIDENCE: 5%`,
        `\n  ✗ "Economic benefits of policy X" ↔ "Environmental concerns about policy X" (related topic but different angles, not direct contradiction) - CONFIDENCE: 60%`,
        `\n`,
        `\nKey principle: Counter-arguments must address the SAME specific claim from the OPPOSITE perspective.`,
        `\nThey should be arguing about the same thing but reaching different conclusions.`,
        `\n`,
        `\nConfidence scoring guidelines:`,
        `\n  95-100: Same topic, directly opposite claims, crystal clear contradiction`,
        `\n  85-94:  Same topic, opposing perspectives, strong counter-relationship`,
        `\n  70-84:  Related topic, somewhat opposing but not direct counters (TOO LOW - return empty)`,
        `\n  <70:    Different angles, weak opposition, or unrelated (TOO LOW - return empty)`,
        `\n`,
        `\nIf MULTIPLE opposing groups could be counters, pick the one with HIGHEST confidence.`,
        `\nIf NO opposing group reaches ≥85% confidence, set counterGroupId to empty string.`,
        `\nDo NOT force a match — a wrong match is worse than no match.`,
        `\n`,
        `\nIn counterReason: explain specifically WHAT claim is being countered, HOW the opposing group contradicts it, and WHY your confidence is at this level.`,
      ].join('');
    }

    const fn = {
      name: 'generate_group_content_with_counter',
      description: 'Generates group title, description, and identifies the best counter-argument group with confidence scoring.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title:             { type: Type.STRING, description: 'Specific, detailed title capturing the exact argument theme (8-12 words).' },
          description:       { type: Type.STRING, description: 'Comprehensive paragraph (50-80 words) detailing the specific arguments, evidence types, reasoning patterns.' },
          counterGroupId:    { type: Type.STRING, description: 'The MongoDB _id string of the best opposing group that directly counters this group. Must be one of the [ID: ...] values provided. ONLY return an ID if your confidence is ≥85%. Otherwise return empty string.' },
          counterGroupTitle: { type: Type.STRING, description: 'Title of the matched counter-group, or empty string if confidence <85%.' },
          counterReason:     { type: Type.STRING, description: 'Specific explanation: what claim is being countered and how the opposing group contradicts it. Or why no group qualifies or why confidence is below 85%.' },
          confidence:        { type: Type.NUMBER, description: 'Your confidence (0-100) that this is a genuine counter-argument pair. Only values ≥85 will be accepted. Consider: Do they address the SAME topic from OPPOSITE perspectives? Are the claims directly contradictory? If unsure or topic overlap is weak, return <85.' },
        },
        required: ['title', 'description', 'counterGroupId', 'counterGroupTitle', 'counterReason', 'confidence'],
      },
    };

    const contextLine = debateContext ? `\nDEBATE TOPIC: ${debateContext}\n` : '';

    const prompt = [
      `${contextLine}Analyze this group of related debate comments and generate focused content:\n${texts}`,
      `\n\nTITLE & DESCRIPTION REQUIREMENTS:`,
      `\n1. Title (8-12 words): SPECIFIC to the actual argument/claim, not generic`,
      `\n2. Description (50-80 words): Synthesize specific claims, evidence types, reasoning approach`,
      opposingSection,
      `\n\nReturn only the JSON arguments.`,
    ].join('');

    console.log(`📝 Prompt length: ${prompt.length} chars`);

    // Retry up to 3 times on failure
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const startTime = Date.now();
        const ai = this._ai();
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            tools: [{ functionDeclarations: [fn] }],
            functionInvocation: 'auto',
            temperature: 0.0, // Zero temperature for maximum determinism and consistency
          },
        });
        const duration = Date.now() - startTime;

        const call = res.functionCalls?.[0];
        const args = call?.args ?? {};

        console.log(`⚡ LLM response received (attempt ${attempt}, ${duration}ms)`);
        console.log(`📝 Title: "${args.title}"`);
        console.log(`🔗 Counter: "${args.counterGroupTitle || 'NONE'}" (ID: ${args.counterGroupId || 'NONE'})`);
        console.log(`💬 Reason: "${args.counterReason}"`);
        console.log(`🎯 Confidence: ${args.confidence}%`);

        // Validate the counterGroupId actually exists in the opposing groups we passed
        let validCounterId = null;
        let validCounterTitle = null;
        let confidence = parseFloat(args.confidence) || 0;

        // STRICT THRESHOLD: Only accept if confidence >= 85%
        if (args.counterGroupId && args.counterGroupId.trim() !== '' && confidence >= 85) {
          const matched = opposingGroups.find(g => g._id.toString() === args.counterGroupId);
          if (matched) {
            validCounterId = matched._id.toString();
            validCounterTitle = args.counterGroupTitle || matched.title;
            console.log(`✅ Counter-match ACCEPTED (confidence: ${confidence}%)`);
          } else {
            console.log(`⚠️ LLM returned counterGroupId "${args.counterGroupId}" not found in opposing groups, ignoring`);
            confidence = 0; // Reset confidence if ID is invalid
          }
        } else if (args.counterGroupId && args.counterGroupId.trim() !== '') {
          console.log(`❌ Counter-match REJECTED - confidence ${confidence}% < 85% threshold`);
        } else {
          console.log(`ℹ️ No counter-match suggested (confidence: ${confidence}%)`);
        }

        return {
          title: args.title || 'Discussion Group',
          description: args.description || 'A group of related comments.',
          counterGroupId: validCounterId,
          counterGroupTitle: validCounterTitle,
          counterReason: args.counterReason || '',
          confidence: confidence,
        };
      } catch (err) {
        console.error(`❌ generateGroupContentWithCounter attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
        const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        if (attempt < MAX_RETRIES) {
          const wait = isRateLimit ? 4000 * attempt : 2000 * attempt;
          console.log(`⏳ Retrying in ${wait / 1000}s...`);
          this.geminiKeyRotation.advanceKey(); // rotate key before retry
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        console.error('❌ All retries exhausted for generateGroupContentWithCounter');
        return {
          title: 'Discussion Group',
          description: 'A group of related comments.',
          counterGroupId: null,
          counterGroupTitle: null,
          counterReason: 'LLM call failed after retries',
          confidence: 0,
        };
      }
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

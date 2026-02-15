/**
 * Central Vector Service — Pinecone + Gemini Embeddings
 * 
 * This is the single entry-point every feature uses for:
 *   • Generating text embeddings  (Gemini text-embedding-004)
 *   • Storing / querying vectors  (Pinecone)
 *   • Comment-to-group matching   (debate + news comments)
 *   • Counter-group matching      (debate groups)
 *   • Off-topic detection cache   (debate comments)
 * 
 * Namespaces inside the single Pinecone index:
 *   "debate-groups"     – DebateGroup title+description embeddings
 *   "news-groups"       – CommentGroup (news page) embeddings
 *   "debate-topics"     – DebateRoom title+description (for off-topic)
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenAI } = require('@google/genai');
const geminiKeyRotation = require('./geminiKeyRotation');
require('dotenv').config();

// ─── In-memory embedding cache ──────────────────────────────────────────────
const embeddingCache = new Map();
const CACHE_MAX = 2000;
const CACHE_TTL = 3600000; // 1 hour

function getCached(key) {
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { embeddingCache.delete(key); return null; }
  return entry.vec;
}

function setCache(key, vec) {
  if (embeddingCache.size >= CACHE_MAX) {
    // evict oldest
    const oldest = embeddingCache.keys().next().value;
    embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, { vec, ts: Date.now() });
}

// ─── Constants ──────────────────────────────────────────────────────────────
const NAMESPACES = {
  DEBATE_GROUPS: 'debate-groups',
  NEWS_GROUPS:   'news-groups',
  DEBATE_TOPICS: 'debate-topics',
};

const SIMILARITY_THRESHOLDS = {
  GROUP_MATCH:   0.70,   // comment→group match (high = confident match)
  COUNTER_MATCH: 0.55,   // group→counter-group match
  OFF_TOPIC:     0.25,   // below this = off-topic
  TANGENTIAL:    0.40,   // between OFF_TOPIC and this = tangential
};

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM   = 768;   // gemini-embedding-001 with outputDimensionality=768

// ─── Singleton ──────────────────────────────────────────────────────────────
class VectorService {
  constructor() {
    this.pinecone  = null;
    this.index     = null;
    this.ready     = false;
    this._initPromise = null;
  }

  // ── Lazy initialisation (called once) ──────────────────────────────────
  async init() {
    if (this.ready) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
          console.warn('⚠️  PINECONE_API_KEY not set – vector service disabled');
          return;
        }

        this.pinecone = new Pinecone({ apiKey });

        const indexName = process.env.PINECONE_INDEX_NAME || 'voxveritas';

        // List existing indexes
        const { indexes } = await this.pinecone.listIndexes();
        const exists = indexes?.some(i => i.name === indexName);

        if (!exists) {
          console.log(`📦 Creating Pinecone index "${indexName}" …`);
          await this.pinecone.createIndex({
            name: indexName,
            dimension: EMBEDDING_DIM,
            metric: 'cosine',
            spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
          });
          // Wait for index to be ready
          console.log('⏳ Waiting for index to initialise …');
          await new Promise(r => setTimeout(r, 30000));
        }

        this.index = this.pinecone.index(indexName);
        this.ready = true;
        console.log(`✅ VectorService ready  (index: ${indexName})`);
      } catch (err) {
        console.error('❌ VectorService init failed:', err.message);
        this.ready = false;
      }
    })();

    return this._initPromise;
  }

  // ── Embedding generation (with auto-retry on rate limit) ────────────
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) return null;

    const cacheKey = text.substring(0, 200);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`🎯 Embedding cache HIT (${text.substring(0, 50)}...)`);
      return cached;
    }

    console.log(`🤖 Generating embedding for text: "${text.substring(0, 100)}..."`)
    console.log(`📏 Text length: ${text.length} chars, Cache key: ${cacheKey.substring(0, 30)}...`);
    
    const MAX_EMBED_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_EMBED_RETRIES; attempt++) {
      try {
        const startTime = Date.now();
        const ai = new GoogleGenAI({ apiKey: geminiKeyRotation.getApiKey() });
        const res = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIM },
        });
        const duration = Date.now() - startTime;
        
        const vec = res.embeddings?.[0]?.values ?? res.embedding?.values;
        if (!vec || vec.length === 0) throw new Error('Empty embedding response');
        
        console.log(`✅ Embedding generated successfully (${duration}ms, dim: ${vec.length})`);
        setCache(cacheKey, vec);
        return vec;
      } catch (err) {
        const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        console.error(`❌ Embedding attempt ${attempt + 1}/${MAX_EMBED_RETRIES} failed:`, err.message);
        
        if (isRateLimit && attempt < MAX_EMBED_RETRIES - 1) {
          const wait = 3000 * (attempt + 1);
          console.warn(`⏳ Rate-limited, retrying in ${wait/1000}s (attempt ${attempt + 2})`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        console.error('❌ Final embedding failure:', err.message);
        return null;
      }
    }
    return null;
  }

  // ── Query with pre-computed embedding (skip embedding generation) ────
  async queryWithEmbedding(embedding, topK = 5, filter = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready || !embedding) return [];

    try {
      const res = await this.index.namespace(namespace).query({
        vector: embedding,
        topK,
        filter,
        includeMetadata: true,
      });
      return res.matches || [];
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone connection failed (${namespace}), falling back`);
        return [];
      }
      throw err;
    }
  }

  // ── Core upsert (with connection error handling) ──────────────────────
  async upsertVector(id, text, metadata = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return false;

    try {
      const vector = await this.generateEmbedding(text);
      if (!vector) {
        console.warn(`Skipping upsert for ${id} — embedding generation failed`);
        return false;
      }
      await this.index.namespace(namespace).upsert({
        records: [{
          id: String(id),
          values: vector,
          metadata: { ...metadata, _text: text.substring(0, 500) },
        }],
      });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone upsert failed for ${id}, continuing without vector storage`);
        return false;
      }
      throw err;
    }
  }

  // ── Core query (with connection error handling) ──────────────────────
  async queryVector(text, topK = 5, filter = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return [];

    try {
      const vector = await this.generateEmbedding(text);
      if (!vector) return [];
      const res = await this.index.namespace(namespace).query({
        vector,
        topK,
        filter,
        includeMetadata: true,
      });
      return res.matches || [];
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone connection failed (${namespace}), falling back to LLM`);
        return [];
      }
      throw err;
    }
  }

  // ── Delete vector (with connection error handling) ────────────────────
  async deleteVector(id, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return false;
    try {
      await this.index.namespace(namespace).deleteOne({ id: String(id) });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone delete failed for ${id}, continuing`);
        return false;
      }
      throw err;
    }
  }

  // ── Delete many (with connection error handling) ──────────────────────
  async deleteMany(ids, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready || !ids.length) return false;
    try {
      await this.index.namespace(namespace).deleteMany({ ids: ids.map(String) });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone bulk delete failed for ${ids.length} items, continuing`);
        return false;
      }
      throw err;
    }
  }

  // =====================================================================
  //  DEBATE  FEATURE  HELPERS
  // =====================================================================

  /**
   * Match a new debate comment to the best existing group.
   * Returns { groupId, score } or null if no good match.
   */
  async matchDebateComment(text, roomId, stance, embedding = null) {
    const matches = embedding
      ? await this.queryWithEmbedding(embedding, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS)
      : await this.queryVector(text, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS);

    const best = matches[0];
    if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) {
      return { groupId: best.id, score: best.score };
    }
    return null;
  }

  /**
   * Store / update a debate group embedding.
   */
  async storeDebateGroup(groupId, title, description, roomId, stance) {
    const combined = `${title}. ${description}`;
    return await this.upsertVector(groupId, combined, {
      roomId: String(roomId),
      stance,
      title,
    }, NAMESPACES.DEBATE_GROUPS);
  }

  /**
   * Find the best counter-group (opposing stance).
   * Returns { counterGroupId, score } or null.
   * Enhanced with better match evaluation and logging.
   */
  async findCounterGroup(groupId, title, description, roomId, opposingStance) {
    console.log(`🔍 Finding counter-group for "${title}" (stance: ${opposingStance})`);
    
    const combined = `${title}. ${description}`;
    const matches = await this.queryVector(combined, 5, {
      roomId: String(roomId),
      stance: opposingStance,
    }, NAMESPACES.DEBATE_GROUPS);

    console.log(`📊 Found ${matches.length} potential counter-matches`);
    
    // Filter out self and log all candidates
    const candidates = matches.filter(m => m.id !== String(groupId));
    candidates.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.metadata?.title || 'Unknown'} (score: ${match.score.toFixed(3)})`);
    });

    const best = candidates[0];
    if (best && best.score >= SIMILARITY_THRESHOLDS.COUNTER_MATCH) {
      console.log(`✅ Best counter-match: "${best.metadata?.title}" (score: ${best.score.toFixed(3)})`);
      return { counterGroupId: best.id, score: best.score };
    }
    
    console.log(`❌ No suitable counter-match found (threshold: ${SIMILARITY_THRESHOLDS.COUNTER_MATCH})`);
    return null;
  }

  // =====================================================================
  //  NEWS COMMENT GROUPING HELPERS
  // =====================================================================

  /**
   * Match a news-page comment to an existing CommentGroup.
   * Returns { groupId, score, label } or null.
   */
  async matchNewsComment(text, newsId, embedding = null) {
    const matches = embedding
      ? await this.queryWithEmbedding(embedding, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS)
      : await this.queryVector(text, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS);

    const best = matches[0];
    if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) {
      return { groupId: best.id, score: best.score, label: best.metadata?.label };
    }
    return null;
  }

  /**
   * Store / update a news CommentGroup embedding.
   */
  async storeNewsGroup(groupId, label, description, newsId) {
    const combined = `${label}. ${description || ''}`;
    return await this.upsertVector(groupId, combined, {
      newsId: String(newsId),
      label,
    }, NAMESPACES.NEWS_GROUPS);
  }

  // =====================================================================
  //  OFF-TOPIC DETECTION HELPER
  // =====================================================================

  /**
   * Store a debate room topic vector (for off-topic checks).
   */
  async storeDebateTopic(roomId, title, description) {
    const combined = `${title}. ${description || ''}`;
    return await this.upsertVector(roomId, combined, {
      roomId: String(roomId),
      title,
    }, NAMESPACES.DEBATE_TOPICS);
  }

  /**
   * Check comment relevance to a debate topic.
   * Returns { isOffTopic, label, score }
   */
  async checkTopicRelevance(commentText, roomId, embedding = null) {
    const commentVec = embedding || await this.generateEmbedding(commentText);
    if (!commentVec) return { isOffTopic: false, label: 'Relevant', score: 1 };

    await this.init();
    if (!this.ready) return { isOffTopic: false, label: 'Relevant', score: 1 };

    try {
      // Fetch the topic vector for this room
      const res = await this.index.namespace(NAMESPACES.DEBATE_TOPICS).query({
        vector: commentVec,
        topK: 1,
        filter: { roomId: String(roomId) },
        includeMetadata: true,
      });

      const best = res.matches?.[0];
      if (!best) return { isOffTopic: false, label: 'Relevant', score: 1 };

      const score = best.score;

      if (score < SIMILARITY_THRESHOLDS.OFF_TOPIC) {
        return { isOffTopic: true, label: 'Off-Topic', score };
      }
      if (score < SIMILARITY_THRESHOLDS.TANGENTIAL) {
        return { isOffTopic: false, label: 'Tangential', score };
      }
      return { isOffTopic: false, label: 'Relevant', score };
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone topic check failed for room ${roomId}, assuming relevant`);
        return { isOffTopic: false, label: 'Relevant', score: 1 };
      }
      throw err;
    }
  }

  // =====================================================================
  //  UTILITY
  // =====================================================================

  /** Check if error is a connection/network issue that should trigger fallback */
  _isConnectionError(err) {
    const msg = err?.message?.toLowerCase() || '';
    const name = err?.name?.toLowerCase() || '';
    const code = err?.code || err?.cause?.code || '';
    
    return (
      name.includes('pineconeconnectionerror') ||
      msg.includes('request failed to reach pinecone') ||
      msg.includes('connect timeout') ||
      msg.includes('network') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('timeout') ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'ECONNRESET' ||
      code === 'ENOTFOUND'
    );
  }

  getNamespaces() { return NAMESPACES; }
  getThresholds() { return SIMILARITY_THRESHOLDS; }
}

module.exports = new VectorService();

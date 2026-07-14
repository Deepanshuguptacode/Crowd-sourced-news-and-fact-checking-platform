# 03 — RAG: Retrieval Augmented Generation
> The most popular GenAI architecture pattern — and we use it in our project!

---

## 🤔 What Problem Does RAG Solve?

Imagine you're building a customer support bot for a bank. The LLM (like Gemini) was trained on internet data up to some cutoff date. It doesn't know:
- Your bank's specific policies
- Account details of specific customers
- Today's exchange rates
- Internal product updates

**Option 1**: Fine-tune the LLM on your bank's data → Expensive ($10,000s), slow, data becomes stale  
**Option 2**: Include all bank documents in every prompt → Way too many tokens, expensive, slow  
**Option 3 (RAG)**: When a user asks a question, first **retrieve** the relevant bank document, then give ONLY that document to the LLM → Fast, cheap, always up-to-date ✅

---

## 📖 What is RAG?

**Full form**: **R**etrieval **A**ugmented **G**eneration

**Simple definition**: RAG = Find relevant information first → Give that info to the LLM → LLM generates a grounded, accurate answer

**Key insight**: LLMs are great at reasoning and writing. They're not great at remembering specific, updated facts. RAG separates these concerns — use a database for facts, use LLM for reasoning.

---

## 🏗️ RAG Architecture (Step by Step)

```
                    USER QUESTION
                         │
                         ▼
              ┌─────────────────────┐
              │  1. QUERY EMBEDDING │  Convert question to vector
              │  "Is this article   │  [0.23, 0.87, 0.41, ...]
              │   about politics?"  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  2. VECTOR SEARCH   │  Search database for similar vectors
              │     (Pinecone)      │  Return top-K most relevant documents
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  3. CONTEXT BUILD   │  Combine: Question + Retrieved Docs
              │                     │  "Answer this question using the
              │                     │   following context: [doc1, doc2...]"
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  4. LLM GENERATION  │  Gemini reads question + context
              │     (Gemini)        │  Generates grounded answer
              └──────────┬──────────┘
                         │
                         ▼
                    FINAL ANSWER
                  (based on real data)
```

---

## 🔄 RAG in Our VoxVeritas Project

**Our pipeline when a user posts a debate comment**:

```
User posts comment: "AI will replace all programmers in 5 years"
              │
              ▼
Step 1: EMBED the comment
  → Call text-embedding-004 model
  → Get 768-dimensional vector: [0.21, -0.43, 0.87, ...]
              │
              ▼
Step 2: SEARCH Pinecone (Vector DB)
  → Find most similar existing debate groups
  → Also search "ideal counter-arguments" index
  → Get similarity scores (e.g., 0.83, 0.71, 0.65...)
              │
              ▼
Step 3: DECISION GATE
  → If similarity > 0.75: MATCH FOUND!
     → Assign comment to that group (NO LLM call needed! 💰)
  → If similarity < 0.75: No good match
     → Call Gemini LLM for classification
              │
              ▼
Step 4 (if no match): LLM CALL
  → Send: comment + top existing group labels
  → Gemini decides: new group or match
  → If new group: Gemini generates title + description + ideal counters
              │
              ▼
Step 5: STORE BACK
  → Store new group in MongoDB
  → Store embedding in Pinecone
  → Store ideal counter embeddings in separate Pinecone index
```

**Why this is RAG**: We **retrieve** relevant debate groups from Pinecone BEFORE calling the LLM. The retrieved context helps Gemini make better classification decisions.

---

## 💰 Why RAG is Cost-Effective

| Scenario | Without RAG | With RAG (Our Approach) |
|----------|------------|------------------------|
| 1000 comments on a debate | 1000 LLM calls | ~200-300 LLM calls (70%+ matched by vector) |
| Cost per 1000 LLM calls | ~$0.50-$2.00 | ~$0.15-0.60 |
| Accuracy | LLM guesses categories | LLM uses real existing groups as context |
| Speed | ~500ms per comment | ~50ms for vector match, 500ms only for new groups |

---

## 🆚 RAG vs Fine-tuning

This is a very common interview question!

| Aspect | RAG | Fine-tuning |
|--------|-----|------------|
| **Data updates** | Real-time (update the database) | Retrain the model (expensive) |
| **Cost** | Cheap (vector DB queries) | Expensive ($1000s for training) |
| **Accuracy** | High for specific facts | High for style/format adaptation |
| **Transparency** | Can cite source documents | Black box |
| **When to use** | When data changes frequently | When you need specific style/format |
| **Our project** | ✅ Used RAG | ❌ Not used (unnecessary) |

**Interview answer**: "We chose RAG over fine-tuning because our debate groups are created dynamically by users. There's no fixed training set — every new debate generates new categories. RAG lets us store these in real-time in Pinecone and retrieve them for context. Fine-tuning would be obsolete the moment new debates are created."

---

## 🎯 RAG Challenges & How We Handle Them

### 1. Retrieval Quality (Garbage In = Garbage Out)
**Problem**: If you retrieve the wrong documents, the LLM gives wrong answers.  
**Our solution**: We have two search indices in Pinecone:
  - Main index: group descriptions (for new comment → existing group matching)
  - Counter index: ideal counter-arguments (for matching opposing comments)

### 2. Similarity Threshold Tuning
**Problem**: Setting the threshold too high → too many LLM calls (expensive). Too low → wrong group matches.  
**Our solution**: We use `0.75` as default threshold. Tested empirically. Also allow the LLM to re-classify when the vector match seems wrong.

### 3. Stale Embeddings
**Problem**: If a debate group's description changes, the embedding in Pinecone is outdated.  
**Our solution**: When we regenerate a group's name (using `regenerateGroupName`), we also update the Pinecone embedding.

---

## 🧩 Types of RAG

**Naive RAG**: Simple retrieve → generate (what we described above)

**Advanced RAG**:
- **Query rewriting**: Improve the query before searching
- **Re-ranking**: After retrieval, re-rank results for better context
- **Hypothetical Document Embeddings (HyDE)**: Generate a hypothetical answer, use THAT as the search query
- **Self-RAG**: LLM decides when to retrieve (vs answer from memory)

**Modular RAG**: Mix and match components — different retrievers for different needs

**In our project**: We use Naive RAG but with smart threshold logic — close to Self-RAG because the system decides whether to retrieve (vector search) or generate (LLM call) based on confidence.

---

## 🔑 RAG Key Terms

| Term | Meaning |
|------|---------|
| **Retriever** | The component that fetches relevant documents (Pinecone in our case) |
| **Generator** | The LLM that generates the final response (Gemini in our case) |
| **Knowledge Base** | The database of documents/embeddings (our Pinecone indices) |
| **Chunk** | A piece of a document — you split large docs into chunks before embedding |
| **Re-ranking** | After retrieval, use a model to re-rank results by relevance |
| **Grounding** | Making LLM responses based on real retrieved data (reduces hallucination) |
| **Query embedding** | Converting the user's query to a vector for search |
| **Top-K** | Retrieve top K most similar documents |
| **Similarity threshold** | Min score to consider a match valid |

---

## 🎤 Interview One-liners

**"What is RAG?"**
> "RAG combines retrieval and generation. Instead of relying solely on the LLM's training knowledge, we first fetch relevant documents from a database, then provide those as context to the LLM for generation. This makes responses more accurate, current, and grounded."

**"Why did you use RAG in your project?"**
> "Our debate groups are created dynamically. When a new comment arrives, we need to decide which existing group it belongs to. We could call Gemini every time — but that's slow and expensive. Instead, we convert the comment to an embedding, search Pinecone for similar existing groups, and only call Gemini when there's no good match. For 70%+ of comments, we skip the LLM call entirely."

**"What's the difference between RAG and fine-tuning?"**
> "Fine-tuning bakes knowledge INTO the model. RAG keeps knowledge OUTSIDE the model in a database. RAG is better when data changes frequently, fine-tuning is better when you need a specific tone or format. For our project, user debates change every day, so RAG was the obvious choice."

---

*Next: [04-VECTOR-DATABASE.md](./04-VECTOR-DATABASE.md)*

# 09 — Interview Q&A Master Sheet
> 70+ Questions with answers AND counter-questions the interviewer might ask

---

> **Format**: Each question has:
> - ✅ Your Answer
> - 🔄 Counter-Questions (what they'll ask NEXT)
> - 💡 Project Link (connect it to VoxVeritas)

---

## 🔵 SECTION 1: GenAI & LLM Basics

---

### Q1: What is Generative AI?

**✅ Answer**:
Generative AI is AI that creates new content — text, images, code, audio — rather than just classifying or predicting. It's powered by large models trained on massive datasets. Examples: ChatGPT (text), DALL-E (images), GitHub Copilot (code).

**🔄 Counter-Questions**:
- *"How is it different from traditional AI/ML?"*  
  > Traditional ML classifies existing data (spam or not). GenAI creates new data (writes an email). Traditional ML is discriminative, GenAI is generative.
- *"What are limitations of GenAI?"*  
  > Hallucination, bias from training data, no real-time knowledge (unless RAG), high compute cost, non-deterministic outputs.

**💡 Project Link**: "In our project, we use Gemini (a GenAI model) to generate debate group titles, descriptions, and counter-argument suggestions — all new content created based on user comments."

---

### Q2: What is an LLM?

**✅ Answer**:
LLM stands for Large Language Model — an AI model with billions of parameters, pre-trained on internet-scale text data. It learns statistical patterns in language and can generate coherent, contextually relevant text. Examples: GPT-4, Gemini, Claude, Llama.

**🔄 Counter-Questions**:
- *"How does it actually work?"*  
  > It's a Transformer model that predicts the next token in a sequence. During inference, it generates text one token at a time.
- *"What's the difference between a small and large model?"*  
  > More parameters = more capacity to learn, better at complex reasoning. But larger = more compute, cost, and latency. Small models (Gemini Flash) trade some accuracy for speed and cost.

---

### Q3: What are tokens and why do they matter?

**✅ Answer**:
Tokens are the chunks of text an LLM processes — roughly 3/4 of a word. "Hello world" = 2 tokens. They matter because: (1) APIs charge per token, (2) context windows have token limits, (3) more tokens = slower inference.

**🔄 Counter-Questions**:
- *"What is a context window?"*  
  > The maximum number of tokens an LLM can process at once. Gemini 2.5 Flash has 1M token context. If conversation exceeds this, early parts get dropped.
- *"How did you optimize token usage?"*  
  > We keep prompts concise — only send the comment + group labels, not full debate history. We use vector search to skip LLM calls when similarity is high, saving tokens entirely.

---

### Q4: What is hallucination in LLMs?

**✅ Answer**:
Hallucination is when an LLM confidently generates factually incorrect or completely fabricated information. It happens because LLMs predict likely next tokens based on patterns — they don't "know" facts, they pattern-match. When uncertain, they still generate confident-sounding text.

**🔄 Counter-Questions**:
- *"How do you prevent hallucination?"*  
  > (1) RAG: ground the LLM with real retrieved data, (2) Function calling: force structured output instead of free text, (3) Lower temperature, (4) Human verification for critical outputs.
- *"Did hallucination affect your project?"*  
  > We mitigated it through function calling — Gemini can't hallucinate random text, it must fill typed fields. We also use vector search as ground truth — if Pinecone says "this matches with 0.87 similarity," we trust that over LLM classification.

---

### Q5: What is temperature in LLMs?

**✅ Answer**:
Temperature controls randomness. Temperature 0 = deterministic, same output every time. Temperature 1 = creative, varied outputs. We use 0.0 for classification tasks (need consistency) and slightly higher for creative generation.

**🔄 Counter-Questions**:
- *"What is top-p sampling?"*  
  > Top-p (nucleus sampling) considers only the smallest set of tokens whose cumulative probability exceeds p. It's another way to control randomness alongside temperature.
- *"When would you use high temperature?"*  
  > Creative writing, brainstorming diverse options, generating varied counter-arguments. Low temperature for factual Q&A, classification, code generation.

---

## 🟢 SECTION 2: Transformer Architecture

---

### Q6: How does a Transformer work?

**✅ Answer**:
Transformers process entire sequences in parallel using an Attention mechanism. For each token, attention calculates how much to focus on every other token. This captures long-range dependencies that RNNs couldn't. The architecture has encoder (understands input) and decoder (generates output) components.

**🔄 Counter-Questions**:
- *"What was before Transformers?"*  
  > RNNs and LSTMs — they processed sequences word-by-word (sequential), forgot long-range context, and were slow to train. Transformers solved all three problems.
- *"What is self-attention?"*  
  > For each token, self-attention computes a weighted sum of all other tokens in the sequence. The weights represent how "relevant" each other token is. For "it was tired" — "it" attends strongly to "cat" not "mat."

---

### Q7: What's the difference between BERT and GPT?

**✅ Answer**:
BERT is encoder-only — bidirectional, reads full text, best for understanding/classification. GPT is decoder-only — left-to-right, best for text generation. BERT fills in blanks ("I [MASK] coffee"). GPT predicts next word. Gemini is GPT-style (decoder-based).

**🔄 Counter-Questions**:
- *"Why does directionality matter?"*  
  > BERT sees future words while processing current word — better for understanding meaning. GPT only sees past — necessary for generation (can't peek at the answer).
- *"What model architecture does your project use?"*  
  > Gemini 2.5 Flash is a decoder-based model (like GPT family). Our embedding model (text-embedding-004) is encoder-based — it produces a single vector representing full meaning.

---

### Q8: What is Multi-Head Attention?

**✅ Answer**:
Multi-head attention runs multiple attention operations in parallel. Each "head" learns to focus on different aspects of text — one might focus on grammar, another on entity relationships, another on sentiment. Their outputs are concatenated and projected. Multiple perspectives = richer understanding.

**🔄 Counter-Questions**:
- *"Why not just one attention head?"*  
  > Single head can only learn one type of relationship. Multiple heads capture diverse linguistic patterns simultaneously. Like having multiple experts read the same text, each finding different things.

---

## 🔴 SECTION 3: RAG

---

### Q9: What is RAG? Explain it simply.

**✅ Answer**:
RAG = Retrieval Augmented Generation. Instead of relying on LLM's training knowledge alone, you first retrieve relevant documents from a database, then include them as context when calling the LLM. LLM generates an answer grounded in retrieved real data. This reduces hallucination and keeps knowledge current.

**🔄 Counter-Questions**:
- *"RAG vs fine-tuning — when to use which?"*  
  > RAG: data changes frequently, need real-time accuracy, lower cost. Fine-tuning: need specific style/format, stable domain knowledge, willing to invest in training.
- *"What are RAG's weaknesses?"*  
  > Retrieval quality is critical — bad retrieval = bad generation. More latency than direct LLM call (extra search step). Context window can fill up with retrieved docs.
- *"How did you use RAG?"*  
  > When a comment arrives, we first embed it and search Pinecone for similar debate groups. If similarity > 0.75, we skip the LLM. If we do call Gemini, we pass the top existing groups as context — the LLM has real data, not just its training memory.

---

### Q10: What is the similarity threshold in RAG and how did you choose 0.75?

**✅ Answer**:
The threshold determines when retrieved content is "relevant enough" to use. Below threshold = not a good match. We chose 0.75 empirically — tested multiple values and found 0.75 balanced false positives (wrong group matches) against unnecessary LLM calls. Higher = more LLM calls but fewer wrong matches. Lower = fewer LLM calls but more incorrect groupings.

**🔄 Counter-Questions**:
- *"How did you evaluate which threshold is correct?"*  
  > We manually tested with sample comments and checked if the matched groups were semantically appropriate. 0.75 gave us ~70%+ hit rate while keeping erroneous matches below 5%.

---

## 🟡 SECTION 4: Vector Databases

---

### Q11: What is a vector database?

**✅ Answer**:
A vector database stores data as high-dimensional numerical vectors (embeddings) and enables similarity search — finding vectors closest to a query vector. Unlike SQL databases that do exact matching, vector DBs understand semantic meaning. We use Pinecone to store debate group embeddings.

**🔄 Counter-Questions**:
- *"What is cosine similarity?"*  
  > Cosine similarity measures the angle between two vectors — score from -1 to 1. Score near 1 = similar meaning, near 0 = unrelated, near -1 = opposite meaning. It's scale-invariant, making it ideal for text embeddings.
- *"Why Pinecone over building your own?"*  
  > Managed service — no infrastructure. Optimized ANN search (HNSW algorithm) out of the box. Handles scaling automatically. Building equivalent would take months and require implementing HNSW from scratch.
- *"What is ANN?"*  
  > Approximate Nearest Neighbor — algorithm that finds similar vectors quickly by trading tiny accuracy loss for massive speed gain. Instead of checking every vector (O(n)), ANN uses smart indexing to search in O(log n).

---

### Q12: What are embeddings?

**✅ Answer**:
Embeddings are numerical vector representations of text that capture semantic meaning. Created by embedding models (like Google's text-embedding-004). Similar texts get similar vectors. We use embeddings to convert debate comments and group descriptions into vectors, then compare them using cosine similarity.

**🔄 Counter-Questions**:
- *"How many dimensions are your embeddings?"*  
  > text-embedding-004 produces 768-dimensional vectors — a list of 768 floating-point numbers.
- *"Can you embed images and text together?"*  
  > Yes — multimodal embedding models (like CLIP) can embed both images and text in the same vector space. Not used in our project but important for visual search.

---

## 🟠 SECTION 5: AI Agents & Agentic AI

---

### Q13: What is an AI Agent?

**✅ Answer**:
An AI Agent is an LLM enhanced with tools and the ability to take actions autonomously. Instead of answering one question, it can plan multi-step tasks, call tools (web search, code execution, APIs), observe results, and adapt its plan. It loops through Think → Act → Observe until the goal is achieved.

**🔄 Counter-Questions**:
- *"What is the ReAct pattern?"*  
  > ReAct = Reasoning + Acting. The agent explicitly states its thought before each action and observes results after. This chain: THOUGHT → ACTION → OBSERVATION → THOUGHT... helps the LLM reason more accurately.
- *"What tools can an agent use?"*  
  > Web search, code execution, database queries, API calls, file I/O, email, browser automation. Tools are functions the LLM can call.

---

### Q14: What is Agentic AI vs AI Agent?

**✅ Answer**:
An AI Agent is a single LLM + tools setup. Agentic AI refers to the broader concept of autonomous AI systems, which may include multi-agent architectures where multiple specialized agents coordinate to complete complex goals. Agentic AI implies higher degrees of autonomy, planning, and long-horizon task completion.

**🔄 Counter-Questions**:
- *"What is a multi-agent system?"*  
  > Multiple specialized agents coordinated by an orchestrator. E.g., Researcher Agent + Writer Agent + Editor Agent, each doing their specialized task, with an orchestrator routing work between them.
- *"What are challenges with agentic AI?"*  
  > Reliability (agents can get stuck in loops), cost (many LLM calls), safety (autonomous actions can cause real-world harm), debugging (hard to trace failures in long chains).

---

### Q15: What is function calling?

**✅ Answer**:
Function calling lets you define a JSON schema (function name, parameters, types) and give it to the LLM as a "tool." Instead of free text, the LLM returns structured JSON matching your schema. It's the mechanism behind tool use in agents — and it prevents hallucinated output formats.

**🔄 Counter-Questions**:
- *"How did you use function calling?"*  
  > All our Gemini calls use function calling. We define functions like `classify_and_generate` with typed fields (matchedGroup: STRING, newLabel: STRING, idealCounter1: STRING). Gemini fills these fields instead of generating free text, giving us reliable JSON we can directly use.
- *"What's the alternative to function calling?"*  
  > Ask the LLM to "return JSON" in the prompt. Problem: it might add extra text, format inconsistently, or make up field names. Function calling enforces the schema strictly.

---

## 🔵 SECTION 6: AI Orchestration

---

### Q16: What is AI Orchestration?

**✅ Answer**:
AI Orchestration is coordinating multiple AI models, databases, and tools to complete complex tasks. It involves routing, chaining, fallbacks, rate limiting, and state management across AI services. Like a conductor managing an orchestra — each component plays its role, orchestration ensures they work together.

**🔄 Counter-Questions**:
- *"What frameworks exist for AI orchestration?"*  
  > LangChain (chains + agents), LangGraph (stateful graph workflows), CrewAI (multi-agent teams), AutoGen (agent-to-agent), OpenAI Assistants API.
- *"How did you orchestrate AI in your project?"*  
  > Our pipeline: off-topic detection → embed → Pinecone search → threshold route → LLM (if needed) → group creation → counter search. We also built custom API key rotation to orchestrate across 3 Gemini keys for rate limit management.

---

### Q17: How does your API key rotation work?

**✅ Answer**:
We have 3 Gemini API keys. Each time an LLM call is made, we use `geminiKeyRotation.getApiKey()` which returns the next key in round-robin order (Key1 → Key2 → Key3 → Key1...). This distributes requests across 3 keys, effectively tripling our rate limit. If one key is exhausted, subsequent calls use a different key automatically.

**🔄 Counter-Questions**:
- *"Isn't this against Google's ToS?"*  
  > We use 3 keys registered under the same project for development purposes. This is a common pattern for high-throughput applications. Production systems use proper paid plans with higher rate limits.
- *"What happens if all 3 keys hit the limit?"*  
  > Our code has try-catch with keyword-based fallback classification. Core functionality degrades gracefully rather than failing completely.

---

## 🟣 SECTION 7: Prompt Engineering

---

### Q18: What is prompt engineering?

**✅ Answer**:
Prompt engineering is designing inputs to LLMs to reliably get high-quality outputs. Techniques include zero-shot (just ask), few-shot (give examples), chain-of-thought (make model reason step by step), and function calling (force structured JSON). Good prompts dramatically improve output quality without changing the model.

**🔄 Counter-Questions**:
- *"Give an example of a bad vs good prompt"*  
  > Bad: "Classify this comment." Good: "Classify this comment into one of these categories: [list]. Rules: Match ONLY if the core argument is substantially the same. If no match, return empty string for matchedGroup. Return JSON with fields: matchedGroup (STRING), newLabel (STRING), confidence (FLOAT)."
- *"What is chain-of-thought prompting?"*  
  > Adding "think step by step" makes the model reason before answering. Dramatically improves accuracy on multi-step problems because the model can't jump to conclusions.

---

### Q19: What is zero-shot vs few-shot?

**✅ Answer**:
Zero-shot: Ask the LLM to perform a task with no examples — relies on its training. Few-shot: Provide 2-5 input-output examples before the actual request — shows the model what you want. Few-shot is better when zero-shot gives inconsistent or wrong format outputs.

**🔄 Counter-Questions**:
- *"How many examples is optimal for few-shot?"*  
  > Typically 3-5. More examples = better guidance but more tokens. For format guidance, 2-3 well-chosen contrasting examples (good vs bad) are often sufficient.

---

## 🟤 SECTION 8: Fine-Tuning

---

### Q20: What is fine-tuning and when would you use it?

**✅ Answer**:
Fine-tuning further trains a pre-trained LLM on your specific dataset to adapt its behavior. Use it when: (1) you need very domain-specific knowledge baked in, (2) you need a specific consistent output style, (3) you have thousands of labeled examples. Avoid when data changes frequently (use RAG instead) or cost is a constraint.

**🔄 Counter-Questions**:
- *"What is LoRA?"*  
  > Low-Rank Adaptation — efficient fine-tuning that adds small trainable matrices alongside frozen model weights. 10-100x fewer parameters to train, enabling fine-tuning on consumer GPUs.
- *"What is RLHF?"*  
  > Reinforcement Learning from Human Feedback. Humans rate AI outputs, a reward model learns human preferences, RL optimizes the LLM to maximize reward. How ChatGPT was made helpful and safe.

---

## 🔵 SECTION 9: System Design & Production

---

### Q21: How would you make an LLM system scalable?

**✅ Answer**:
(1) Caching: Cache LLM responses for identical inputs. (2) Vector search first: Skip LLM when high-confidence vector match exists. (3) Rate limiting: Queue requests, rotate API keys. (4) Async processing: Process comments asynchronously, don't block user. (5) Choose smaller/faster models: Gemini Flash > Gemini Pro for throughput. (6) Batch requests: Group similar inputs.

**🔄 Counter-Questions**:
- *"What would you do if LLM latency was too high?"*  
  > (1) Switch to smaller model, (2) Use streaming responses, (3) Offload processing to background job queue (Bull/Redis), (4) Increase vector search threshold to skip LLM calls, (5) Cache common outputs.

---

### Q22: What are the costs involved in running an AI system like yours?

**✅ Answer**:
(1) LLM API costs: Gemini charges per input/output token. We minimize calls with vector search. (2) Vector DB costs: Pinecone charges by vectors stored + queries. (3) Embedding costs: text-embedding-004 is cheap (~$0.0001 per 1000 tokens). (4) Compute: Node.js server on cloud. Most expensive: LLM calls (~$0.002-0.01 per call).

**🔄 Counter-Questions**:
- *"How would you reduce costs at scale?"*  
  > (1) Higher vector similarity threshold = fewer LLM calls, (2) Batch embedding requests, (3) Cache common comment patterns, (4) Use smaller/cheaper embedding models, (5) Fine-tune a smaller model for our specific task.

---

### Q23: How do you handle LLM failures in production?

**✅ Answer**:
Our approach: (1) Try-catch around every LLM call, (2) Keyword-based fallback classification when Gemini fails, (3) API key rotation to handle rate limits, (4) Default safe values (e.g., `isOffTopic: false`) when analysis fails, (5) Logging every failure for monitoring.

---

## 💬 SECTION 10: Rapid Fire One-Liners

| Question | Answer |
|----------|--------|
| What is GPT? | Generative Pre-trained Transformer — OpenAI's decoder-only model |
| What is BERT? | Bidirectional Encoder Representations from Transformers — Google's encoder-only model |
| What is the "attention is all you need" paper? | 2017 Google paper that introduced the Transformer architecture |
| What is a token? | Chunk of text (~3/4 word) that LLMs process |
| What is temperature 0? | Deterministic output — same answer every time |
| What is RAG? | Retrieve real docs first, then augment LLM prompt with them |
| What is a vector? | List of numbers representing semantic meaning of text |
| What is cosine similarity? | Measure of angle between two vectors — 1 = identical meaning |
| What is Pinecone? | Managed cloud vector database for semantic search |
| What is an embedding? | Text → vector conversion using an embedding model |
| What is hallucination? | LLM generating confident but factually false content |
| What is function calling? | LLM returns typed JSON schema instead of free text |
| What is fine-tuning? | Further training pre-trained LLM on specific dataset |
| What is LoRA? | Low-Rank Adaptation — efficient fine-tuning with few parameters |
| What is RLHF? | Training with human preference ratings via RL |
| What is an AI Agent? | LLM + tools + memory + ability to take autonomous actions |
| What is ReAct? | Reasoning + Acting — think-act-observe loop for agents |
| What is LangChain? | Python/JS framework for building LLM pipelines and agents |
| What is context window? | Max tokens LLM can process at once |
| What is zero-shot? | Asking LLM to do task with no examples |
| What is few-shot? | Giving 2-5 examples before actual request |
| What is chain-of-thought? | Prompting model to reason step by step |
| What is quantization? | Reducing model weight precision to save memory |
| What is distillation? | Training small model to mimic large model behavior |
| What is Gemini? | Google DeepMind's LLM — we use Gemini 2.5 Flash |
| What is semantic search? | Search by meaning not keywords |

---

*Next: [10-PROJECT-AI-DEEP-DIVE.md](./10-PROJECT-AI-DEEP-DIVE.md)*

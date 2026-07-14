# 01 — GenAI Basics: Core Concepts & Terms
> Simple explanations + examples from our VoxVeritas project

---

## 🧠 What is Generative AI (GenAI)?

**Simple definition**: AI that can **create** new content — text, images, code, audio — that didn't exist before.

**Think of it like this**: Traditional AI classifies things ("Is this email spam? Yes/No"). GenAI *creates* things ("Write me a marketing email").

**Examples in real life**:
- ChatGPT → generates text
- DALL-E → generates images
- GitHub Copilot → generates code
- Our project's Gemini → generates counter-arguments, group titles, and descriptions

---

## 📚 What is an LLM (Large Language Model)?

**Simple definition**: A very large AI model trained on billions of words from the internet. It learns patterns in language and can predict what word comes next.

**The "large" means**:
- Billions of parameters (like brain connections)
- Trained on huge datasets (books, Wikipedia, web pages)
- Takes weeks/months of training on hundreds of GPUs

**Popular LLMs**:
| Model | Company | Notes |
|-------|---------|-------|
| GPT-4, GPT-4o | OpenAI | Most popular |
| Gemini 2.5 Flash | Google DeepMind | **Used in our project** |
| Claude 3.5 | Anthropic | Known for safety |
| Llama 3 | Meta | Open source, free |
| Mistral | Mistral AI | Efficient, European |

**In our project**: We use **Google Gemini 2.5 Flash** — chosen for speed, cost efficiency, and function calling support.

---

## 🪙 What are Tokens?

**Simple definition**: Tokens are the chunks that an LLM processes. NOT exactly words — more like word pieces.

**Examples**:
- "Hello" = 1 token
- "unhappy" = 1 token  
- "antidisestablishmentarianism" = 5-6 tokens
- " " (space) counts too
- A page of text ≈ 500-750 tokens

**Why tokens matter**:
1. **Cost** — APIs charge per token (input + output)
2. **Context window** — LLMs can only handle a limited number of tokens at once
3. **Speed** — More tokens = slower response

**In our project**: We keep prompts tight. When classifying a comment, we don't send the entire debate history — just the comment + group labels. This saves tokens and money.

---

## 🌡️ What is Temperature?

**Simple definition**: Temperature controls how **creative/random** vs **predictable/focused** the AI's response is.

| Temperature | Behavior | Use Case |
|------------|---------|----------|
| 0.0 | Very predictable, same answer every time | Classification, yes/no decisions |
| 0.3-0.5 | Slightly creative | Summarization, Q&A |
| 0.7-0.9 | Creative, varied | Creative writing, brainstorming |
| 1.0+ | Very random, may go off-track | Experimental use only |

**Real analogy**: Think of an employee giving you a report.
- Temperature 0 = Very formal, follows template exactly
- Temperature 1 = Creative, might take unexpected angles

**In our project**: We use `temperature: 0.0` for:
- Off-topic detection (we need consistent yes/no)
- Group content generation (we need factual summaries)

---

## 💬 What is a Prompt?

**Simple definition**: The text/instructions you send to an LLM. Your "question" or "command".

**Types of prompts**:
- **System prompt**: Sets the LLM's role/personality ("You are a helpful assistant...")
- **User prompt**: The actual question or task
- **Assistant prompt**: Previous AI response (for multi-turn conversations)

**Good prompt = Better output**. This is called **Prompt Engineering** (covered in 07-PROMPT-ENGINEERING.md).

**In our project**: Our prompts include:
1. The new comment to analyze
2. Existing debate group labels  
3. Strict rules about how to format output
4. Examples of good vs bad responses

---

## 🌫️ What is Hallucination?

**Simple definition**: When an LLM confidently makes up information that is **completely false**.

**Example**: Ask an LLM "Who invented the telephone?" It says "Alexander Graham Bell" ✅. But ask it "What did Professor John Smith write in his 1987 paper?" — it might make up a fake paper title with fake quotes. That's hallucination.

**Why it happens**: LLMs are trained to predict the next likely word. They don't "know" facts — they pattern-match. When uncertain, they still generate confident-sounding text.

**How we handle it in our project**:
- We use **Function Calling** — forces Gemini to return structured JSON, not free text. This reduces hallucination.
- We use **vector search first** — retrieve real data before asking LLM. This gives it grounded context.
- For critical decisions (e.g., is a comment off-topic?), we also have a **keyword fallback** in case LLM fails.

---

## 🎯 What is Context Window?

**Simple definition**: How much text the LLM can "see" and process at once. Like short-term memory.

| Model | Context Window |
|-------|---------------|
| GPT-3.5 | 4K tokens |
| GPT-4 | 8K-128K tokens |
| Gemini 2.5 Flash | 1M tokens |
| Claude 3.5 | 200K tokens |

**Why it matters**: If your conversation is longer than the context window, early messages get "forgotten."

**In our project**: Gemini 2.5 Flash's 1M token context is massive. But we still keep prompts lean because:
1. Each token costs money
2. Shorter prompts = faster responses
3. Too much context can confuse the model ("lost in the middle" problem)

---

## 🔢 What are Embeddings?

**Simple definition**: A way to convert text into a list of numbers (a vector) that **captures meaning**. Similar texts get similar numbers.

**Real-world analogy**: 
- "dog" → [0.2, 0.8, 0.1, ...]
- "puppy" → [0.21, 0.79, 0.12, ...] (very similar!)
- "car" → [0.9, 0.1, 0.5, ...] (very different)

**Key insight**: By comparing these number arrays, we can measure how similar two pieces of text are — without needing the LLM.

**In our project**: We use **Gemini's text-embedding-004** model to convert:
- Debate comment text → embedding vector
- Debate group descriptions → embedding vector
- Ideal counter-arguments → embedding vectors
Then we store these in **Pinecone** for fast similarity search.

---

## 🔍 What is Semantic Search?

**Simple definition**: Search that understands **meaning**, not just keywords.

**Keyword search**: "Find documents containing 'dog'" → returns only docs with the word "dog"  
**Semantic search**: "Find documents about dogs" → returns docs about dogs, puppies, canines, pets even if they don't use the word "dog"

**In our project**: When a user posts a comment like "This AI will destroy journalism jobs", we:
1. Convert this comment to an embedding vector
2. Search Pinecone for the most similar existing debate group
3. If similarity > 0.75, assign to that group without calling Gemini
4. This is semantic search — we're finding similar *meaning*, not matching exact words

---

## 📊 What is a Model Parameter?

**Simple definition**: The numbers inside a neural network that were learned during training. More parameters = more capacity to learn.

**Scale**:
- GPT-2: 1.5 billion parameters
- GPT-3: 175 billion parameters
- GPT-4: ~1 trillion parameters (estimated)

**Note**: Bigger ≠ always better. Gemini Flash is a smaller, faster model optimized for speed and cost — perfect for production use like our project.

---

## ⚡ Key Terms Cheat Sheet

| Term | One-liner |
|------|-----------|
| LLM | Large AI model trained on text, can generate text |
| Token | Chunk of text (≈ 3/4 of a word), unit of measurement |
| Temperature | Controls randomness (0=focused, 1=creative) |
| Prompt | Input/instructions sent to LLM |
| Context Window | Max text LLM can process at once |
| Hallucination | LLM confidently makes up false information |
| Embedding | Text converted to numbers that capture meaning |
| Semantic Search | Search by meaning, not keywords |
| Parameters | The "learned weights" inside a model |
| Inference | Running the model to get output (not training) |
| Fine-tuning | Further training a pre-trained model on custom data |
| RAG | Retrieval + generation — give LLM real data first |
| Vector DB | Database optimized for storing and searching embeddings |
| Function Calling | Make LLM return structured JSON output |

---

*Next: [02-TRANSFORMER-ARCHITECTURE.md](./02-TRANSFORMER-ARCHITECTURE.md)*

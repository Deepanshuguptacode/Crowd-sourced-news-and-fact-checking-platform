# 🤖 GenAI Interview Preparation Notes
> **Project Reference**: VoxVeritas — Crowd-Sourced News & Fact-Checking Platform  
> **Folder Purpose**: Deep-dive GenAI/LLM interview notes — Concepts, terms, and real project examples  
> **Style**: Simple language + real examples from YOUR project

---

## 📁 Files in This Folder

| File | What You'll Learn |
|------|------------------|
| [01-GENAI-BASICS.md](./01-GENAI-BASICS.md) | What is GenAI, LLM, tokens, prompts, temperature, hallucination |
| [02-TRANSFORMER-ARCHITECTURE.md](./02-TRANSFORMER-ARCHITECTURE.md) | How Transformers work, attention, encoder-decoder, BERT vs GPT |
| [03-RAG-RETRIEVAL-AUGMENTED-GENERATION.md](./03-RAG-RETRIEVAL-AUGMENTED-GENERATION.md) | What is RAG, why it matters, how we used it in our project |
| [04-VECTOR-DATABASE.md](./04-VECTOR-DATABASE.md) | Embeddings, vector search, Pinecone, cosine similarity |
| [05-AI-AGENTS-AND-AGENTIC-AI.md](./05-AI-AGENTS-AND-AGENTIC-AI.md) | AI Agents, Agentic AI, ReAct, planning, tool use |
| [06-AI-ORCHESTRATION.md](./06-AI-ORCHESTRATION.md) | Orchestration, multi-agent systems, LangChain, pipelines |
| [07-PROMPT-ENGINEERING.md](./07-PROMPT-ENGINEERING.md) | Zero-shot, few-shot, chain-of-thought, function calling |
| [08-FINE-TUNING-AND-TRAINING.md](./08-FINE-TUNING-AND-TRAINING.md) | Fine-tuning, RLHF, LoRA, PEFT, when to use what |
| [09-INTERVIEW-QA-MASTER.md](./09-INTERVIEW-QA-MASTER.md) | 60+ Interview Q&A with counter questions |
| [10-PROJECT-AI-DEEP-DIVE.md](./10-PROJECT-AI-DEEP-DIVE.md) | How GenAI concepts map to YOUR VoxVeritas project |

---

## 🎯 How to Use These Notes

### If you have **30 minutes**:
1. `01-GENAI-BASICS.md` — Core terms you must know
2. `09-INTERVIEW-QA-MASTER.md` — Scan common Q&As
3. `10-PROJECT-AI-DEEP-DIVE.md` — Know YOUR project's AI stack cold

### If you have **2 hours**:
1. All above files
2. `03-RAG-RETRIEVAL-AUGMENTED-GENERATION.md` — Most asked topic
3. `04-VECTOR-DATABASE.md` — Pinecone is your differentiator
4. `05-AI-AGENTS-AND-AGENTIC-AI.md` — Very hot topic in 2025

### If you have **full day**:
- Read everything in order
- Practice explaining concepts **out loud** in simple terms
- For every concept, say: *"In our project, we used this when..."*

---

## 🔑 Your GenAI Differentiators (Mention These!)

1. **Gemini LLM Integration** — Used Google Gemini 2.5 Flash for comment classification, group generation, counter-argument synthesis
2. **Pinecone Vector DB** — Stored embeddings of debate groups and ideal counter-arguments for semantic search
3. **RAG-style Pipeline** — Used vector similarity search to find matching debate groups before falling back to LLM
4. **Function Calling** — Used Gemini's structured function calling (not raw text) to get reliable JSON outputs
5. **Multi-key API Rotation** — Custom rate-limit management across 3 Gemini API keys
6. **Semantic Similarity** — Cosine similarity via Pinecone to match new comments to existing debate groups
7. **AI Pipeline Design** — Built a full pipeline: comment → embed → vector search → LLM classify → group → store

---

## 💡 Golden Rule for Interviews

> **Never just define a term. Always connect it to your project.**
>
> ❌ "RAG stands for Retrieval Augmented Generation. It retrieves documents and feeds them to an LLM."  
> ✅ "RAG means you first retrieve relevant data, then give it to the LLM. In our project, when a user posts a comment in a debate, we don't send all debate history to Gemini — that would be expensive and slow. Instead, we first search Pinecone for the most similar existing debate group, then only pass that context to Gemini. That's RAG in action."

---

*Last updated: July 2026 | VoxVeritas Project*

# 06 — AI Orchestration
> Coordinating multiple AI components — the "conductor" of the AI symphony

---

## 🎼 What is AI Orchestration?

**Simple definition**: AI Orchestration is the process of **coordinating and managing multiple AI components, models, and tools** to accomplish complex goals. It's like a conductor managing an orchestra — each instrument (AI component) plays its part, and the conductor ensures they work together harmoniously.

**Without orchestration**: You call one LLM, get one response. Simple but limited.

**With orchestration**: You have multiple models, databases, APIs working in sequence or parallel — each doing what it's best at.

---

## 🏗️ What Does an AI Orchestration System Do?

1. **Routes requests** to the right AI model or service
2. **Chains outputs** — output of one component becomes input of the next
3. **Manages retries** — if one step fails, retry or use fallback
4. **Handles state** — remembers what happened in previous steps
5. **Parallelizes** work — run multiple AI calls simultaneously when possible
6. **Monitors** — tracks performance, costs, errors

---

## 🔄 AI Orchestration in Our VoxVeritas Project

Our project has a well-defined AI orchestration pipeline, even though we didn't use a framework like LangChain. Let's trace it:

```
Comment Posted by User
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│               ORCHESTRATION PIPELINE                     │
│                                                         │
│  Step 1: OFF-TOPIC DETECTION                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Vector Search: Is comment similar to debate?    │  │
│  │  If no → LLM (Gemini): Analyze relevance         │  │
│  │  If off-topic → REJECT ❌                        │  │
│  └──────────────────────────────────────────────────┘  │
│                    │ (if relevant)                       │
│                    ▼                                     │
│  Step 2: EMBEDDING                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Embedding Model: comment text → vector          │  │
│  └──────────────────────────────────────────────────┘  │
│                    │                                     │
│                    ▼                                     │
│  Step 3: VECTOR SEARCH                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pinecone: Find similar existing groups          │  │
│  │  Also: Find similar counter-arguments            │  │
│  └──────────────────────────────────────────────────┘  │
│                    │                                     │
│         ┌──────────┴──────────────┐                     │
│         ▼                         ▼                     │
│  [High Similarity > 0.75]  [Low Similarity < 0.75]     │
│  ┌─────────────────┐        ┌────────────────────┐     │
│  │ MATCH EXISTING  │        │   LLM CLASSIFY     │     │
│  │ GROUP (no LLM!) │        │   (Gemini Flash)   │     │
│  └────────┬────────┘        └─────────┬──────────┘     │
│           │                           │                  │
│           └─────────────┬─────────────┘                 │
│                         ▼                                │
│  Step 4: GROUP CREATION (if new)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  LLM: Generate title + description + counters    │  │
│  │  Embed new group description                     │  │
│  │  Store in MongoDB + Pinecone                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 5: COUNTER MATCHING                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pinecone: Search counters index                 │  │
│  │  Find opposing group for this comment            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
  Comment stored in correct group + opposing group identified
```

**This is an orchestrated pipeline** — multiple AI services coordinated in sequence with conditional routing.

---

## 🛠️ Popular AI Orchestration Frameworks

### 1. LangChain
**What it is**: Python/JS library for building LLM applications.  
**Key features**:
- **Chains**: Connect LLM calls sequentially
- **Agents**: LLM + tools
- **Memory**: Manage conversation history
- **Vector stores**: Integrations with Pinecone, Chroma, etc.
- **Document loaders**: Load PDFs, websites, etc.

**Simple LangChain example**:
```python
from langchain import LLMChain, PromptTemplate
from langchain.llms import ChatGoogleGenerativeAI

# Define a chain
template = "Classify this comment: {comment}. Groups: {groups}"
prompt = PromptTemplate(input_variables=["comment", "groups"], template=template)
chain = LLMChain(llm=ChatGoogleGenerativeAI(model="gemini-flash"), prompt=prompt)

# Run the chain
result = chain.run(comment="AI will replace jobs", groups=["Economic Impact", "Tech Progress"])
```

### 2. LangGraph
**What it is**: Extension of LangChain for building stateful, graph-based AI workflows.  
**Best for**: Complex multi-step agentic workflows with cycles and conditional logic.

```python
# LangGraph defines workflows as a graph:
workflow = StateGraph()
workflow.add_node("classify", classify_node)
workflow.add_node("embed", embed_node)  
workflow.add_node("search", search_node)
workflow.add_edge("classify", "embed")
workflow.add_conditional_edges("search", route_by_similarity)
```

### 3. CrewAI
**What it is**: Framework for building multi-agent "crews" where agents collaborate.  
**Best for**: When you have specialized agents (researcher, writer, coder) working together.

```python
# CrewAI example:
researcher = Agent(role="Researcher", goal="Find latest AI news", tools=[search_tool])
writer = Agent(role="Writer", goal="Write article from research", tools=[])
editor = Agent(role="Editor", goal="Review and polish article", tools=[])

crew = Crew(agents=[researcher, writer, editor], tasks=[...])
result = crew.kickoff()
```

### 4. AutoGen (Microsoft)
**What it is**: Multi-agent framework where agents can talk to each other.  
**Best for**: Agents that need to converse and negotiate.

### 5. OpenAI Assistants API
**What it is**: OpenAI's built-in agentic system with persistent threads, code interpreter, file search.

### Comparison Table

| Framework | Best For | Language | Complexity |
|-----------|---------|----------|-----------|
| LangChain | General LLM chains | Python/JS | Medium |
| LangGraph | Complex workflows | Python | High |
| CrewAI | Multi-agent teams | Python | Medium |
| AutoGen | Agent-to-agent | Python | High |
| Assistants API | Quick prototypes | API | Low |

---

## 🔗 Orchestration Patterns

### 1. Sequential Chain
Output of each step becomes input of the next.

```
Text → Translate → Summarize → Classify → Store
```

**In our project**: Comment → Embed → Search → Classify → Store

### 2. Parallel Chain
Multiple operations run simultaneously, results combined.

```
            ┌─ Search main index ─┐
Comment →  ─┤                      ├─ Combine → Route
            └─ Search counter idx ─┘
```

**In our project**: We search both Pinecone indices simultaneously.

### 3. Conditional Routing (Router Pattern)
Different paths based on conditions.

```
Query → Router → Simple Query → LLM A
                  Complex Query → LLM B (more powerful)
                  Image Query → Vision Model
```

**In our project**: 
- Similarity > 0.75 → Direct assignment (no LLM)
- Similarity < 0.75 → LLM classification

### 4. Fallback Chain
Try the best option first, fall back on failure.

```
Request → Primary LLM → (if fails) → Backup LLM → (if fails) → Keyword Fallback
```

**In our project**:
```javascript
try {
  return await this._classifyWithGemini(comment, labels);
} catch (err) {
  return this._keywordClassify(comment, labels); // Fallback
}
```

### 5. Map-Reduce Pattern
Break large task into parallel subtasks, combine results.

```
Large Document → [chunk1, chunk2, chunk3, chunk4]
                       ↓
                [summarize each chunk in parallel]
                       ↓
              Combine all summaries → Final summary
```

---

## 🔑 Orchestration Concepts

| Term | Meaning |
|------|---------|
| **Pipeline** | Sequence of processing steps |
| **Chain** | Series of connected LLM calls |
| **Router** | Component that directs inputs to different paths |
| **Fallback** | Backup option when primary fails |
| **Retry logic** | Automatically retry failed calls |
| **Rate limiting** | Control API call frequency |
| **Load balancing** | Distribute requests across multiple instances |
| **Circuit breaker** | Stop calling a failing service temporarily |
| **Observability** | Logging, monitoring, tracing of AI calls |
| **Prompt template** | Reusable prompt with variables |

---

## ⚡ API Key Rotation (Our Custom Orchestration Feature!)

**The problem**: Gemini API has rate limits (requests per minute). With many users posting comments, we'd hit the limit quickly.

**Our orchestration solution**: We built a **custom key rotation system** across 3 Gemini API keys:

```javascript
class GeminiKeyRotation {
  constructor() {
    this.keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ];
    this.currentIndex = 0;
  }
  
  getApiKey() {
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
}
```

**How it works**:
- Each LLM call uses `geminiKeyRotation.getApiKey()` 
- Keys rotate in round-robin: Key1 → Key2 → Key3 → Key1...
- If one key hits rate limit, next call uses a different key
- Effectively **3x the throughput** compared to single key

**This IS AI orchestration** — we're orchestrating which API key handles which request, managing rate limits at the infrastructure level.

---

## 🎤 Interview Answers

**"What is AI Orchestration?"**
> "AI Orchestration is coordinating multiple AI models, APIs, and tools to complete complex tasks. Rather than relying on a single LLM call, orchestration manages the flow: routing inputs to appropriate models, chaining outputs, handling failures with fallbacks, and managing rate limits. Think of it as the software layer that manages the 'when, how, and what' of AI service calls."

**"How did you orchestrate AI in your project?"**
> "Our comment processing pipeline is a good example. When a comment arrives, we first run off-topic detection using vector similarity or Gemini. If it passes, we embed it and search two Pinecone indices simultaneously. Based on similarity scores, we route to either direct group assignment or an LLM classification call. If the LLM call fails, we fall back to keyword classification. We also built a custom API key rotation system that round-robins across 3 Gemini keys to triple our effective rate limit. That's orchestration — coordinating multiple services with conditional routing, fallbacks, and rate limit management."

**"Have you used LangChain?"**
> "Not in this project — we built our pipeline directly in Node.js using the Google GenAI SDK and Pinecone SDK. This gave us full control over the flow and made it easier to customize our specific logic. LangChain would be valuable for more complex applications, but for our use case, the overhead wasn't necessary."

---

*Next: [07-PROMPT-ENGINEERING.md](./07-PROMPT-ENGINEERING.md)*

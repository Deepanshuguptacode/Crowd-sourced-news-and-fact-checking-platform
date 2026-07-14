# 05 — AI Agents & Agentic AI
> The hottest topic in GenAI right now (2025) — explained simply

---

## 🤖 What is an AI Agent?

**Simple definition**: An AI agent is a system where an LLM can **take actions** in the world, not just answer questions. It can use tools, search the web, run code, call APIs, and make decisions across multiple steps.

**Non-agent (regular LLM)**: You ask → LLM answers → Done. One shot.

**Agent**: You give a goal → Agent plans steps → Executes step 1 → Observes result → Plans next step → Executes → Repeats until goal achieved.

**Real-world analogy**:
- Regular LLM = A brilliant friend you can call to answer questions
- AI Agent = A brilliant friend you can hire as an employee who actually DOES the work

---

## 🏗️ Core Components of an AI Agent

```
                    ┌──────────────────────────────────────┐
                    │              AI AGENT                 │
                    │                                      │
                    │  ┌─────────────┐  ┌───────────────┐ │
  User Goal   ──►  │  │  BRAIN      │  │  MEMORY       │ │
                    │  │  (LLM)      │  │  - Short term │ │
                    │  │  - Plans    │  │  - Long term  │ │
                    │  │  - Decides  │  │  - Episodic   │ │
                    │  └──────┬──────┘  └───────────────┘ │
                    │         │                            │
                    │         ▼                            │
                    │  ┌─────────────┐  ┌───────────────┐ │
                    │  │  TOOLS      │  │  ACTIONS      │ │
                    │  │  - Web      │  │  - Execute    │ │
                    │  │  - Code     │  │  - Observe    │ │
                    │  │  - APIs     │  │  - Feedback   │ │
                    │  │  - DB       │  └───────────────┘ │
                    │  └─────────────┘                    │
                    └──────────────────────────────────────┘
```

**4 key components**:
1. **Brain (LLM)**: The reasoning engine — GPT-4, Gemini, Claude. Plans and decides.
2. **Memory**: Stores past actions and context
3. **Tools**: Things the agent can use (web search, code executor, APIs, databases)
4. **Actions**: The ability to execute plans and observe results

---

## 🔄 How an AI Agent Works: ReAct Loop

**ReAct** = **Re**asoning + **Act**ing

The agent loops through: **Think → Act → Observe → Think → Act → Observe...**

**Example** — User asks: "Find me today's top AI news and summarize it"

```
THOUGHT 1: "I need to search for today's AI news"
ACTION 1:  web_search("AI news today July 2026")
OBSERVE 1: [Returns list of articles with URLs]

THOUGHT 2: "I should read the top 3 articles"
ACTION 2:  read_url("https://techcrunch.com/ai-article-1")
OBSERVE 2: [Article content]

ACTION 3:  read_url("https://venturebeat.com/ai-article-2")
OBSERVE 3: [Article content]

THOUGHT 3: "I have enough context, now I'll write the summary"
ACTION 4:  generate_summary([article1, article2, article3])
OBSERVE 4: [Summary generated]

FINAL ANSWER: "Here are today's top AI highlights: ..."
```

**This is exactly how I work!** (Antigravity, your AI assistant) — I use a ReAct-style loop to plan, use tools, observe results, and repeat.

---

## 🤖 What is Agentic AI?

**Simple definition**: Agentic AI refers to AI systems that can operate **autonomously** over long periods, completing complex multi-step tasks with minimal human intervention.

**The key difference from a single agent**:
- **AI Agent**: One LLM + tools, handling one goal
- **Agentic AI / Multi-Agent System**: Multiple specialized agents working together, coordinated by an orchestrator

**Degrees of autonomy** (from least to most agentic):
```
Level 0: LLM answers questions (ChatGPT basic)
Level 1: LLM + tools (can search web, run code)
Level 2: Single agent with memory + multi-step planning
Level 3: Multi-agent system with specialized roles
Level 4: Fully autonomous, self-improving AI systems
```

Most production systems today are Level 2-3.

---

## 🏢 Real-World Agentic AI Examples

### Example 1: Cursor / GitHub Copilot Agent Mode
You ask: "Add user authentication to my Express app"
- Agent reads your existing code
- Plans the changes needed
- Writes auth middleware
- Updates routes
- Modifies models
- All without you doing each step

### Example 2: Customer Support Agent
You write: "Cancel my order #12345 and issue refund"
- Agent understands intent
- Calls order management API
- Confirms order exists
- Calls cancellation API
- Triggers refund workflow
- Sends confirmation email
- Logs action in CRM

### Example 3: Research Agent
You ask: "Research the latest trends in quantum computing"
- Searches multiple sources
- Reads 10+ articles
- Extracts key information
- Cross-references claims
- Generates structured report

---

## 🔗 Types of Memory in AI Agents

| Memory Type | What It Is | Example |
|------------|-----------|---------|
| **In-context (short-term)** | Content in the current context window | Current conversation |
| **External (long-term)** | Stored in a database, retrieved when needed | User preferences, past interactions |
| **Episodic** | Records of past task sequences | "Last time I tried X, it failed because Y" |
| **Semantic** | Factual knowledge store | Vector DB with domain knowledge |
| **Procedural** | Stored patterns/skills | Learned workflows |

**In our project**: Our Pinecone database acts as **semantic memory** for the AI system — storing group patterns, embeddings, and counter-argument templates that inform future decisions.

---

## 🛠️ Tools That Agents Can Use

An agent's power comes from its tools:

| Tool Category | Examples | What It Enables |
|--------------|---------|----------------|
| **Web search** | Brave Search, Serper | Access real-time information |
| **Code execution** | Python REPL, JS runtime | Run and test code |
| **File I/O** | Read/write files | Create documents, process data |
| **APIs** | REST, GraphQL | Interact with external services |
| **Database** | SQL, Vector DB | Store and retrieve data |
| **Browsers** | Playwright, Puppeteer | Browse websites |
| **Communication** | Email, Slack, SMS | Send messages |
| **LLM calls** | Sub-agents | Delegate sub-tasks |

---

## 🎯 How Our Project Uses Agent-Like Patterns

**Our LLM pipeline is NOT a full agent** (no autonomous loop), but it uses **agentic patterns**:

### Pattern 1: Tool Calling (Function Calling)
```javascript
// We define "tools" (functions) that Gemini can call:
const fn = {
  name: 'classify_and_generate',
  description: 'Classifies a comment and generates group content',
  parameters: {
    type: Type.OBJECT,
    properties: {
      matchedGroup: { type: Type.STRING, ... },
      newLabel: { type: Type.STRING, ... },
      idealCounter1: { type: Type.STRING, ... },
      ...
    }
  }
};

// Gemini "calls" this function with structured data
// We get back reliable JSON, not hallucinated free text
```

This is Agent-style tool use — the LLM decides what to output via structured function calls.

### Pattern 2: Conditional Planning
```javascript
// Our pipeline "plans" based on conditions:
if (vectorSimilarity > 0.75) {
  // Plan A: Use existing group (no LLM needed)
} else if (llmClassification.shouldCreateNew) {
  // Plan B: Create new group via LLM
} else {
  // Plan C: Match to LLM-suggested existing group
}
```

### Pattern 3: Fallback Chains
```javascript
// Try best option first, fall back gracefully:
try {
  return await this._classifyWithGemini(comment, labels); // AI approach
} catch (err) {
  return this._keywordClassify(comment, labels); // Keyword fallback
}
```

---

## 🌐 Multi-Agent Systems

**Simple definition**: Multiple AI agents working together, each specialized for a task, coordinated by an orchestrator.

```
                    ┌─────────────────┐
    User Request →  │  ORCHESTRATOR   │  (master agent, routes tasks)
                    └────────┬────────┘
                             │ delegates to
              ┌──────────────┼────────────────┐
              ▼              ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Research    │  │  Writing     │  │  Code        │
    │  Agent       │  │  Agent       │  │  Agent       │
    │  (searches)  │  │  (drafts)    │  │  (executes)  │
    └──────────────┘  └──────────────┘  └──────────────┘
```

**Example**: Content creation pipeline
1. Research Agent: Finds facts about topic
2. Writing Agent: Creates article draft
3. Review Agent: Checks for errors
4. SEO Agent: Optimizes for search engines
5. Orchestrator: Manages the whole flow

---

## 🔑 Key Terms

| Term | Meaning |
|------|---------|
| **AI Agent** | LLM + tools + memory + actions |
| **Agentic AI** | Autonomous AI systems capable of multi-step tasks |
| **ReAct** | Reasoning + Acting — think, act, observe loop |
| **Tool use** | Agent's ability to call external functions/APIs |
| **Function Calling** | Structured way for LLM to invoke predefined functions |
| **Orchestrator** | Agent that coordinates other agents |
| **Sub-agent** | Specialized agent for a specific sub-task |
| **Planning** | Agent's ability to break goal into steps |
| **Observation** | Agent's ability to see results of its actions |
| **Memory** | Agent's ability to store and recall past context |
| **Autonomy** | Degree to which agent acts without human input |
| **Tool calling** | LLM selects and calls available tools |

---

## 🎤 Interview Answers

**"What is an AI Agent?"**
> "An AI Agent is an LLM enhanced with the ability to take actions — like calling APIs, searching the web, running code, or using databases. Unlike a simple Q&A model, an agent can break a complex goal into steps, execute each step, observe the result, and adapt its plan. It operates in a think-act-observe loop."

**"What is the difference between AI and Agentic AI?"**
> "Traditional AI responds to queries in one shot — you ask, it answers. Agentic AI can operate autonomously over multiple steps to complete complex goals. It can plan, use tools, remember past actions, and adjust based on feedback. It's the difference between a consultant who gives advice and one who actually implements the solution."

**"Did you use AI agents in your project?"**
> "Not a full autonomous agent, but we used agentic design patterns. We used Gemini's function calling feature, which is how agents use tools — the LLM selects and calls predefined functions with structured parameters. Our pipeline also has conditional planning: try vector search first, if similarity is low, call LLM. This sequential decision-making with fallback chains mirrors how an agent plans and adapts."

---

*Next: [06-AI-ORCHESTRATION.md](./06-AI-ORCHESTRATION.md)*

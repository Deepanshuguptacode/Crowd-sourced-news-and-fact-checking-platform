# Part 4 — AI & LLM (Google Gemini)

> 🏷️ **Level Guide**:
> - 📖 = Definition only is enough
> - 🏗️ = Architecture explanation needed  
> - 💻 = Code explanation may be asked

> ⭐ **This is YOUR biggest differentiator** — most freshers don't use AI/LLM in projects. Know this section well!

---

## Q1. What is an LLM (Large Language Model)?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> An LLM is a very large AI model that can **understand and generate human language**.
>
> Think of it like a super-smart autocomplete. It has read billions of text documents and learned patterns in language.
>
> **Examples**: ChatGPT (GPT-4), Google Gemini, Meta LLaMA, Anthropic Claude
>
> **What LLMs can do**:
> - Answer questions (like a knowledgeable assistant)
> - Summarize text
> - Classify text into categories
> - Generate new text, code, analysis
>
> **In our project**: We use **Google Gemini 2.5 Flash** to:
> - Classify if a debate comment belongs to an existing group
> - Generate a new group name if the comment doesn't fit existing groups
> - Generate counter-arguments for debate positions
> - Create a credibility verdict for news articles

---

## Q2. What is an Embedding? What is a vector?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> An **embedding** is a way to convert text (or images) into a list of numbers (called a **vector**) that captures the **meaning** of the text.
>
> **Why numbers?** Because computers can compare numbers — they can find which two texts have similar meanings by comparing their number lists.
>
> **Real example**:
> - "The president signed a new law" → [0.23, -0.87, 0.45, 0.12, ...]  (list of 768 numbers)
> - "A new bill was passed by the head of state" → [0.21, -0.83, 0.44, 0.15, ...] (very similar numbers)
>
> These two sentences have similar meanings, so their numbers are close to each other!
>
> **In our project**: We use Gemini's embedding model to convert debate comments and group descriptions into vectors, then store them in Pinecone to find similar comments.

---

## Q3. What is RAG (Retrieval Augmented Generation)?

**🏗️ Architecture Level needed**

> **Simple Answer (Definition)**:
>
> RAG = **Search first, then ask AI**. Instead of asking the AI to remember everything, you first search for relevant information, then give that information to the AI along with your question.

> **Why RAG?**
> LLMs have limited memory ("context window"). You can't give them thousands of documents. RAG solves this by giving only the most relevant information.

> **RAG in our project — Debate Comment Classification**:
>
> ```
> New comment arrives: "Modi government's new budget policy is wrong"
>     ↓
> Step 1: RETRIEVE — Convert comment to embedding (vector)
>          Search Pinecone for existing debate groups with similar vectors
>          Found: "Government Budget Criticism" group (85% similarity)
>     ↓
> Step 2: AUGMENT — Give this retrieved context to Gemini:
>          "Here are the existing groups: [Government Budget Criticism, ...]
>           Does this comment belong to one of these groups?"
>     ↓
> Step 3: GENERATE — Gemini responds: "Yes, it belongs to Government Budget Criticism"
>     ↓
> Comment is added to the matching group
> ```
>
> **Without RAG**: Send ALL existing groups to Gemini every time → slow, expensive, limited by context window  
> **With RAG**: Search first → send only relevant groups → fast, cheap, accurate ✅

---

## Q4. What is Function Calling in LLMs?

**🏗️ Architecture Level needed**

> **Simple Answer (Definition)**:
>
> Normally, LLMs output free-text responses (like a person typing an answer). **Function calling** makes the LLM output **structured JSON data** instead of random text.
>
> This is important when you need reliable, machine-readable output.

> **Example from our project**:
>
> Without function calling, Gemini might say:
> > "I think this comment belongs to the group called Government Policy because it talks about..."
>
> With function calling, Gemini outputs:
> ```json
> {
>   "action": "MATCH_EXISTING",
>   "groupId": "507f1f77bcf86cd799439011",
>   "confidence": 0.92
> }
> ```
>
> We can directly read this JSON in our code — no text parsing needed!

**💻 Code Level** (if asked to show):
```javascript
// Function calling setup in our project
const tools = [{
  functionDeclarations: [{
    name: "classifyComment",
    description: "Classify a debate comment into an existing group or create a new one",
    parameters: {
      type: "object",
      properties: {
        action: { 
          type: "string", 
          enum: ["MATCH_EXISTING", "CREATE_NEW", "IRRELEVANT"] 
        },
        groupId: { type: "string" },
        newGroupName: { type: "string" }
      },
      required: ["action"]
    }
  }]
}];

// Gemini must call this function and return structured data
const response = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [...],
  config: { tools }
});
```

---

## Q5. What is Prompt Engineering?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> Prompt engineering is the skill of **writing good instructions to an LLM** to get the best possible output.
>
> The quality of the output depends heavily on how well you write the prompt (instruction).
>
> **Bad prompt**: "Classify this comment"  
> **Good prompt**: "You are a debate moderator. I will give you a comment and a list of existing debate groups. Classify the comment into one of the groups, or say CREATE_NEW if it doesn't fit. Reply only with JSON in this format: {action: ..., groupId: ...}"
>
> **In our project**, we use:
> - **System prompts**: Tells Gemini what role it's playing ("You are a fact-checker...")
> - **Few-shot examples**: Give Gemini example input/output pairs so it learns what we expect
> - **Chain-of-thought**: Ask Gemini to reason step by step before giving the final answer

---

## Q6. What is API Key Rotation? Why did you build it?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> Google Gemini has a **rate limit** — you can only make a certain number of API calls per minute/day on the free tier. If you exceed it, you get an error.
>
> **Our solution**: We have 3 different Gemini API keys. After using one key for 5 requests, we automatically switch to the next key. After 15 requests, we're back to the first key. This way, we spread the load across 3 keys and avoid hitting the limit.
>
> **The rotation flow**:
> ```
> Request 1-5  → Use Key 1
> Request 6-10 → Use Key 2
> Request 11-15 → Use Key 3
> Request 16+ → Back to Key 1 (cycle repeats)
> ```
>
> **Why it matters**: In production, the AI is called VERY frequently (every new comment in a debate triggers AI classification). Without rotation, the service would frequently fail.

---

## Q7. What is Hallucination in LLMs?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> **Hallucination** is when an LLM confidently gives you a **wrong or made-up answer** as if it were fact.
>
> LLMs predict the most likely next word/sentence based on training data. Sometimes they "predict" wrong information.
>
> **Example**: "What is the capital of Australia?" → LLM might say "Sydney" (wrong! It's Canberra) — because Sydney is more famous and appears more in training data.
>
> **How we handle it in our project**:
> - We use **function calling** which forces structured output (reduces hallucination in classification tasks)
> - We give **few-shot examples** in the prompt so the model knows exactly what format we expect
> - For verdicts, we clearly instruct: "Base your answer ONLY on the comments provided"

---

## Q8. What is the difference between gemini-2.5-flash and gemini-embedding-001?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> These are two different Gemini models for different purposes:
>
> | Model | Purpose | Used in our project for |
> |-------|---------|------------------------|
> | **gemini-2.5-flash** | Language generation (text in, text out) | Comment classification, verdict generation, group naming |
> | **gemini-embedding-001** | Embedding generation (text in, numbers out) | Converting comments/groups into vectors for Pinecone |
>
> They are separate tools for separate jobs, both from Google.

---

## Q9. How does your AI pipeline work end-to-end for a debate comment?

**🏗️ Architecture Level needed** — *This is the MOST important AI question you'll get*

> **Simple Answer**:
>
> When a user posts a comment in a debate room, here's the full pipeline:
>
> ```
> User posts comment: "This government policy is completely wrong"
>     ↓
> [Step 1] OFF-TOPIC CHECK (Gemini)
>     → Ask Gemini: Is this comment relevant to the debate topic?
>     → If IRRELEVANT → Reject comment, tell user
>     → If RELEVANT → Continue ✅
>     ↓
> [Step 2] EMBED THE COMMENT (gemini-embedding-001)
>     → Convert comment text to a vector (list of numbers)
>     → e.g. [0.23, -0.87, 0.45, ...]
>     ↓
> [Step 3] VECTOR SEARCH (Pinecone)
>     → Search existing debate groups by vector similarity
>     → Find closest matching group (e.g., 88% similar to "Government Criticism" group)
>     ↓
> [Step 4A] If good match found (>= 0.75 similarity):
>     → Classify with Gemini: "Does this comment really belong to 'Government Criticism'?"
>     → If YES → Add comment to that group ✅
>     ↓
> [Step 4B] If no good match found:
>     → Ask Gemini: "Create a new group name for this comment"
>     → Create new DebateGroup with that name
>     → Add comment to the new group ✅
>     ↓
> [Step 5] COUNTER MATCHING
>     → Search if there's an "IdealCounter" for this group
>     → If found → Link the comment to its counter-argument
>     ↓
> Comment is saved, user sees it in the debate room
> ```

---

## 📝 Summary — What Level is Enough?

| Question | Definition ✅ | Architecture ✅ | Code ✅ |
|----------|:---:|:---:|:---:|
| What is LLM? | ✅ | — | — |
| What is an embedding? | ✅ | — | — |
| What is RAG? | — | ✅ | — |
| What is function calling? | — | ✅ | ✅ (basic) |
| What is prompt engineering? | ✅ | — | — |
| API key rotation? | — | ✅ | — |
| What is hallucination? | ✅ | — | — |
| Two Gemini models? | ✅ | — | — |
| Full AI pipeline (debate)? | — | ✅ | — |

---

**Next: [Part 5 — Vector Database & Pinecone](./05-VECTOR-DATABASE-AND-PINECONE.md)**

# 07 — Prompt Engineering
> The art of talking to LLMs — and how we do it in VoxVeritas

---

## 🤔 What is Prompt Engineering?

**Simple definition**: Prompt Engineering is the skill of **crafting inputs (prompts) to get the best possible outputs from an LLM**.

Think of it like this: An LLM is a brilliant but very literal assistant. If you give vague instructions, you get vague results. If you give clear, structured, detailed instructions — you get exactly what you need.

**Why it matters**: The same model (e.g., Gemini 2.5 Flash) can give drastically different quality outputs depending on how you write your prompt.

---

## 🎯 Types of Prompting

### 1. Zero-Shot Prompting
**What**: Ask the model to do something WITHOUT giving any examples.

```
Prompt: "Classify this comment as positive, negative, or neutral:
'I love this feature!'"

Response: "Positive"
```

**When to use**: Simple, well-defined tasks where the model already understands the format.

**In our project**: We use zero-shot for off-topic detection — we describe what "relevant", "tangential", and "off-topic" mean, then ask the model to classify without giving examples.

---

### 2. Few-Shot Prompting
**What**: Give 2-5 examples of input-output pairs BEFORE your actual question.

```
Prompt:
"Classify the sentiment:
Example 1: 'This is terrible' → Negative
Example 2: 'Amazing product!' → Positive
Example 3: 'It works fine' → Neutral

Now classify: 'The service is absolutely wonderful!'"

Response: "Positive"
```

**When to use**: When zero-shot gives inconsistent results. Examples guide the model.

**In our project**: Our prompts include "Bad: X / Good: Y" examples to steer the model:
```
"- Bad: 'Economic Impact'  Good: 'Job Market Disruption Concerns'"
"- Bad: 'Safety Issues'    Good: 'Child Safety Data Privacy'"
```
This is few-shot prompting for format guidance!

---

### 3. Chain-of-Thought (CoT) Prompting
**What**: Tell the model to **think step by step** before answering.

```
Without CoT:
Q: "A store has 5 apples. 3 customers each buy 2 apples. How many left?"
A: "4" (wrong!)

With CoT:
Q: "A store has 5 apples. 3 customers each buy 2 apples. Think step by step."
A: "Step 1: Total apples = 5
    Step 2: Total sold = 3 × 2 = 6
    Step 3: But we only have 5 apples, so we can sell at most 5
    Step 4: Remaining = 5 - 5 = 0... wait, we don't have enough to sell 6"
```

**Why it works**: Forces the model to reason rather than jump to conclusions. Improves accuracy on complex tasks.

**Tip**: Just adding "Think step by step" or "Let's think through this carefully" to your prompt significantly improves results on reasoning tasks.

---

### 4. System Prompts
**What**: Instructions given to the model before the conversation starts. Sets the persona, rules, and constraints.

```
System: "You are a professional debate moderator. You evaluate comments 
for relevance. Always be concise. Never be offensive. Output JSON only."

User: "Is this comment on-topic: 'AI will replace jobs'?"
```

**In our project**: We embed rules directly in user prompts (since we use single-turn calls, not chat format):
```
"Task: Analyze this comment's SPECIFIC argument, concrete evidence, and unique reasoning.
Grouping Rules:
- Match ONLY if the core claim, evidence type, and reasoning approach are substantially the same
- Create a NEW group if the argument angle, evidence source, or reasoning differs"
```

---

### 5. Function Calling (Structured Output)
**What**: Tell the LLM to call a specific function with typed parameters, instead of generating free text.

**Why this is powerful**: Free text output → risk of hallucination, inconsistent format, parsing errors.  
Function calling → guaranteed structured JSON, type-safe, predictable.

```javascript
// Define the "function" (schema):
const fn = {
  name: 'classify_comment',
  parameters: {
    type: 'OBJECT',
    properties: {
      matchedGroup: { type: 'STRING' },
      newLabel: { type: 'STRING' },
      confidence: { type: 'NUMBER' },
    },
    required: ['matchedGroup', 'newLabel', 'confidence']
  }
};

// Call with function tool:
const res = await gemini.generateContent({
  tools: [{ functionDeclarations: [fn] }],
  // ...
});

// Get typed result:
const args = res.functionCalls[0].args;
// { matchedGroup: "AI Jobs", newLabel: "Economic Impact", confidence: 0.87 }
```

**In our project**: ALL our Gemini calls use function calling. This is why our AI pipeline is reliable — we never parse free text.

---

### 6. Role Prompting
**What**: Assign the model a specific role/persona.

```
"You are an expert debate moderator with 20 years of experience in identifying argument patterns..."
```

**When to use**: When you need domain-specific tone, expertise level, or behavior.

---

### 7. Instruction Following
**What**: Give explicit, numbered instructions about format and constraints.

**Our prompt style** (from `llmService.js`):
```
"Content Generation Requirements:
1. newLabel: Ultra-specific argument category (2-5 words)
   - Bad: 'Economic Impact' Good: 'Job Market Disruption Concerns'
2. title: Crystal-clear argument theme derived from the comment (6-10 words)
3. description: Highly detailed summary (40-70 words) that includes:
   - The exact argument/claim being made
   - Type of evidence referenced
   - The reasoning pattern"
```

This is explicit instruction following with word limits, format rules, and good/bad examples.

---

## 🔨 Prompt Engineering Best Practices

### ✅ DO:

**1. Be specific about format**
```
❌ "Summarize this text"
✅ "Summarize this text in exactly 3 bullet points, each under 15 words"
```

**2. Give word/length limits**
```
❌ "Write a counter-argument"
✅ "Write a counter-argument in 30-50 words MAX. Do not exceed 50 words."
```

**3. Show examples of what you want**
```
✅ "Like this: 'AI automation destroys far more jobs than it creates. 
   Manufacturing sectors have shed millions due to AI.' — specific, direct, under 50 words"
```

**4. Define what NOT to do**
```
✅ "Do NOT describe what a counter-argument would say.
   Write it AS IF you are the person making the counter-argument."
```

**5. Use numbered rules**
```
✅ "Rules:
   1. Always return valid JSON
   2. Never use placeholders
   3. If uncertain, return empty string for optional fields"
```

### ❌ DON'T:

**1. Be vague**
```
❌ "Tell me about this comment"
✅ "Classify this comment into one of these exact categories: [list]"
```

**2. Ask multiple unrelated things at once**
```
❌ "Classify the comment AND rewrite it AND suggest improvements"
✅ Split into separate calls or structured function with clear fields
```

**3. Forget edge cases**
```
❌ "Match the comment to an existing group"
✅ "Match the comment IF AND ONLY IF the core argument is substantially the same. 
   If no match, leave matchedGroup as empty string"
```

---

## 📏 Prompt Design in Our Project

### Our Classify+Generate Prompt Structure:
```
1. INPUT: New debate comment (clearly labeled)
2. CONTEXT: Existing argument groups (labeled list)
3. TASK: Clear description of what to do
4. RULES: Numbered grouping rules
5. REQUIREMENTS: Each output field with specs
6. EXAMPLES: Good vs bad for each field
7. FORMAT: "Return only JSON arguments"
```

This 7-part structure ensures consistent, high-quality outputs.

---

## 🔬 Advanced Techniques

### Self-Consistency
Run the same prompt 3-5 times and take the majority answer. Useful for critical decisions.

### Tree of Thoughts
Generate multiple reasoning paths, evaluate each, pick the best. Like CoT but with branching.

### Retrieval-Augmented Prompting (RAG)
Include retrieved documents in the prompt for grounding (we do this!).

### Constitutional AI
Give the model a list of principles to evaluate its own outputs against. Used by Anthropic for Claude.

---

## 🔑 Key Terms

| Term | Meaning |
|------|---------|
| **Zero-shot** | No examples given, model relies on training |
| **Few-shot** | 2-5 examples given to guide the model |
| **Chain-of-Thought** | Prompt model to reason step by step |
| **Function Calling** | Structured tool-calling for typed JSON output |
| **System prompt** | Background instructions setting model's role |
| **Temperature** | Controls randomness (0=focused, 1=creative) |
| **Prompt injection** | Attack where user input hijacks system prompt |
| **Jailbreaking** | Tricks to bypass safety guidelines |
| **Prompt template** | Reusable prompt with variable placeholders |
| **Context stuffing** | Adding too much context → degraded performance |
| **Lost in the middle** | Model ignores info in the middle of long prompts |

---

## 🎤 Interview Answers

**"What is prompt engineering?"**
> "Prompt engineering is the practice of designing inputs to LLMs to reliably get high-quality, consistent outputs. It involves techniques like zero-shot (just ask), few-shot (give examples), chain-of-thought (make model reason step by step), and function calling (force structured JSON output). The same model can give wildly different results depending on prompt quality."

**"How did you use prompt engineering in your project?"**
> "We heavily invested in prompt design. Our classify-and-generate prompt has 7 layers: the input comment, context (existing groups), task description, grouping rules, field-by-field requirements with word limits, good/bad examples for each field, and a format instruction. We also used function calling for ALL Gemini interactions — this gives us typed JSON instead of free text, eliminating parsing errors and reducing hallucination."

**"What's function calling?"**
> "Function calling lets you define a JSON schema — the function name, parameters, and types — and give it to the LLM as a tool. Instead of generating free text, the model 'calls' this function with structured arguments. It's like telling Gemini: 'I need exactly these fields, in exactly these types, always.' We use this for every Gemini call in our project."

---

*Next: [08-FINE-TUNING-AND-TRAINING.md](./08-FINE-TUNING-AND-TRAINING.md)*

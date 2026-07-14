# 02 — Transformer Architecture (ARC)
> How the most important AI architecture works — explained simply

---

## 🤔 Why Should You Know This?

Transformers are the foundation of ALL modern LLMs — GPT, Gemini, Claude, Llama. When an interviewer asks "how does Gemini work under the hood?" — the answer starts with Transformers.

**ARC** = **A**ttention, **R**ecurrent vs Transformer, **C**ontextual understanding

---

## 🏛️ What is a Transformer?

**Simple definition**: A type of neural network architecture (introduced by Google in 2017) that can process sequences of data (like text) and understand relationships between different parts of the sequence.

**The famous paper**: "Attention is All You Need" (Vaswani et al., 2017) — this changed the entire AI field.

**Before Transformers**: We used RNNs (Recurrent Neural Networks) which:
- Read text word by word (sequential)
- Forgot early parts of long sentences
- Were slow to train

**Transformers solved this** by processing the entire text at once (parallel) using something called **Attention**.

---

## 👁️ What is Attention (Self-Attention)?

**This is the most important concept in Transformers.**

**Simple definition**: Attention lets the model focus on the most relevant parts of the input when processing each word.

**Real-world analogy**: 
Imagine reading this sentence: *"The trophy doesn't fit in the suitcase because it is too big."*

What does "it" refer to? The trophy. How do you know? You attended to the context — specifically "trophy" and "fit" and "big". 

Self-attention does exactly this — for each word, it weighs how much attention to pay to every other word.

**Example**:
```
Sentence: "The cat sat on the mat because it was tired"
                                              ↑
When processing "it" → high attention to "cat", low attention to "mat"
```

**In LLMs**: Every token pays "attention" to every other token in the context. This is why LLMs understand context so well.

---

## 🏗️ Transformer Architecture Overview

```
                    ┌─────────────────────────┐
Input Text ──────►  │     ENCODER             │  (understands input)
"Is this news fake?"│  Self-Attention          │
                    │  Feed Forward Network    │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │     DECODER             │  (generates output)
                    │  Self-Attention          │
                    │  Cross-Attention         │  ← attends to encoder output
                    │  Feed Forward Network    │
                    └─────────────────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │  Output Layer           │  "This article is misleading"
                    │  (Softmax probabilities) │
                    └─────────────────────────┘
```

**Key components**:
1. **Input Embeddings** — Convert tokens to vectors
2. **Positional Encoding** — Tells the model where each word is in the sequence
3. **Multi-Head Attention** — Multiple attention "heads" look at different aspects of text
4. **Feed Forward Network** — Processes each position independently
5. **Layer Normalization** — Stabilizes training
6. **Output Layer** — Predicts next token probabilities

---

## 🔄 Multi-Head Attention

**Simple analogy**: Like having multiple experts reading the same text, each looking for different things:
- Head 1: focuses on grammatical structure
- Head 2: focuses on entity relationships (who did what to whom)
- Head 3: focuses on sentiment
- Head 4: focuses on logical connections

All heads run in parallel, then their outputs are combined.

**Why it's powerful**: Different heads capture different types of relationships in text.

---

## 📬 Positional Encoding

**Problem**: Attention doesn't inherently know word order. "Dog bites man" vs "Man bites dog" — same words, different meaning.

**Solution**: Add a positional signal to each token embedding so the model knows position 1, 2, 3, etc.

**Simple analogy**: Like numbering seats in a theater. The audience is the same, but seat numbers tell you where everyone is.

---

## 🆚 BERT vs GPT (Two Types of Transformers)

This is a common interview question!

| Feature | BERT | GPT |
|---------|------|-----|
| Type | **Encoder-only** | **Decoder-only** |
| Training task | Fill in the blanks (masked LM) | Predict next word |
| Reads text | Bidirectionally (both directions) | Left-to-right only |
| Best for | Understanding, classification | Text generation |
| Example use | Search engines, sentiment analysis | ChatGPT, code generation |
| Made by | Google | OpenAI |

**Simple analogy**:
- **BERT** = A great reader who understands full paragraphs deeply
- **GPT** = A great writer who generates text fluently

**What Gemini is**: A decoder-based model (like GPT family) — optimized for generating text.

---

## 🏭 What is an Encoder-Decoder Architecture?

Used in original translation models (seq2seq).

**Encoder**: Reads and understands the input → creates a compressed representation  
**Decoder**: Takes that representation and generates output

**Real example**:
- Input (French): "Je suis un étudiant" → Encoder → [context vector]
- [context vector] → Decoder → "I am a student" (English)

**In our project**: Embedding models like `text-embedding-004` are encoder-based — they encode text into vectors. Generation models like Gemini 2.5 Flash are decoder-based — they generate text.

---

## 🔢 What are Model Parameters? (Deep Dive)

Every connection in the neural network has a **weight** (a number). Learning = adjusting these numbers.

```
Layer 1: [input] → multiply by weights → activation function → [output]
Layer 2: [output from layer 1] → multiply by different weights → ...
...
Billions of layers × millions of connections = Billions of parameters
```

**Training**: We show the model millions of examples, it makes predictions, we compute error, we adjust parameters (via backpropagation). Repeat billions of times.

---

## ⚡ Why Transformers Dominated AI

| Problem | Old (RNN/LSTM) | Transformer Fix |
|---------|--------------|----------------|
| Long-range dependencies | Forgot early tokens | Attention sees ALL tokens at once |
| Training speed | Sequential = slow | Parallel processing = fast |
| Scaling | Diminishing returns | Better with more data + params |
| Transfer learning | Hard | Pretrain once, fine-tune for many tasks |

---

## 🔑 Key Terms to Know

| Term | Meaning |
|------|---------|
| **Attention** | Mechanism to weigh importance of each token relative to others |
| **Self-Attention** | Each token attends to all other tokens in the same sequence |
| **Cross-Attention** | Decoder attends to encoder's output |
| **Multi-Head Attention** | Multiple attention operations in parallel |
| **Positional Encoding** | Adding position information to token embeddings |
| **Encoder** | Reads and understands input |
| **Decoder** | Generates output token by token |
| **Softmax** | Converts numbers to probabilities (all sum to 1.0) |
| **Backpropagation** | Algorithm to update weights during training |
| **Layer Normalization** | Technique to stabilize neural network training |

---

## 🎤 How to Explain in Interview

**Q: "How does Gemini/ChatGPT actually work?"**

**A**: "These models are based on the Transformer architecture, introduced by Google in 2017. The key innovation is the Attention mechanism — instead of processing text word-by-word sequentially like older models, Transformers process all tokens simultaneously and for each token, they calculate how much 'attention' to pay to every other token. This lets the model understand long-range dependencies and context very well. Models like Gemini are specifically decoder-based Transformers, meaning they predict one token at a time during generation, using all previous tokens as context."

---

*Next: [03-RAG-RETRIEVAL-AUGMENTED-GENERATION.md](./03-RAG-RETRIEVAL-AUGMENTED-GENERATION.md)*

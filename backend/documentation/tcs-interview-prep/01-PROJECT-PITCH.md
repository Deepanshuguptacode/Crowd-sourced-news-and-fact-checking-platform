# 01 — Project Pitch & Introduction

> Memorize this. Every TCS technical interview opens with "Tell me about your project."

---

## The 2-Minute Pitch (Memorize This)

"I built VoxVeritas — which is Latin for 'Voice of Truth' — a full-stack crowd-sourced news fact-checking platform. The core problem we're solving is misinformation: today anyone can spread fake news, but there's no structured, community-driven way to verify it.

Our platform lets users submit news articles for community verification. Community members and verified experts can comment with evidence links and vote for or against a news article's credibility. On top of that, we've integrated Google's Gemini AI to analyze all the comments and generate an AI-powered credibility verdict — a score from 0 to 100 — based on what the community is saying.

Technically, the backend is built with Node.js and Express, MongoDB for the database, and we use Pinecone — a vector database — to group similar comments together using semantic embeddings. We also built a biometric face authentication system using Python's InsightFace library, which runs as a separate Flask microservice. This is called from our Node.js backend over HTTP.

The platform supports 4 user types — normal users, community users, expert users, and admins — each with different permissions managed through JWT-based authentication. I handled the complete backend architecture, all the AI service integrations, and the API design."

---

## Problem Statement (For Deeper Questions)

**The Problem:**
- Misinformation spreads faster than corrections
- No platform provides structured, evidence-based fact checking
- Expert opinions carry the same weight as uninformed opinions
- AI alone can't fact-check — it needs community context

**Our Solution:**
- Crowd-sourced verification: community votes create a credibility signal
- Expert weighting: verified expert comments and votes count more
- AI-assisted: Gemini LLM synthesizes community discussions into a verdict
- Transparent: all votes, comments, and evidence links are public

---

## Key Numbers to Mention

| Metric | Value | Why It Impresses |
|--------|-------|-----------------|
| User types | 4 (Normal, Community, Expert, Admin) | Shows role-based system design |
| AI models used | 2 (Gemini LLM + Gemini Embeddings) | Shows multi-modal AI use |
| Vector dimensions | 768 (text embeddings) + 512 (face) | Shows ML depth |
| API keys rotated | 3 Gemini keys, rotate every 5 requests | Shows production thinking |
| Pinecone namespaces | 4 (debate-groups, ideal-counters, news-groups, debate-topics) | Shows DB organization |
| Cron interval | Every 10 minutes for trending news | Shows real-time data awareness |
| News cap | 40 articles, auto-cleanup hourly | Shows storage management |

---

## Architecture Summary (Draw This If Asked)

```
Frontend (React)
      |
      | HTTP REST API
      v
Node.js / Express Backend
      |
      +-----> MongoDB (user data, news, comments, verdicts)
      |
      +-----> Pinecone (comment embeddings, group matching)
      |
      +-----> Google Gemini API (LLM classification + embeddings)
      |
      +-----> Flask/Python Microservice (face recognition - ArcFace)
                    |
                    +-----> InsightFace model (512-dim embeddings)
```

---

## What Makes This Project Stand Out

1. **Not a CRUD app** — Has genuine AI/ML pipeline integration
2. **Microservice design** — Python + Node.js communicating over HTTP
3. **Production-grade patterns** — API key rotation, cleanup jobs, caching
4. **Real data** — Scrapes NDTV live, not mock data
5. **Security focus** — bcrypt hashing, JWT cookies, httpOnly flags

---

## Anticipated Follow-ups & Short Answers

**Q: How long did it take to build?**
A: "Approximately 3-4 months of active development, iterating on the AI pipeline the most."

**Q: Did you work alone or in a team?**
A: [Answer honestly — if solo]: "I built the entire backend solo. The frontend was collaborative."

**Q: Is it deployed?**
A: "The backend is deployed on Vercel with MongoDB Atlas and Pinecone cloud. The Flask face auth service runs locally / on a dedicated server."

**Q: What was the hardest part?**
A: "The comment grouping pipeline — getting Pinecone's vector similarity + Gemini LLM to work together reliably with fallback logic when one fails. Also managing rate limits across 3 Gemini API keys."

**Q: What would you improve?**
A: "I'd add WebSocket support for real-time verdict updates, implement Redis caching for frequently accessed news feeds, and add OAuth for social login."

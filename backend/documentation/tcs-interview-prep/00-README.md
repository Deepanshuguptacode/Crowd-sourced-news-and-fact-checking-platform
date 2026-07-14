# TCS Interview Preparation — VoxVeritas Project

> **Project**: VoxVeritas — Crowd-Sourced News & Fact-Checking Platform  
> **Interview Type**: TCS (Technical + Managerial + HR)  
> **Purpose**: Quick-access notes specifically tailored to TCS interview patterns

---

## Files in This Folder

| File | Focus Area |
|------|-----------|
| [01-PROJECT-PITCH.md](./01-PROJECT-PITCH.md) | 2-minute pitch, problem statement, impact |
| [02-TECH-STACK-QA.md](./02-TECH-STACK-QA.md) | Why each technology, comparisons, trade-offs |
| [03-ARCHITECTURE-QA.md](./03-ARCHITECTURE-QA.md) | MVC, data flow, design patterns |
| [04-DATABASE-QA.md](./04-DATABASE-QA.md) | MongoDB, Mongoose, schema design, indexing |
| [05-AUTH-SECURITY-QA.md](./05-AUTH-SECURITY-QA.md) | JWT, bcrypt, session vs token, OWASP |
| [06-AI-ML-QA.md](./06-AI-ML-QA.md) | Gemini LLM, vector DB, embeddings, AI pipeline |
| [07-SYSTEM-DESIGN-QA.md](./07-SYSTEM-DESIGN-QA.md) | Scalability, cron jobs, caching, rate limiting |
| [08-DSA-CONCEPTS.md](./08-DSA-CONCEPTS.md) | Algorithms used in project (cosine similarity, sorting, etc.) |
| [09-HR-BEHAVIORAL.md](./09-HR-BEHAVIORAL.md) | STAR answers, teamwork, challenges, TCS values |
| [10-RAPID-FIRE-QA.md](./10-RAPID-FIRE-QA.md) | One-liner answers for 50+ common TCS questions |

---

## TCS Interview Structure (Typical)

```
Round 1: Technical Interview (45-60 min)
  - Project deep dive (20-25 min)
  - Core CS concepts: OOP, DBMS, OS, Networks (15 min)
  - DSA: 1-2 problems or concept questions (10 min)

Round 2: Managerial Interview (30 min)
  - Project scalability & architecture decisions
  - Problem-solving & approach questions
  - Leadership, ownership, conflict handling

Round 3: HR Interview (20-30 min)
  - Why TCS? Career goals
  - Relocation, work culture alignment
  - Strengths, weaknesses, STAR stories
```

---

## Quick Revision Priority

If you have 30 minutes before the interview:
1. 01-PROJECT-PITCH.md — Know your intro cold
2. 10-RAPID-FIRE-QA.md — Scan one-liners
3. 05-AUTH-SECURITY-QA.md — JWT/bcrypt (always asked)

If you have 2 hours:
1. All of the above
2. 06-AI-ML-QA.md — Differentiator topic
3. 04-DATABASE-QA.md — MongoDB deep dive
4. 09-HR-BEHAVIORAL.md — Practice STAR answers aloud

---

## Your Key Differentiators (Mention These Early)

1. Production AI Integration — Google Gemini LLM + Pinecone Vector DB in a real app
2. Biometric Authentication — Face recognition with ArcFace/InsightFace (Python + Flask)
3. Multi-Service Architecture — Node.js backend + Python Flask microservice
4. API Key Rotation System — Custom rate-limit management across 3 Gemini keys
5. Real-time Data Pipeline — NDTV scraping every 10 minutes via cron jobs
6. Polymorphic User System — 4 user types with cascading authentication middleware

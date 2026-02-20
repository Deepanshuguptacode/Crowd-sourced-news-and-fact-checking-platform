# VoxVeritas Backend Documentation

## Navigation Hub

Welcome to the complete backend documentation for **VoxVeritas** — a crowd-sourced news verification and fact-checking platform. This documentation explains every piece of backend code so you can understand, explain, and defend any design decision.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────────┐
│                   Express.js Server (index.js)                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Routes   │→│ Middleware  │→│  Controllers  │→│ Services  │  │
│  └──────────┘  └────────────┘  └──────────────┘  └──────┬───┘  │
│                                                         │      │
│  ┌──────────────────────────────────────────────────────┘      │
│  │                    │                    │                    │
│  ▼                    ▼                    ▼                    │
│  MongoDB          Pinecone            Google Gemini             │
│  (primary DB)     (vector DB)         (AI/embeddings)           │
└─────────────────────────────────────────────────────────────────┘
```

**Three databases/services work together:**
- **MongoDB** stores all persistent data (users, news, comments, debate rooms, etc.)
- **Pinecone** stores vector embeddings for semantic similarity matching
- **Google Gemini** generates embeddings and performs AI classification/analysis

---

## Documentation Files

### Foundation (Start Here)
| # | File | What You'll Learn |
|---|------|-------------------|
| 01 | [Node.js & Express Fundamentals](01-NODE-EXPRESS-FUNDAMENTALS.md) | How Node.js works, Express routing, middleware chain, JSON APIs |
| 02 | [Project Architecture & Structure](02-PROJECT-ARCHITECTURE.md) | Folder layout, file naming, how data flows through the system |
| 03 | [MongoDB & Mongoose Deep Dive](03-MONGODB-MONGOOSE.md) | Schemas, models, queries, population, aggregation pipelines |

### Core Systems
| # | File | What You'll Learn |
|---|------|-------------------|
| 04 | [Data Models](04-DATA-MODELS.md) | All 13 Mongoose models — fields, relationships, validations |
| 05 | [Authentication System](05-AUTHENTICATION-SYSTEM.md) | JWT tokens, cookies, 6 middleware types, multi-user-type auth |
| 06 | [News System](06-NEWS-SYSTEM.md) | Upload with screenshots, combined feed, voting, cascade deletion |
| 07 | [Comments System](07-COMMENTS-SYSTEM.md) | Community/Expert comments, expert voting, auto score calculation |

### AI & Vector Intelligence
| # | File | What You'll Learn |
|---|------|-------------------|
| 08 | [Pinecone Vector Database](08-PINECONE-VECTOR-DATABASE.md) | Vector embeddings, namespaces, similarity thresholds, caching |
| 09 | [Google Gemini & LLM Service](09-GEMINI-LLM-SERVICE.md) | Function calling, classification, content generation, key rotation |
| 10 | [Comment Filtering Service](10-COMMENT-FILTERING-SERVICE.md) | Vector-first matching, LLM fallback, group management |
| 11 | [AI Verdict System](11-AI-VERDICT-SYSTEM.md) | Credibility scoring, top comment selection, verdict generation |

### Debate System
| # | File | What You'll Learn |
|---|------|-------------------|
| 12 | [Debate Rooms & Participation](12-DEBATE-ROOMS.md) | Room CRUD, join/leave, participant management, cascade deletion |
| 13 | [Debate Groups & Ideal Counters](13-DEBATE-GROUPS-COUNTERS.md) | Group creation, ideal counters, counter-matching, many-to-many linking |
| 14 | [Debate Comments Pipeline](14-DEBATE-COMMENTS-PIPELINE.md) | Complete flow: off-topic → group match → counter-link |

### Feature Systems
| # | File | What You'll Learn |
|---|------|-------------------|
| 15 | [Trending News & Web Scraping](15-TRENDING-NEWS-SCRAPING.md) | NDTV scraping with Cheerio, cron scheduler, reposting to main feed |
| 16 | [Face Authentication](16-FACE-AUTHENTICATION.md) | HTTP face auth service, embedding extraction, cosine similarity |
| 17 | [Accuracy Testing](17-ACCURACY-TESTING.md) | Statistical accuracy model, engagement metrics, complexity tiers |

### Infrastructure
| # | File | What You'll Learn |
|---|------|-------------------|
| 18 | [Gemini Key Rotation](18-GEMINI-KEY-ROTATION.md) | Multi-key management, rotation after 5 requests, rate limit avoidance |
| 19 | [Cleanup & Scheduling](19-CLEANUP-SCHEDULING.md) | News/trending cleanup, cron scheduler, automatic maintenance |
| 20 | [Routes & API Reference](20-ROUTES-API-REFERENCE.md) | Every endpoint — method, path, auth, controller mapping |

---

## Recommended Reading Order

**If you're new to backend development:**
```
01 → 02 → 03 → 04 → 05 → 06 → 07
(then) 08 → 09 → 10 → 11
(then) 12 → 13 → 14
(then) 15 → 16 → 17 → 18 → 19 → 20
```

**If you want to understand a specific feature:**
- **"How does comment grouping work?"** → 08, 09, 10
- **"How does the debate system work?"** → 12, 13, 14
- **"How does AI verdict work?"** → 09, 11
- **"How does trending news get scraped?"** → 15, 19
- **"How does authentication work?"** → 05

---

## Key Technologies

| Technology | Purpose | Version/Model |
|-----------|---------|---------------|
| Node.js + Express | Server framework | Express 4.x |
| MongoDB + Mongoose | Primary database | Mongoose 8.x |
| Pinecone | Vector database | @pinecone-database/pinecone |
| Google Gemini | AI (LLM + embeddings) | gemini-2.5-flash / gemini-embedding-001 |
| JWT + bcrypt | Authentication | jsonwebtoken / bcryptjs |
| Cheerio + Axios | Web scraping | cheerio / axios |
| Multer | File uploads | multer |
| node-cron | Task scheduling | cron |

# 09 — HR & Behavioral Q&A

> Use the STAR method: Situation → Task → Action → Result

---

## "Tell Me About Yourself"

**Script:**
"My name is [Name]. I'm a [CS/IT] student from [College]. I have a strong interest in backend development and AI systems. My capstone project is VoxVeritas — a crowd-sourced news fact-checking platform where I built the entire backend using Node.js, MongoDB, and integrated Google's Gemini AI and a Python face-recognition microservice.

I'm particularly interested in how AI can solve real-world problems — in this case, combating misinformation. I enjoy working on the intersection of distributed systems and machine learning. I chose to apply to TCS because of its scale — working on systems that impact millions of users aligns with where I want to grow as an engineer."

---

## Behavioral STAR Answers

### Q: Tell me about a challenging problem you solved.

**STAR Answer:**

**Situation:** When integrating Pinecone vector database with our comment grouping system, comments were sometimes incorrectly grouped because vector similarity alone isn't perfect — a comment about "economic growth" might match a group about "economy" with a 0.73 score, just below our 0.74 threshold.

**Task:** Design a robust fallback system that handles borderline cases without losing comment context.

**Action:** I implemented a two-layer architecture:
1. Pinecone vector search for fast initial matching (threshold 0.74)
2. Gemini LLM as a fallback for borderline or genuinely new topics

The LLM receives the comment + top candidate groups and decides: "Does this fit an existing group?" If yes, assign it. If no, create a new group with a generated label and description.

**Result:** Comment grouping accuracy improved significantly. The system now handles edge cases gracefully, and new topics automatically create new groups without human intervention. Even if Pinecone is unreachable, the LLM-only path works as a complete fallback.

---

### Q: Tell me about a time you worked in a team.

**STAR Answer:**

**Situation:** During VoxVeritas development, the frontend team needed the authentication APIs and news feed APIs to build their UI, but the AI verdict feature (which I was working on) wasn't ready.

**Task:** Coordinate priorities so the frontend could progress without blocking.

**Action:** I prioritized building and documenting the auth and news feed APIs first (with mock AI verdict responses where needed). I wrote clear API documentation with request/response examples so the frontend team could integrate without needing me available at all times. I set up a shared Postman collection for testing.

**Result:** Frontend development didn't block — they integrated auth within a week. When the AI verdict API was ready, integration was smooth because the contract was pre-agreed. The project shipped on time.

---

### Q: Tell me about a time you failed.

**STAR Answer:**

**Situation:** Early in the project, I stored Gemini API keys directly in the code and accidentally pushed them to GitHub. GitHub's secret scanning flagged it within hours.

**Task:** Immediately revoke and rotate the exposed keys, and prevent this from happening again.

**Action:** Revoked all 3 API keys immediately from Google Cloud Console. Generated new keys. Added a `.gitignore` entry for `.env`. Added a `.env.example` file with placeholder values. Implemented environment variable loading via `dotenv`. Added a pre-commit hook to scan for API key patterns.

**Result:** No unauthorized usage occurred (keys were rotated quickly). The `.env` pattern is now used throughout the project. This was a good lesson in secrets management that I now apply from day one of any project.

---

### Q: Why do you want to join TCS?

**Answer:**
"TCS works at an extraordinary scale — hundreds of millions of end users across banking, healthcare, retail, and government sectors. As an engineer, that scale forces you to think about performance, reliability, and architecture in ways that smaller projects simply don't. I want that learning environment.

Additionally, TCS's investment in AI — TCS AI Cloud, Ignio, and partnerships with major LLM providers — aligns with my interest in production AI systems. I've built small-scale AI integrations; at TCS, I'd get to see how those patterns are applied at enterprise scale.

Finally, TCS's global presence means opportunities to work on diverse problem domains, not just one industry."

---

### Q: What are your strengths?

**Answer:**
1. **Problem decomposition** — I naturally break complex problems into layers (as seen in my three-layer comment grouping pipeline).
2. **Systems thinking** — I think about failure modes and fallbacks before writing the happy path (graceful degradation in all my services).
3. **Fast learner** — Pinecone, InsightFace, ArcFace, Gemini function calling were all new to me before this project.

---

### Q: What are your weaknesses?

**Answer:**
"I can spend too much time making systems theoretically robust before they're needed — over-engineering. For example, I built a full 3-key rotation system and fallback LLM pipeline from the start, when simpler versions might have sufficed initially. I'm actively working on shipping simpler versions first and iterating — the MVP mindset."

---

### Q: Where do you see yourself in 5 years?

**Answer:**
"In 5 years, I want to be a backend architect or AI systems engineer — someone who designs the architecture for large-scale data pipelines and AI-integrated applications. I want to go deeper into distributed systems, understand trade-offs between consistency and availability at scale, and contribute to how organizations deploy and govern AI responsibly.

At TCS, I'd aim to move from development to architecture roles, perhaps within TCS's AI/ML practice or cloud solutions group."

---

### Q: Why should we hire you?

**Answer:**
"Three reasons:

First, I bring genuine AI/ML experience from building production integrations — not just using libraries, but understanding how embeddings, vector search, and LLM function calling work together.

Second, I think about systems holistically — from database schema design to API error handling to deployment cleanup — not just feature code.

Third, I'm proactive about documentation and knowledge sharing. I documented the entire VoxVeritas backend with 40+ documentation files covering every service, which meant any team member could onboard quickly.

TCS values engineers who think beyond their task. I do."

---

## TCS-Specific Q&A

**Q: Are you willing to relocate?**
A: "Yes, absolutely. I'm open to working in any of TCS's offices across India or internationally if the opportunity arises."

**Q: Are you comfortable with service bonds / service agreements?**
A: "Yes, I understand TCS's service agreement and I'm comfortable with it. I see it as a mutual commitment."

**Q: What do you know about TCS?**
A: "TCS (Tata Consultancy Services) is India's largest IT services company by market cap and revenue, with over 600,000 employees across 150+ countries. TCS works across BFSI, healthcare, retail, manufacturing, and government sectors. Their iON platform serves education, their Ignio platform uses AI for enterprise IT, and TCS AI Cloud offers MLOps services. TCS is consistently ranked as one of the world's top employers."

**Q: What is TCS's digital initiatives?**
A: "TCS has several digital platforms: Business 4.0 framework (intelligence + agility + automation + cloud), TCS iON (education & assessment), Ignio (cognitive automation), Machine First Delivery Model, and their AI.Cloud offering for enterprise ML workloads."

---

## Rapid HR Checklist

- [ ] Know your college/branch/percentage/backlogs (prepare honest answers)
- [ ] Know your CGPA and be ready to explain any dips
- [ ] Have 3 extracurricular activities to mention
- [ ] Have 1 technical achievement beyond VoxVeritas
- [ ] Know TCS's current CEO (K Krithivasan as of 2024)
- [ ] Know TCS stock ticker (TCS on NSE/BSE)
- [ ] Know TCS founding year (1968)
- [ ] Have 2 questions ready to ask the interviewer

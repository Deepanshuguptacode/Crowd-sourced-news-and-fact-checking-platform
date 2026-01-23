# Backend Documentation - VoxVeritas Platform

Welcome to the comprehensive backend documentation for the VoxVeritas crowd-sourced news and fact-checking platform.

## � Quick Start

- **New to the project?** Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Want structured learning?** Follow [LEARNING_ROADMAP.md](./LEARNING_ROADMAP.md)
- **Need quick reference?** Use [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## �📚 Documentation Structure

This documentation is organized into logical parts to help you understand the entire backend architecture step by step:

### Part 1: Foundation & Setup
- **[1.1 Overview & Architecture](./01-overview-architecture.md)** - High-level system design and technology stack
- **[1.2 Server Setup & Entry Point](./02-server-setup.md)** - Express server configuration, middleware, and startup

### Part 2: Data Layer
- **[2.1 Database Models Overview](./03-models-overview.md)** - Understanding MongoDB schemas
- **[2.2 User Models](./04-user-models.md)** - User types: Normal, Expert, Community, Admin
- **[2.3 News & Content Models](./05-news-models.md)** - News, TrendingNews, Comments
- **[2.4 Debate System Models](./06-debate-models.md)** - DebateRoom, DebateGroup, DebateComment
- **[2.5 AI & Verification Models](./07-ai-models.md)** - AIVerdict, CommentFilter, AccuracyTest

### Part 3: Business Logic
- **[3.1 Controllers Overview](./08-controllers-overview.md)** - How controllers work
- **[3.2 User Controller](./09-user-controller.md)** - Registration, authentication, profile management
- **[3.3 News Controller](./10-news-controller.md)** - News CRUD operations and voting
- **[3.4 Comments Controller](./11-comments-controller.md)** - Comment system and interactions
- **[3.5 Debate Controllers](./12-debate-controllers.md)** - Debate rooms, groups, and comments
- **[3.6 AI Verdict Controller](./13-ai-verdict-controller.md)** - AI-powered fact-checking

### Part 4: API Routes
- **[4.1 Routes Overview](./14-routes-overview.md)** - RESTful API design
- **[4.2 User Routes](./15-user-routes.md)** - Authentication and user endpoints
- **[4.3 News & Content Routes](./16-news-routes.md)** - News and comment endpoints
- **[4.4 Debate Routes](./17-debate-routes.md)** - Debate system endpoints

### Part 5: Services & Utilities
- **[5.1 Services Overview](./18-services-overview.md)** - Service layer architecture
- **[5.2 AI Services](./19-ai-services.md)** - Gemini AI integration, LLM service
- **[5.3 Face Authentication](./20-face-auth-service.md)** - Biometric authentication
- **[5.4 Comment Filtering](./21-comment-filtering.md)** - Spam and off-topic detection
- **[5.5 Verification Services](./22-verification-services.md)** - News verification logic
- **[5.6 Schedulers & Background Jobs](./23-schedulers.md)** - Cron jobs and cleanup

### ⭐ Special Guides: Face Authentication
- **[FACE_AUTHENTICATION_COMPLETE_GUIDE.md](./FACE_AUTHENTICATION_COMPLETE_GUIDE.md)** - 📘 **COMPREHENSIVE GUIDE**
  - What is Face Authentication? Complete explanation from basics
  - Mathematics behind face recognition (cosine similarity, embeddings)
  - ArcFace & InsightFace deep dive
  - Python Flask service code walkthrough (line by line)
  - Node.js integration service explanation
  - Complete authentication flows with diagrams
  - Security considerations & anti-spoofing
  - Interview Questions & Answers (17+ questions)
  - Troubleshooting guide
  
- **[FACE_AUTH_FRONTEND_AND_SETUP.md](./FACE_AUTH_FRONTEND_AND_SETUP.md)** - Frontend & Setup
  - FaceCapture React component explained
  - Complete setup instructions (step by step)
  - Dependencies & requirements
  - Configuration files
  - Production deployment guide
  - Common error messages & solutions

### Part 6: Security & Middleware
- **[6.1 Authentication Middleware](./24-auth-middleware.md)** - JWT authentication
- **[6.2 Security Best Practices](./25-security.md)** - CORS, validation, rate limiting

### Part 7: Advanced Topics
- **[7.1 Error Handling](./26-error-handling.md)** - Error management patterns
- **[7.2 Database Optimization](./27-database-optimization.md)** - Indexing and queries
- **[7.3 API Best Practices](./28-api-best-practices.md)** - REST conventions and tips

## 🎯 Learning Path

### For Beginners
Start with Part 1 and Part 2 to understand the foundation, then move to Part 3 to see how business logic works.

### For Intermediate Developers
Focus on Part 3 (Controllers) and Part 5 (Services) to understand the application logic and integrations.

### For Advanced Developers
Review Part 6 (Security) and Part 7 (Advanced Topics) for optimization and best practices.

## 🔑 Key Concepts Covered

- **MVC Architecture**: Model-View-Controller pattern implementation
- **RESTful API Design**: Proper HTTP methods and status codes
- **MongoDB & Mongoose**: Schema design and relationships
- **JWT Authentication**: Secure user authentication
- **AI Integration**: Google Gemini API for fact-checking
- **Face Authentication**: Biometric verification system
- **Real-time Features**: Debate system and live updates
- **Background Jobs**: Cron schedulers for maintenance
- **Error Handling**: Comprehensive error management
- **Security**: CORS, validation, sanitization

## 📖 How to Use This Documentation

Each document includes:
- **Purpose**: What the component does and why it exists
- **Code Snippets**: Real code from the project with line-by-line explanations
- **Function Details**: Parameters, return values, and usage
- **Sequential Flow**: How functions call each other across files
- **Best Practices**: Tips and common patterns
- **Related Files**: Links to other relevant documentation

## 🚀 Quick Start

If you want to understand a specific feature:
1. Start with the **Overview** document for that part
2. Follow the code examples sequentially
3. Check related files when functions from other modules are used
4. Refer back to the Models section when database operations are performed

## 💡 Tips for Reading

- Code snippets include file paths at the top
- Functions are explained before they're used
- Cross-references are provided for dependencies
- "Why we write this" sections explain the reasoning
- "What it does" sections explain the functionality
- "Important details" highlight key learning points

## 🔗 External Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [MongoDB Manual](https://docs.mongodb.com/)

---

**Last Updated**: January 23, 2026
**Backend Version**: 1.0.0
**Node Version**: 18+

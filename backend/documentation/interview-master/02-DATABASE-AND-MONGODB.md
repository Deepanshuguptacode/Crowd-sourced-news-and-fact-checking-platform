# Part 2 — Database & MongoDB

> 🏷️ **Level Guide**:
> - 📖 = Definition only is enough
> - 🏗️ = Architecture explanation needed  
> - 💻 = Code explanation may be asked

---

## Q1. What is a Database? What types exist?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> A database is where you **permanently store data**. Without a database, all data disappears when the server restarts.
>
> Two main types:
>
> | Type | Example | How data is stored |
> |------|---------|-------------------|
> | **SQL (Relational)** | MySQL, PostgreSQL | Tables with rows and columns (like Excel) |
> | **NoSQL** | MongoDB, Redis | Documents, key-value pairs, flexible format |

---

## Q2. What is MongoDB? Why did you choose it over SQL?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> MongoDB is a **NoSQL database** that stores data as **JSON-like documents** instead of rigid tables.
>
> Instead of rows in a table, MongoDB stores documents like this:
> ```json
> {
>   "name": "John",
>   "email": "john@example.com",
>   "profile": {
>     "bio": "Journalist",
>     "expertiseArea": "Politics"
>   }
> }
> ```
>
> **Why we chose MongoDB**:
> - Our data is flexible (news articles can have different numbers of screenshots, different fields)
> - JSON documents are natural to work with in JavaScript (Node.js)
> - It's easy to store nested data (comments inside news, evidence inside comments)
> - Scales easily as the platform grows

**🏗️ Architecture add-on** (if asked why NOT SQL):
> SQL databases require you to define the table structure upfront — if you add a new field, you need a "migration". MongoDB lets you add new fields anytime without breaking anything. For a fast-moving project like ours, that's a big advantage.

---

## Q3. What is Mongoose? Why use it?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> Mongoose is a library that sits **between Node.js and MongoDB**. It makes working with MongoDB easier and safer.
>
> **Without Mongoose**: You write raw MongoDB queries — no type checking, no validation, easy to make mistakes.  
> **With Mongoose**: You define a **schema** (a blueprint for your data) and Mongoose enforces it.

**💻 Code Level** (if asked to show):
```javascript
// Defining a schema with Mongoose
const newsSchema = new Schema({
  title: { type: String, required: true },   // Must have a title
  link: { type: String },
  isVerified: { type: Boolean, default: false },
  submittedBy: { type: ObjectId, ref: 'CommunityUser' }  // Links to a user
});

const News = mongoose.model('News', newsSchema);
```
> Now when you save a News document without a title, Mongoose automatically throws an error. This prevents bad data from entering your database.

---

## Q4. What is a Schema? What is a Model?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> - **Schema** = The **blueprint/template** that says what fields a document must have and what type they should be
> - **Model** = The **class/object** you use to actually create, read, update, delete documents
>
> Think of it like:
> - **Schema** = the form template (blank form with field names printed)
> - **Model** = the tool to fill in and submit the form
>
> In our project, we have schemas for: User, News, Comment, DebateRoom, AIVerdict, etc.

---

## Q5. What is the difference between SQL JOIN and Mongoose Populate?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> In SQL, when you have data in two tables that are related, you use **JOIN** to combine them in a query.
>
> In MongoDB + Mongoose, you use **populate()** to do the same thing — fill in referenced documents.
>
> **Example from our project**:
>
> A `Comment` document stores only the ID of the user who wrote it (not the full user data).  
> When you fetch a comment and want to show the user's name, you **populate** it:

**💻 Code Level** (if asked to show):
```javascript
// Without populate — you only get a user ID
const comment = await Comment.findById(commentId);
// comment.submittedBy = "507f1f77bcf86cd799439011"  ← just an ID

// With populate — you get the full user data
const comment = await Comment.findById(commentId).populate('submittedBy', 'name email');
// comment.submittedBy = { name: "John", email: "john@example.com" }
```

---

## Q6. What is Indexing in MongoDB?

**📖 Sufficient at Definition Level**

> **Simple Answer**:
>
> An **index** in a database is like the **index at the back of a book**. Instead of reading every page to find a topic, you look at the index and jump directly to the right page.
>
> Without an index, MongoDB has to scan **every document** in the collection to find the ones you want. This is very slow when you have thousands of documents.
>
> With an index, MongoDB can find documents almost instantly.
>
> **In our project**: We index fields like `email` (for user login) and `newsId` (for fetching comments of a news article) because those are searched very often.

---

## Q7. What is an Aggregation Pipeline?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> An aggregation pipeline is MongoDB's way to **process data in stages**, like an assembly line.
>
> Each stage does one thing to the data, then passes it to the next stage.
>
> **Example stages**:
> - `$match` → Filter documents (like WHERE in SQL)
> - `$group` → Group documents and calculate totals (like GROUP BY in SQL)
> - `$sort` → Sort the results
> - `$limit` → Take only first N results
> - `$lookup` → Join with another collection (like SQL JOIN)
>
> **In our project** (AI Verdict calculation):
> ```
> Step 1: Match → Get all comments for a specific news article
> Step 2: Group → Count how many are "in_favor" vs "against"
> Step 3: Sort → Sort expert comments by vote score
> Step 4: Limit → Take top 5 highest-voted comments
> Step 5: Return → Send results to the AI Verdict service
> ```

---

## Q8. What are the Data Models in your project?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> Our project has **13 Mongoose models**. Here are the key ones:

| Model | What it stores |
|-------|----------------|
| `NormalUser` | Basic users — name, email, password |
| `CommunityUser` | Users who submit news — has submittedNews list |
| `ExpertUser` | Verified experts — has expertiseArea, credentials |
| `Admin` | Platform admins |
| `News` | News article — title, link, screenshots, vote counts, credibility score |
| `TrendingNews` | Auto-scraped news from NDTV |
| `CommunityComment` | Comment from community user — has stance (in_favor/against/general) |
| `ExpertComment` | Comment from expert — can be voted on by other experts |
| `DebateRoom` | A discussion room — has topic, participants list |
| `DebateGroup` | A group of similar comments inside a debate room |
| `DebateComment` | A comment inside a debate room |
| `IdealCounter` | The best counter-argument for a debate group |
| `AIVerdict` | AI-generated fact-check result for a news article |

---

## Q9. What is the difference between embedding and referencing in MongoDB?

**🏗️ Architecture Level needed**

> **Simple Answer**:
>
> When two pieces of data are related, you have two choices in MongoDB:
>
> **Option 1: Embed** — put the related data INSIDE the document
> ```json
> {
>   "newsTitle": "New Policy Announced",
>   "comments": [
>     { "text": "This is fake!", "user": "John" },
>     { "text": "I agree", "user": "Jane" }
>   ]
> }
> ```
>
> **Option 2: Reference** — store only the ID, link to another collection
> ```json
> {
>   "newsTitle": "New Policy Announced",
>   "comments": ["507f1...001", "507f1...002"]   ← just IDs
> }
> ```
>
> **When to embed**: When the sub-data is small and always fetched together with the parent
> **When to reference**: When the sub-data is large, changes often, or is shared across many documents
>
> **In our project**: Comments are **referenced** (not embedded) in News because they can be very numerous and are fetched separately with filtering.

---

## 📝 Summary — What Level is Enough?

| Question | Definition ✅ | Architecture ✅ | Code ✅ |
|----------|:---:|:---:|:---:|
| What is a database? | ✅ | — | — |
| MongoDB vs SQL? | ✅ | ✅ | — |
| What is Mongoose? | ✅ | — | ✅ (basic) |
| Schema vs Model? | ✅ | — | — |
| Populate vs JOIN? | — | ✅ | ✅ |
| What is Indexing? | ✅ | — | — |
| Aggregation Pipeline? | — | ✅ | — |
| Your 13 data models? | — | ✅ | — |
| Embed vs Reference? | — | ✅ | — |

---

**Next: [Part 3 — Authentication & Security](./03-AUTHENTICATION-AND-SECURITY.md)**

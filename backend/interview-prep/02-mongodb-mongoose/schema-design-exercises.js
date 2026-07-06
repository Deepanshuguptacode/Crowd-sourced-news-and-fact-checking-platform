/**
 * Module 02: MongoDB & Mongoose Schema Design Exercises
 * 
 * Complete each exercise by implementing the required schema and queries.
 */

const mongoose = require('mongoose');

// ============================================================================
// EXERCISE 1: Basic User Schema with Validation
// ============================================================================

/**
 * Create a User schema with:
 * - name: required, 2-50 characters
 * - email: required, unique, valid email format
 * - age: optional, must be 13 or older
 * - createdAt: automatically set to current date
 * 
 * Add validation messages for each constraint.
 */
const userSchema = new mongoose.Schema({
  // Your code here
  
});

// ============================================================================
// EXERCISE 2: Blog Schema with References
// ============================================================================

/**
 * Design schemas for a blog system with:
 * 
 * Author schema:
 * - name, email, bio, avatar URL
 * 
 * BlogPost schema:
 * - title (required), content (required)
 * - author (reference to Author)
 * - tags (array of strings)
 * - published (boolean, default false)
 * - publishedAt (date, only set when published)
 * - viewCount (number, default 0)
 * - likes (array of user IDs who liked)
 * 
 * Comment schema:
 * - post (reference to BlogPost)
 * - author (reference to Author)
 * - content
 * - createdAt
 * - parentComment (self-reference for nested comments)
 */

const authorSchema = new mongoose.Schema({
  // Your code here
  
});

const blogPostSchema = new mongoose.Schema({
  // Your code here
  
});

const commentSchema = new mongoose.Schema({
  // Your code here
  
});

// ============================================================================
// EXERCISE 3: E-Commerce Schema Design
// ============================================================================

/**
 * Design schemas for an e-commerce system:
 * 
 * Product:
 * - name, description, price, category
 * - inventory count
 * - images (array of URLs)
 * - ratings array with user reference and score
 * - averageRating (virtual)
 * 
 * Order:
 * - user reference
 * - items array (product, quantity, price at time of purchase)
 * - total amount
 * - status (pending, paid, shipped, delivered, cancelled)
 * - shipping address (embedded)
 * - createdAt, updatedAt
 * 
 * Add methods to:
 * - Calculate order total
 * - Check product availability
 * - Update inventory on order
 */

const productSchema = new mongoose.Schema({
  // Your code here
  
});

// Add virtual for averageRating
// productSchema.virtual('averageRating').get(function() { ... });

const orderSchema = new mongoose.Schema({
  // Your code here
  
});

// Add method to calculate total
// orderSchema.methods.calculateTotal = function() { ... };

// ============================================================================
// EXERCISE 4: Implementing Soft Delete
// ============================================================================

/**
 * Add soft delete functionality to any schema.
 * Instead of actually deleting documents, mark them as deleted.
 * 
 * Requirements:
 * - Add isDeleted field (boolean, default false)
 * - Add deletedAt field (date)
 * - Add pre-find middleware to exclude deleted documents by default
 * - Add method to soft delete
 * - Add static method to find deleted documents
 * - Add method to restore deleted document
 */

function addSoftDelete(schema) {
  // Your code here
  // 1. Add isDeleted and deletedAt fields
  // 2. Add pre('find') middleware to filter out deleted
  // 3. Add pre('findOne') middleware
  // 4. Add instance method softDelete()
  // 5. Add static method findDeleted()
  // 6. Add instance method restore()
}

// Apply to a schema
// addSoftDelete(userSchema);

// ============================================================================
// EXERCISE 5: Query Implementations
// ============================================================================

/**
 * Implement the following query functions for a news platform.
 * Assume these models exist: News, User, Comment
 */

/**
 * Get paginated news articles with author populated
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @param {string} sortBy - Field to sort by ('createdAt', 'votes')
 * @returns {Promise<{news: Array, total: number, pages: number}>}
 */
async function getPaginatedNews(page, limit, sortBy = 'createdAt') {
  // Your code here
  // 1. Calculate skip
  // 2. Build sort object based on sortBy parameter
  // 3. Query with pagination, populate author
  // 4. Get total count for pagination metadata
  
}

/**
 * Get news article with all comments and comment authors populated
 * @param {string} newsId - News article ID
 * @returns {Promise<Object>} News with populated comments
 */
async function getNewsWithComments(newsId) {
  // Your code here
  // Use populate with nested populate to get comments and their authors
  
}

/**
 * Vote on a news article (upvote or downvote)
 * Should not allow duplicate votes from same user
 * @param {string} newsId - News article ID
 * @param {string} userId - User ID
 * @param {string} type - 'up' or 'down'
 * @returns {Promise<Object>} Updated news
 */
async function voteOnNews(newsId, userId, type) {
  // Your code here
  // Use $addToSet to prevent duplicate votes
  // Remove from opposite array if exists
  
}

/**
 * Get trending news (most votes in last 7 days)
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Top trending news
 */
async function getTrendingNews(limit = 10) {
  // Your code here
  // Use aggregation pipeline
  // Calculate vote score, sort, limit
  
}

/**
 * Search news by title and description
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching news articles
 */
async function searchNews(query, limit = 20) {
  // Your code here
  // Use $text search or $regex for partial matching
  // Sort by relevance if using text search
  
}

// ============================================================================
// EXERCISE 6: Aggregation Pipeline Practice
// ============================================================================

/**
 * Implement the following aggregations for an analytics dashboard
 * Assume Comment model with: newsId, author, content, createdAt, upvotes, downvotes
 */

/**
 * Get daily comment statistics for the last 30 days
 * Returns: [{ date: '2024-01-01', count: 5, avgVotes: 2.5 }, ...]
 */
async function getDailyCommentStats() {
  // Your code here
  // Match comments from last 30 days
  // Group by date (using $dateToString)
  // Calculate count and average votes per day
  // Sort by date
  
}

/**
 * Get top contributors by number of comments
 * @param {number} limit - Number of top contributors
 * @returns {Promise<Array>} Users with comment counts
 */
async function getTopContributors(limit = 10) {
  // Your code here
  // Group by author
  // Count comments per author
  // Populate user info using $lookup
  // Sort and limit
  
}

/**
 * Get news articles ranked by engagement score
 * Engagement = upvotes + downvotes + (comments * 2)
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Articles with engagement score
 */
async function getMostEngagingNews(limit = 10) {
  // Your code here
  // Project calculated engagement score
  // Sort by score
  // Limit results
  
}

// ============================================================================
// EXERCISE 7: Transaction Implementation
// ============================================================================

/**
 * Implement a safe user-to-user credit transfer using transactions
 * Requirements:
 * - Deduct from sender's balance
 * - Add to receiver's balance
 * - Create transaction record
 * - All must succeed or all must fail
 * 
 * @param {string} fromUserId - Sender ID
 * @param {string} toUserId - Receiver ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Object>} Transaction record
 */
async function transferCredits(fromUserId, toUserId, amount) {
  // Your code here
  // Start session
  // Start transaction
  // Check sender has sufficient balance
  // Deduct from sender
  // Add to receiver
  // Create transaction record
  // Commit or abort
  
}

// ============================================================================
// EXERCISE 8: Index Design
// ============================================================================

/**
 * Add appropriate indexes to the news platform schemas for these query patterns:
 * 
 * 1. Find news by status and sort by createdAt
 * 2. Find comments by newsId and sort by createdAt
 * 3. Find user by email (unique lookup)
 * 4. Text search across news title and description
 * 5. Find news by userId and status
 */

function addIndexesToSchemas() {
  // Your code here
  // newsSchema.index({ ... })
  // commentSchema.index({ ... })
  // userSchema.index({ ... })
  
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  userSchema,
  authorSchema,
  blogPostSchema,
  commentSchema,
  productSchema,
  orderSchema,
  addSoftDelete,
  getPaginatedNews,
  getNewsWithComments,
  voteOnNews,
  getTrendingNews,
  searchNews,
  getDailyCommentStats,
  getTopContributors,
  getMostEngagingNews,
  transferCredits,
  addIndexesToSchemas
};

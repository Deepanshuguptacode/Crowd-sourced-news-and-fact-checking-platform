/**
 * Module 01: Node.js & Express Coding Exercises
 * 
 * Instructions:
 * 1. Complete each exercise function
 * 2. Test your solutions
 * 3. Compare with solutions.md
 */

const express = require('express');

// ============================================================================
// EXERCISE 1: Basic Middleware Implementation
// ============================================================================

/**
 * Create a logging middleware that logs:
 * - HTTP method (GET, POST, etc.)
 * - Request path
 * - Timestamp
 * 
 * Example output: "[2024-01-15T10:30:00Z] GET /api/users"
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
function loggingMiddleware(req, res, next) {
  // Your code here
  // Hint: Use console.log() with new Date().toISOString()
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  next();
  
}

// ============================================================================
// EXERCISE 2: Rate Limiting Middleware
// ============================================================================

/**
 * Create a simple in-memory rate limiter.
 * Limit each IP to 5 requests per minute.
 * 
 * If limit exceeded, return 429 status with message "Rate limit exceeded".
 * 
 * Hint: Use a Map to store request counts per IP with timestamps.
 */
const requestCounts = new Map();

function rateLimitMiddleware(req, res, next) {
  // Your code here
  // Steps:
  // 1. Get client IP: req.ip or req.connection.remoteAddress
  // 2. Check if IP exists in requestCounts
  // 3. If count >= 5 and within 1 minute, return 429
  // 4. Otherwise, increment count and allow
  // 5. Reset count after 1 minute
  
}

// ============================================================================
// EXERCISE 3: Request Validation Middleware
// ============================================================================

/**
 * Create a validation middleware for user registration.
 * Required fields: email, password, name
 * 
 * Validation rules:
 * - email: must contain @ and .
 * - password: minimum 8 characters
 * - name: minimum 2 characters
 * 
 * Return 400 with specific error message if validation fails.
 */
function validateRegistration(req, res, next) {
  // Your code here
  // Destructure email, password, name from req.body
  // Check each field according to rules
  // Call next() if valid, otherwise return 400
  
}

// ============================================================================
// EXERCISE 4: Async Error Handler Wrapper
// ============================================================================

/**
 * Create a wrapper function that catches errors in async route handlers.
 * This eliminates the need for try/catch in every controller.
 * 
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  // Your code here
  // Return a function that wraps fn and catches any errors
  // Pass errors to Express error handling middleware
  
}

// ============================================================================
// EXERCISE 5: Response Formatter Middleware
// ============================================================================

/**
 * Create a middleware that adds a standardized response method to res object.
 * 
 * Usage in controllers:
 * res.success(200, data) => { success: true, data: ... }
 * res.error(400, message) => { success: false, message: ... }
 */
function responseFormatter(req, res, next) {
  // Your code here
  // Add res.success and res.error methods to response object
  
}

// ============================================================================
// EXERCISE 6: CORS Configuration
// ============================================================================

/**
 * Write a CORS configuration function that:
 * - Allows specific origins from an allowlist
 * - Allows credentials (cookies)
 * - Blocks requests from non-allowed origins with custom error
 * 
 * @returns {Object} CORS options object for cors middleware
 */
function createCorsConfig() {
  // Your code here
  // Define allowedOrigins array
  // Return cors options object with origin function
  
}

// ============================================================================
// EXERCISE 7: Route Parameter Validation
// ============================================================================

/**
 * Create a middleware that validates MongoDB ObjectId format in route params.
 * If invalid, return 400 with message "Invalid ID format".
 * 
 * @param {string} paramName - Name of the parameter to validate (e.g., 'id')
 */
function validateObjectId(paramName) {
  // Your code here
  // MongoDB ObjectId is 24 character hexadecimal string
  // Use regex: /^[0-9a-fA-F]{24}$/
  
}

// ============================================================================
// EXERCISE 8: Pagination Helper
// ============================================================================

/**
 * Create a middleware that extracts and validates pagination params from query.
 * Sets req.pagination = { page, limit, skip }
 * 
 * Default values: page=1, limit=10
 * Max limit: 100
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function paginationMiddleware(req, res, next) {
  // Your code here
  // Parse page and limit from req.query
  // Apply defaults and limits
  // Calculate skip = (page - 1) * limit
  // Attach to req.pagination
  
}

// ============================================================================
// EXERCISE 9: Request Timing Middleware
// ============================================================================

/**
 * Create middleware that measures request processing time.
 * Logs: "[METHOD] PATH - STATUS - X.XXXms"
 * 
 * Example: "[GET] /api/users - 200 - 45.230ms"
 */
function requestTimingMiddleware(req, res, next) {
  // Your code here
  // Record start time with Date.now() or performance.now()
  // Override res.end or use 'finish' event to log timing when response sent
  
}

// ============================================================================
// EXERCISE 10: Complete Route Handler
// ============================================================================

/**
 * Implement a complete news upload controller with:
 * - Input validation (title, description required)
 * - File upload handling (screenshot optional)
 * - Error handling with appropriate status codes
 * - Standardized response format
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadNewsController(req, res) {
  // Your code here
  // 1. Validate title and description exist
  // 2. Create news object with metadata
  // 3. Handle optional file upload (req.file)
  // 4. Save to database (simulate with console.log)
  // 5. Return appropriate response
  
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  loggingMiddleware,
  rateLimitMiddleware,
  validateRegistration,
  asyncHandler,
  responseFormatter,
  createCorsConfig,
  validateObjectId,
  paginationMiddleware,
  requestTimingMiddleware,
  uploadNewsController
};

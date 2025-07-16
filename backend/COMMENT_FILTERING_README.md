# Comment Filtering Integration - Documentation

## Overview
This document describes the comment filtering feature that has been integrated into the backend. The feature automatically groups and filters comments from both community users and expert users using AI-powered classification.

## Features
- **Automatic Comment Classification**: When comments are added, they are automatically processed and grouped
- **AI-Powered Grouping**: Uses Google Gemini AI (with fallback to keyword-based classification)
- **Support for Both Comment Types**: Works with both community and expert comments
- **Group Management**: Create, update, and delete comment groups
- **Filtering Statistics**: Get summary statistics about comment groups

## New Models

### CommentFilter
Located: `backend/models/CommentFilter.js`
- Stores processed comments with filtering metadata
- Links original comments to groups
- Tracks comment type (community/expert)

### CommentGroup  
Located: `backend/models/CommentFilter.js`
- Represents grouped comments with similar themes
- Contains group labels and metadata
- Maintains references to grouped comments

## New Services

### LLM Service
Located: `backend/services/llmService.js`
- Handles AI-powered comment classification
- Integrates with Google Gemini AI
- Falls back to keyword-based classification

### Comment Filtering Service
Located: `backend/services/commentFilteringService.js`
- Main service for processing comments
- Manages group creation and updates
- Provides data retrieval methods

## New Controllers

### CommentFilterController
Located: `backend/controllers/CommentFilterController.js`
- Handles API requests for filtered comments
- Manages group operations
- Provides filtering statistics

## New Routes

### Comment Filter Routes
Located: `backend/routes/commentFilterRoute.js`

**Base URL**: `/comment-filter`

#### Available Endpoints:

1. **GET /grouped/:newsId**
   - Get all grouped comments for a news item
   - Returns: Array of groups with their comments

2. **GET /filtered/:newsId**
   - Get all filtered comments for a news item
   - Returns: Array of all processed comments

3. **GET /group/:groupId**
   - Get comments for a specific group
   - Returns: Group object with comments

4. **PUT /group/:groupId/label**
   - Update a group's label
   - Body: `{ "newLabel": "New Label" }`

5. **DELETE /group/:groupId**
   - Delete a comment group
   - Returns: Success confirmation

6. **GET /summary/:newsId**
   - Get filtering summary statistics
   - Returns: Statistics about groups and comments

## Integration Points

### Updated Controllers
The existing `CommentsController.js` has been updated to:
- Automatically process comments through the filtering service
- Maintain backward compatibility
- Handle filtering errors gracefully

### Updated Models
The existing comment models (`Comments.js`) have been extended with:
- `isProcessedForFiltering`: Boolean flag
- `filterGroupId`: Reference to comment group

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install @google/genai
```

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Database
The new models will be automatically created when the server starts.

## Usage Examples

### Add a Comment (Automatic Filtering)
```javascript
// POST /news/community-comment
{
  "newsId": "news_id_here",
  "comment": "This is a great article about climate change!"
}
// Comment will be automatically processed and grouped
```

### Get Grouped Comments
```javascript
// GET /comment-filter/grouped/news_id_here
// Response:
{
  "message": "Grouped comments fetched successfully",
  "groups": [
    {
      "_id": "group_id",
      "label": "Climate Change Discussion",
      "comments": [...],
      "createdAt": "2025-01-16T..."
    }
  ],
  "totalGroups": 1
}
```

### Get Filtering Summary
```javascript
// GET /comment-filter/summary/news_id_here
// Response:
{
  "summary": {
    "totalGroups": 3,
    "totalComments": 15,
    "groupedComments": 12,
    "ungroupedComments": 3,
    "communityComments": 10,
    "expertComments": 5
  }
}
```

## Error Handling
- The filtering process is designed to fail gracefully
- If AI classification fails, it falls back to keyword-based grouping
- Original comment creation is never blocked by filtering failures
- All errors are logged for debugging

## Future Enhancements
1. **Advanced Embeddings**: Add vector embeddings for better similarity matching
2. **Custom Group Rules**: Allow manual group creation rules
3. **Sentiment Analysis**: Add sentiment scoring to groups
4. **Real-time Updates**: WebSocket integration for live group updates
5. **Export Features**: Export grouped comments in various formats

## Testing
Test the integration by:
1. Adding various types of comments to a news item
2. Checking if they are properly grouped via API endpoints
3. Verifying that similar comments are grouped together
4. Testing group management operations

## Troubleshooting

### Common Issues:
1. **AI Classification Not Working**: Check GEMINI_API_KEY in environment
2. **Groups Not Created**: Verify database connection and model registration
3. **Performance Issues**: Consider implementing background processing for large comment volumes

### Debug Steps:
1. Check server logs for filtering errors
2. Verify API key is valid and has quota
3. Test with simple keyword-based classification first
4. Ensure all required packages are installed

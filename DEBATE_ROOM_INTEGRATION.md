# Debate Room Integration Guide

This guide explains how the debate room functionality has been integrated into the main application.

## Backend Integration

### New Models
- **DebateRoom**: Main debate room model with room metadata
- **DebateGroup**: Groups of related comments by stance (for/against)
- **DebateComment**: Individual comments within debate rooms

### New Services
- **classifyComment**: AI-powered comment classification using Google GenAI
- **generateGroupContent**: AI-powered group title and description generation
- **findCounterGroup**: AI-powered counter-group matching for debates

### New Controllers
- **DebateRoomController**: Handles CRUD operations for debate rooms
- **DebateGroupController**: Manages debate groups and their relationships
- **DebateCommentController**: Handles comment creation, likes, and group management

### New Routes
- `POST /debate-rooms` - Create new debate room
- `GET /debate-rooms` - Get all debate rooms (with pagination and search)
- `GET /debate-rooms/:roomId` - Get specific debate room
- `POST /debate-rooms/:roomId/join` - Join a debate room
- `POST /debate-rooms/:roomId/leave` - Leave a debate room
- `PUT /debate-rooms/:roomId` - Update debate room (creator only)
- `DELETE /debate-rooms/:roomId` - Delete debate room (creator only)
- `GET /debate-rooms/:roomId/groups` - Get debate groups for room
- `POST /debate-rooms/:roomId/comments` - Create new comment
- `GET /debate-rooms/:roomId/comments` - Get all comments grouped by stance
- `POST /debate-rooms/:roomId/comments/:commentId/like` - Like a comment
- `POST /debate-rooms/:roomId/comments/:commentId/dislike` - Dislike a comment
- `PUT /debate-rooms/:roomId/groups/:groupId/regenerate` - Regenerate group content
- `POST /debate-rooms/:roomId/groups/relink` - Relink counter-groups

## Frontend Integration

### New Components
- **DebateRoomsList**: Main page showing all available debate rooms
- **DebateRoom**: Individual debate room interface with real-time commenting
- **DebateRoomAPI**: API service for all debate room operations

### New Routes
- `/debate-rooms` - Main debate rooms listing page
- `/debate-room/:roomId` - Individual debate room page

### Updated Components
- **RightBar**: Added "Debate Rooms" navigation option
- **App.jsx**: Added new routes for debate room functionality

## Key Features

### AI-Powered Comment Grouping
- Comments are automatically grouped by similar themes using Google GenAI
- Groups are given AI-generated titles and descriptions
- Counter-groups are automatically matched for opposing viewpoints

### Real-time Debate Interface
- Two-column layout showing "For" and "Against" arguments
- Comments are grouped by AI into thematic clusters
- Like/dislike functionality for individual comments
- Expandable/collapsible group views

### Room Management
- Create debate rooms with custom topics and descriptions
- Join/leave rooms with participant limits
- Search and filter debate rooms
- Creator permissions for room management

## Environment Setup

### Required Environment Variables
Add the following to your backend `.env` file:
```
GEMINI_API_KEY=your_google_genai_api_key
```

### Dependencies
Backend dependencies (already included):
- `@google/genai` - Google GenAI for AI features
- `mongoose` - MongoDB integration
- `express` - Web framework

Frontend dependencies (already included):
- `@heroicons/react` - UI icons
- `react-router-dom` - Routing
- `react-toastify` - Notifications
- `axios` - HTTP client

## Usage

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend server**:
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**:
   - Main app: http://localhost:5173
   - Navigate to "Debate Rooms" from the sidebar
   - Create or join existing debate rooms

## AI Features

### Comment Classification
- New comments are automatically classified into existing thematic groups
- If no suitable group exists, a new group is created
- Group labels are updated to reflect the collective content

### Group Content Generation
- AI generates meaningful titles and descriptions for comment groups
- Content is regenerated as new comments are added
- Groups maintain coherent thematic focus

### Counter-Group Matching
- AI identifies the best opposing group for each argument cluster
- Groups are bidirectionally linked for balanced debate view
- Confidence scores help determine match quality

## Database Schema

### DebateRoom
```javascript
{
  title: String,
  description: String,
  topic: String,
  creator: ObjectId (ref: User),
  isActive: Boolean,
  participants: [ObjectId] (ref: User),
  maxParticipants: Number,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### DebateGroup
```javascript
{
  debateRoomId: ObjectId (ref: DebateRoom),
  label: String,
  title: String,
  description: String,
  stance: String (enum: 'for', 'against'),
  commentIds: [ObjectId] (ref: DebateComment),
  counterGroupId: ObjectId (ref: DebateGroup),
  displayOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### DebateComment
```javascript
{
  debateRoomId: ObjectId (ref: DebateRoom),
  text: String,
  stance: String (enum: 'for', 'against'),
  groupId: ObjectId (ref: DebateGroup),
  author: ObjectId (ref: User),
  authorName: String,
  likes: [ObjectId] (ref: User),
  dislikes: [ObjectId] (ref: User),
  createdAt: Date
}
```

## Security Considerations

- All routes require authentication
- Users must join rooms before commenting
- Only room creators can update/delete rooms
- Comment authors and likes are tracked for accountability
- Input validation and sanitization on all endpoints

## Future Enhancements

- Real-time updates using WebSockets
- Push notifications for new comments
- Advanced AI moderation features
- Export debate summaries
- Mobile app integration
- Voice-to-text comment input

# Debate Room Quick Start Guide

## 🚀 Getting Started

### 1. Backend Setup

1. **Install dependencies** (already done):
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Run database migration**:
   ```bash
   node migrate-debate-rooms.js
   ```

4. **Start the backend server**:
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. **Install dependencies** (already done):
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend server**:
   ```bash
   npm run dev
   ```

### 3. Testing the Integration

1. **Run backend tests**:
   ```bash
   cd backend
   node test-debate-integration.js
   ```

2. **Access the application**:
   - Open: http://localhost:5173
   - Login or create an account
   - Click "Debate Rooms" in the sidebar

## 🎯 How to Use Debate Rooms

### Creating a Debate Room

1. Navigate to "Debate Rooms" from the sidebar
2. Click "Create Debate Room"
3. Fill in the form:
   - **Title**: Name of your debate room
   - **Topic**: Main subject for debate
   - **Description**: Detailed explanation
   - **Max Participants**: Room capacity (default: 50)
   - **Tags**: Comma-separated keywords
4. Click "Create Room"

### Joining a Debate Room

1. Browse available debate rooms
2. Click "Join Debate" or "View Room"
3. Select your stance: "For" or "Against"
4. Start commenting!

### AI-Powered Features

- **Smart Grouping**: Your comments are automatically grouped with similar arguments
- **Counter-Arguments**: AI matches opposing viewpoints for balanced debate
- **Dynamic Titles**: Group titles update as new comments are added
- **Intelligent Matching**: Similar arguments are clustered together

### Managing Debate Rooms

**For Room Creators:**
- Edit room details
- Delete rooms (removes all associated data)
- View participant statistics

**For All Users:**
- Join/leave rooms
- Like/dislike comments
- View debate statistics

## 🔧 Features Overview

### Core Functionality
- ✅ Create and manage debate rooms
- ✅ AI-powered comment grouping
- ✅ Real-time comment system
- ✅ Like/dislike functionality
- ✅ Participant management
- ✅ Search and filtering
- ✅ Counter-argument matching

### AI Integration
- ✅ Google GenAI for comment classification
- ✅ Automatic group title generation
- ✅ Smart counter-group matching
- ✅ Content summarization
- ✅ Thematic clustering

### User Experience
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Mobile-friendly interface
- ✅ Dark mode support
- ✅ Intuitive navigation

## 📊 Database Collections

### DebateRoom
- Stores room metadata and settings
- Tracks participants and creator
- Manages room state (active/inactive)

### DebateGroup
- AI-generated argument clusters
- Links to counter-arguments
- Maintains display order

### DebateComment
- Individual user comments
- Tracks likes/dislikes
- Links to parent group and room

## 🔐 Security Features

- **Authentication**: All routes require valid user tokens
- **Authorization**: Room creators have special permissions
- **Participation**: Users must join rooms before commenting
- **Data Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevents spam and abuse

## 🚨 Troubleshooting

### Common Issues

1. **AI Features Not Working**:
   - Check GEMINI_API_KEY in .env file
   - Verify Google GenAI API access
   - Check console for error messages

2. **Comments Not Grouping**:
   - Ensure AI service is running
   - Check network connectivity
   - Verify API key permissions

3. **Database Connection Issues**:
   - Confirm MongoDB is running
   - Check connection string in .env
   - Verify database permissions

### Error Messages

- `"AI service error"`: Check GEMINI_API_KEY
- `"Failed to join debate room"`: Check room capacity
- `"Debate room not found"`: Room may be deleted
- `"Authentication required"`: Login again

## 📈 Performance Tips

1. **Database Indexes**: Run migration script for optimal performance
2. **AI Caching**: Consider caching AI responses for better speed
3. **Pagination**: Use pagination for large debate rooms
4. **Lazy Loading**: Comments load as needed
5. **Debouncing**: Search queries are debounced

## 🔄 Future Enhancements

- Real-time updates with WebSockets
- Voice-to-text comment input
- Advanced AI moderation
- Mobile app integration
- Export debate summaries
- Push notifications

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify environment variables
3. Test with the provided test scripts
4. Review the integration documentation

---

**Happy Debating! 🎉**

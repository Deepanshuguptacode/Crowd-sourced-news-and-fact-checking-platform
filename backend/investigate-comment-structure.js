const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { CommentGroup } = require('./models/CommentFilter');
const { CommunityComment } = require('./models/Comments');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Investigate comment structure for frontend
const investigateCommentStructure = async () => {
  try {
    await connectDB();
    
    console.log('🔍 INVESTIGATING COMMENT STRUCTURE FOR FRONTEND\n');
    
    // 1. Check basic comment group structure
    console.log('1. BASIC COMMENT GROUP STRUCTURE:');
    const basicGroup = await CommentGroup.findOne({ comments: { $ne: [] } });
    console.log(`   Group: "${basicGroup.label}"`);
    console.log(`   Comments array: ${basicGroup.comments.length} IDs`);
    console.log(`   Sample comment ID: ${basicGroup.comments[0]}`);
    
    // 2. Check simple population
    console.log('\n2. SIMPLE POPULATION TEST:');
    const simplePopulated = await CommentGroup.findOne({ comments: { $ne: [] } })
      .populate('comments');
    
    if (simplePopulated.comments[0]) {
      const comment = simplePopulated.comments[0];
      console.log('   Comment fields available:');
      console.log(`   - _id: ${comment._id}`);
      console.log(`   - comment: "${comment.comment?.substring(0, 50) || 'NO TEXT'}..."`);
      console.log(`   - commenter: ${comment.commenter}`);
      console.log(`   - newsId: ${comment.newsId}`);
      console.log(`   - createdAt: ${comment.createdAt}`);
    }
    
    // 3. Check nested population (comment -> commenter)
    console.log('\n3. NESTED POPULATION TEST:');
    const nestedPopulated = await CommentGroup.findOne({ comments: { $ne: [] } })
      .populate({
        path: 'comments',
        populate: {
          path: 'commenter',
          select: 'name username email'
        }
      });
    
    if (nestedPopulated.comments[0]) {
      const comment = nestedPopulated.comments[0];
      console.log('   Nested populated data:');
      console.log(`   - Comment text: "${comment.comment?.substring(0, 50) || 'NO TEXT'}..."`);
      console.log(`   - Commenter object:`, comment.commenter);
      
      if (comment.commenter) {
        console.log(`     - Name: ${comment.commenter.name || 'NO NAME'}`);
        console.log(`     - Username: ${comment.commenter.username || 'NO USERNAME'}`);
        console.log(`     - ID: ${comment.commenter._id || 'NO ID'}`);
      }
    }
    
    // 4. Check if commenter IDs are valid
    console.log('\n4. COMMENTER ID VALIDATION:');
    const testComment = await CommunityComment.findOne({});
    if (testComment) {
      console.log(`   Sample comment commenter ID: ${testComment.commenter}`);
      
      // Try to find the commenter
      const CommunityUser = require('./models/CommunityUser');
      const commenter = await CommunityUser.findById(testComment.commenter);
      
      console.log(`   Commenter exists: ${!!commenter}`);
      if (commenter) {
        console.log(`   Commenter name: ${commenter.name}`);
        console.log(`   Commenter username: ${commenter.username}`);
      }
    }
    
    // 5. Full structure for frontend
    console.log('\n5. FULL FRONTEND-READY STRUCTURE:');
    const fullStructure = await CommentGroup.find({ comments: { $ne: [] } })
      .populate({
        path: 'comments',
        select: 'comment commenter createdAt newsId',
        populate: {
          path: 'commenter',
          select: 'name username email'
        }
      })
      .limit(2);
    
    fullStructure.forEach((group, index) => {
      console.log(`\n   Group ${index + 1}: "${group.label}"`);
      console.log(`   Comments: ${group.comments.length}`);
      
      group.comments.slice(0, 2).forEach((comment, commentIndex) => {
        console.log(`     Comment ${commentIndex + 1}:`);
        console.log(`       Text: "${comment.comment?.substring(0, 40) || 'NO TEXT'}..."`);
        console.log(`       Commenter Name: ${comment.commenter?.name || 'NO NAME'}`);
        console.log(`       Commenter Username: ${comment.commenter?.username || 'NO USERNAME'}`);
        console.log(`       Created: ${comment.createdAt || 'NO DATE'}`);
      });
    });
    
    // 6. Check for common issues
    console.log('\n6. COMMON ISSUES CHECK:');
    
    // Check if any comments have null/undefined text
    const commentsWithoutText = await CommunityComment.countDocuments({
      $or: [
        { comment: null },
        { comment: undefined },
        { comment: '' }
      ]
    });
    console.log(`   Comments without text: ${commentsWithoutText}`);
    
    // Check if any comments have invalid commenter references
    const commentsWithoutCommenter = await CommunityComment.countDocuments({
      $or: [
        { commenter: null },
        { commenter: undefined }
      ]
    });
    console.log(`   Comments without commenter: ${commentsWithoutCommenter}`);
    
    console.log('\n✅ Investigation complete!');
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run investigation
investigateCommentStructure();
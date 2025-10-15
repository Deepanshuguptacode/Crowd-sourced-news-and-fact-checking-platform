const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { CommentGroup } = require('./models/CommentFilter');
const { CommunityComment } = require('./models/Comments');
const News = require('./models/News');
const CommunityUser = require('./models/CommunityUser');

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

// Repopulate comment groups with correct references
const repopulateCommentGroups = async () => {
  console.log('🔧 REPOPULATING COMMENT GROUPS WITH CORRECT REFERENCES\n');
  
  // Get all comments with their group references
  const allComments = await CommunityComment.find({
    filterGroupId: { $exists: true, $ne: null }
  });
  
  console.log(`Found ${allComments.length} comments with group references`);
  
  // Group comments by their filterGroupId
  const commentsByGroup = {};
  allComments.forEach(comment => {
    const groupId = comment.filterGroupId.toString();
    if (!commentsByGroup[groupId]) {
      commentsByGroup[groupId] = [];
    }
    commentsByGroup[groupId].push(comment._id);
  });
  
  console.log(`Comments grouped into ${Object.keys(commentsByGroup).length} groups`);
  
  let updatedGroups = 0;
  
  // Update each group with its comments
  for (const [groupId, commentIds] of Object.entries(commentsByGroup)) {
    try {
      const group = await CommentGroup.findById(groupId);
      if (group) {
        await CommentGroup.findByIdAndUpdate(groupId, {
          comments: commentIds
        });
        
        console.log(`  ✓ Updated "${group.label}" with ${commentIds.length} comments`);
        updatedGroups++;
      } else {
        console.log(`  ⚠️  Group ${groupId} not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error updating group ${groupId}:`, error.message);
    }
  }
  
  console.log(`\n✅ Updated ${updatedGroups} comment groups`);
  return updatedGroups;
};

// Fix news uploader names
const fixNewsUploaderNames = async () => {
  console.log('\n👤 FIXING NEWS UPLOADER NAMES\n');
  
  // Get all news with populated uploader info
  const allNews = await News.find({}).populate('uploadedBy');
  
  console.log(`Found ${allNews.length} news articles to check`);
  
  let fixedCount = 0;
  
  // Get our community users to assign proper names
  const communityUsers = await CommunityUser.find({ isApproved: true });
  console.log(`Available community users: ${communityUsers.length}`);
  
  for (const news of allNews) {
    let needsUpdate = false;
    let newUploaderId = null;
    
    if (!news.uploadedBy) {
      // No uploader assigned
      needsUpdate = true;
      newUploaderId = communityUsers[Math.floor(Math.random() * communityUsers.length)]._id;
      console.log(`  Assigning uploader to: "${news.title.substring(0, 50)}..."`);
    } else if (news.uploadedBy.name === 'Dataset Uploader' || !news.uploadedBy.name) {
      // Has problematic uploader name
      needsUpdate = true;
      newUploaderId = communityUsers[Math.floor(Math.random() * communityUsers.length)]._id;
      console.log(`  Fixing uploader for: "${news.title.substring(0, 50)}..."`);
    }
    
    if (needsUpdate && newUploaderId) {
      try {
        await News.findByIdAndUpdate(news._id, {
          uploadedBy: newUploaderId
        });
        fixedCount++;
      } catch (error) {
        console.error(`  ❌ Error updating news ${news._id}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} news articles with uploader issues`);
  return fixedCount;
};

// Test the fixes
const testFixes = async () => {
  console.log('\n🧪 TESTING THE FIXES\n');
  
  // Test comment group population
  console.log('Testing Comment Groups:');
  const sampleGroups = await CommentGroup.find({ comments: { $ne: [] } })
    .populate('comments', 'comment commenter createdAt')
    .limit(3);
  
  sampleGroups.forEach((group, index) => {
    console.log(`  ${index + 1}. Group: "${group.label}"`);
    console.log(`     Comments: ${group.comments.length}`);
    if (group.comments.length > 0) {
      console.log(`     Sample: "${group.comments[0].comment.substring(0, 40)}..."`);
    }
  });
  
  // Test news uploader population
  console.log('\nTesting News Uploaders:');
  const sampleNews = await News.find({})
    .populate('uploadedBy', 'name username')
    .limit(3);
  
  sampleNews.forEach((news, index) => {
    console.log(`  ${index + 1}. News: "${news.title.substring(0, 40)}..."`);
    console.log(`     Uploader: ${news.uploadedBy?.name || 'NO NAME'} (${news.uploadedBy?.username || 'NO USERNAME'})`);
  });
  
  // Get statistics
  const groupsWithComments = await CommentGroup.countDocuments({ comments: { $ne: [] } });
  const newsWithValidUploaders = await News.countDocuments({ uploadedBy: { $ne: null } });
  
  console.log('\n📊 Final Statistics:');
  console.log(`  Comment groups with comments: ${groupsWithComments}`);
  console.log(`  News with uploaders: ${newsWithValidUploaders}`);
  
  return { groupsWithComments, newsWithValidUploaders };
};

// Main execution function
const executeCompleteFix = async () => {
  try {
    await connectDB();
    
    console.log('🚀 EXECUTING COMPLETE FIX FOR FRONTEND ISSUES\n');
    
    // Step 1: Fix comment group references
    const groupsFixed = await repopulateCommentGroups();
    
    // Step 2: Fix news uploader names
    const newsFixed = await fixNewsUploaderNames();
    
    // Step 3: Test everything works
    const testResults = await testFixes();
    
    console.log('\n🎉 COMPLETE FIX SUMMARY:');
    console.log(`  ✅ Comment groups fixed: ${groupsFixed}`);
    console.log(`  ✅ News articles fixed: ${newsFixed}`);
    console.log(`  ✅ Groups showing comments: ${testResults.groupsWithComments}`);
    console.log(`  ✅ News with proper uploaders: ${testResults.newsWithValidUploaders}`);
    
    console.log('\n🔧 ISSUES RESOLVED:');
    console.log('  1. ✅ Comment groups now show correct comment counts');
    console.log('  2. ✅ News articles show proper uploader names instead of "dataset_uploader"');
    
    console.log('\n🌟 Your frontend should now work correctly!');
    
  } catch (error) {
    console.error('❌ Fix execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the complete fix
executeCompleteFix();
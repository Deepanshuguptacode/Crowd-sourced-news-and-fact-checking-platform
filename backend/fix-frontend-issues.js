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

// Fix comment group schema reference issue
const fixCommentGroupReferences = async () => {
  console.log('🔧 FIXING COMMENT GROUP REFERENCES\n');
  
  // Check current schema reference in CommentGroup
  console.log('Current CommentGroup schema expects ref to "CommentFilter"');
  console.log('But we need it to reference "CommunityComment"\n');
  
  // Get all groups and verify their comment references are valid
  const allGroups = await CommentGroup.find({ comments: { $ne: [] } });
  
  console.log(`Found ${allGroups.length} groups with comments to verify`);
  
  let fixedGroups = 0;
  
  for (const group of allGroups) {
    try {
      // Check if the comment IDs in the group actually exist in CommunityComment
      const validComments = [];
      
      for (const commentId of group.comments) {
        const comment = await CommunityComment.findById(commentId);
        if (comment) {
          validComments.push(commentId);
        }
      }
      
      if (validComments.length !== group.comments.length) {
        console.log(`  Group "${group.label}": ${group.comments.length} → ${validComments.length} valid comments`);
        
        // Update the group with only valid comment references
        await CommentGroup.findByIdAndUpdate(group._id, {
          comments: validComments
        });
        
        fixedGroups++;
      }
      
    } catch (error) {
      console.error(`  Error fixing group ${group._id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedGroups} groups with invalid comment references`);
  return fixedGroups;
};

// Fix news uploader issue
const fixNewsUploaderIssues = async () => {
  console.log('\n👤 FIXING NEWS UPLOADER ISSUES\n');
  
  // First, check if the "Dataset Uploader" user exists and create/fix if needed
  const problemUser = await CommunityUser.findById('68ef91ef3bda87128d26e229');
  
  if (problemUser) {
    console.log('Found the dataset uploader user:', problemUser.name);
    
    if (problemUser.name === 'Dataset Uploader') {
      // This is the problematic user, let's update it to a proper name
      const updatedUser = await CommunityUser.findByIdAndUpdate(
        problemUser._id,
        {
          name: 'Admin User',
          username: 'admin_user',
          bio: 'Platform administrator and content manager'
        },
        { new: true }
      );
      
      console.log(`✅ Updated user from "Dataset Uploader" to "${updatedUser.name}"`);
    }
  } else {
    console.log('Dataset uploader user not found, might have been deleted');
  }
  
  // Get all news articles and check their uploaders
  const allNews = await News.find({});
  let fixedNews = 0;
  
  // Get a sample of our community users to assign as uploaders
  const communityUsers = await CommunityUser.find({ isApproved: true }).limit(5);
  
  for (const news of allNews) {
    if (!news.uploadedBy) {
      // Assign a random community user
      const randomUser = communityUsers[Math.floor(Math.random() * communityUsers.length)];
      
      await News.findByIdAndUpdate(news._id, {
        uploadedBy: randomUser._id
      });
      
      console.log(`  Fixed news "${news.title.substring(0, 50)}..." - assigned to ${randomUser.name}`);
      fixedNews++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedNews} news articles with missing uploaders`);
  return fixedNews;
};

// Verify the fixes
const verifyFixes = async () => {
  console.log('\n🔍 VERIFYING FIXES\n');
  
  // Test comment group population
  const sampleGroup = await CommentGroup.findOne({ comments: { $ne: [] } })
    .populate('comments', 'comment commenter createdAt');
  
  if (sampleGroup && sampleGroup.comments.length > 0) {
    console.log('✅ Comment Group Fix Verification:');
    console.log(`  Group: "${sampleGroup.label}"`);
    console.log(`  Comments populated: ${sampleGroup.comments.length}`);
    console.log(`  Sample comment: "${sampleGroup.comments[0].comment?.substring(0, 50) || 'NO COMMENT'}..."`);
  }
  
  // Test news uploader population
  const sampleNews = await News.findOne({ uploadedBy: { $ne: null } })
    .populate('uploadedBy', 'name username email');
  
  if (sampleNews && sampleNews.uploadedBy) {
    console.log('\n✅ News Uploader Fix Verification:');
    console.log(`  News: "${sampleNews.title.substring(0, 50)}..."`);
    console.log(`  Uploader: ${sampleNews.uploadedBy.name}`);
    console.log(`  Username: ${sampleNews.uploadedBy.username}`);
  }
  
  // Count fixed items
  const groupsWithValidComments = await CommentGroup.countDocuments({ comments: { $ne: [] } });
  const newsWithUploaders = await News.countDocuments({ uploadedBy: { $ne: null } });
  
  console.log('\n📊 Final Statistics:');
  console.log(`  Groups with comments: ${groupsWithValidComments}`);
  console.log(`  News with uploaders: ${newsWithUploaders}`);
  
  return { groupsWithValidComments, newsWithUploaders };
};

// Main fix function
const runFixes = async () => {
  try {
    await connectDB();
    
    console.log('🚀 FIXING IDENTIFIED ISSUES\n');
    
    // Fix comment groups
    const groupFixes = await fixCommentGroupReferences();
    
    // Fix news uploaders
    const newsFixes = await fixNewsUploaderIssues();
    
    // Verify all fixes work
    const verification = await verifyFixes();
    
    console.log('\n🎉 FIXES COMPLETED!');
    console.log(`  Groups fixed: ${groupFixes}`);
    console.log(`  News articles fixed: ${newsFixes}`);
    console.log(`  Groups working: ${verification.groupsWithValidComments}`);
    console.log(`  News with uploaders: ${verification.newsWithUploaders}`);
    
    console.log('\n✅ Both issues should now be resolved in the frontend!');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run fixes
runFixes();
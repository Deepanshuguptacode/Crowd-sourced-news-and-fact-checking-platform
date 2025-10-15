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

// Check comment group issues
const investigateCommentGroupIssues = async () => {
  console.log('🔍 INVESTIGATING COMMENT GROUP ISSUES\n');
  
  // 1. Check groups with comments
  const groupsWithComments = await CommentGroup.find({ 
    comments: { $exists: true, $ne: [] } 
  });
  
  console.log(`Groups with comments array populated: ${groupsWithComments.length}`);
  
  if (groupsWithComments.length > 0) {
    const sampleGroup = groupsWithComments[0];
    console.log(`Sample group: "${sampleGroup.label}"`);
    console.log(`Comments in array: ${sampleGroup.comments.length}`);
    
    // Try to populate the comments
    const populatedGroup = await CommentGroup.findById(sampleGroup._id)
      .populate('comments');
    
    console.log(`Populated comments: ${populatedGroup.comments.length}`);
    
    if (populatedGroup.comments.length > 0) {
      console.log(`Sample comment text: "${populatedGroup.comments[0].comment?.substring(0, 50) || 'NO TEXT'}..."`);
    }
  }
  
  // 2. Check if comments still have group references
  const commentsWithGroups = await CommunityComment.countDocuments({
    filterGroupId: { $exists: true, $ne: null }
  });
  
  console.log(`\nComments with group references: ${commentsWithGroups}`);
  
  return { groupsWithComments: groupsWithComments.length, commentsWithGroups };
};

// Check news uploader issues
const investigateNewsUploaderIssues = async () => {
  console.log('\n📰 INVESTIGATING NEWS UPLOADER ISSUES\n');
  
  // 1. Check news with uploader info
  const allNews = await News.find({}).populate('uploadedBy', 'name username email');
  
  console.log(`Total news articles: ${allNews.length}`);
  
  // Check uploader distribution
  const uploaderStats = {};
  allNews.forEach(news => {
    const uploaderName = news.uploadedBy?.name || news.uploadedBy?.username || 'No uploader';
    uploaderStats[uploaderName] = (uploaderStats[uploaderName] || 0) + 1;
  });
  
  console.log('\nUploader distribution:');
  Object.entries(uploaderStats).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} articles`);
  });
  
  // 2. Check if dataset_uploader user exists
  const datasetUploader = await CommunityUser.findOne({ 
    $or: [
      { username: 'dataset_uploader' },
      { name: 'dataset_uploader' },
      { email: { $regex: 'dataset', $options: 'i' } }
    ]
  });
  
  console.log(`\nDataset uploader user found: ${datasetUploader ? 'YES' : 'NO'}`);
  if (datasetUploader) {
    console.log(`  Name: ${datasetUploader.name}`);
    console.log(`  Username: ${datasetUploader.username}`);
    console.log(`  Email: ${datasetUploader.email}`);
  }
  
  // 3. Sample news with uploader details
  console.log('\nSample news with uploader details:');
  allNews.slice(0, 3).forEach((news, index) => {
    console.log(`  ${index + 1}. Title: "${news.title.substring(0, 50)}..."`);
    console.log(`     Uploader ID: ${news.uploadedBy?._id || news.uploadedBy || 'NO ID'}`);
    console.log(`     Uploader Name: ${news.uploadedBy?.name || 'NO NAME'}`);
    console.log('');
  });
  
  return { uploaderStats, datasetUploaderExists: !!datasetUploader };
};

// Main investigation function
const runInvestigation = async () => {
  try {
    await connectDB();
    
    const groupIssues = await investigateCommentGroupIssues();
    const newsIssues = await investigateNewsUploaderIssues();
    
    console.log('\n🔧 ISSUES IDENTIFIED:');
    
    if (groupIssues.groupsWithComments === 0) {
      console.log('❌ ISSUE 1: No comment groups have populated comments arrays');
    } else if (groupIssues.commentsWithGroups === 0) {
      console.log('❌ ISSUE 1: Comments are not linked to groups');
    } else {
      console.log('✅ Comment groups appear to be working correctly');
    }
    
    if (Object.keys(newsIssues.uploaderStats).includes('dataset_uploader')) {
      console.log('❌ ISSUE 2: News articles showing "dataset_uploader" as uploader');
    } else {
      console.log('✅ News uploaders appear to be correct');
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run investigation
runInvestigation();
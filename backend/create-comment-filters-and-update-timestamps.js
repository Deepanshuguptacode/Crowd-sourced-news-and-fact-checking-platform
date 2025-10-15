const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Import models
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');
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

// Function to generate random date in 2025
const generateRandomDate2025 = () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-12-31T23:59:59Z');
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
};

// Function to create CommentFilter entries for all comments
const createCommentFilters = async () => {
  console.log('🔍 Creating CommentFilter entries for all comments...\n');
  
  // Get all comments with their group references
  const allComments = await CommunityComment.find({
    filterGroupId: { $exists: true, $ne: null }
  }).populate('filterGroupId');
  
  console.log(`Found ${allComments.length} comments to process for CommentFilter creation`);
  
  const commentFilters = [];
  let processedCount = 0;
  
  for (const comment of allComments) {
    try {
      // Check if CommentFilter already exists for this comment
      const existingFilter = await CommentFilter.findOne({
        originalCommentId: comment._id
      });
      
      if (existingFilter) {
        console.log(`  ⚠️  CommentFilter already exists for comment ${comment._id}`);
        commentFilters.push(existingFilter);
        continue;
      }
      
      // Create new CommentFilter entry
      const commentFilter = new CommentFilter({
        text: comment.comment,
        originalCommentId: comment._id,
        commentType: 'community', // All our comments are community comments
        newsId: comment.newsId,
        createdAt: generateRandomDate2025(), // Random date in 2025
        embedding: [], // Empty for now, can be populated later with ML embeddings
        groupId: comment.filterGroupId._id
      });
      
      const savedFilter = await commentFilter.save();
      commentFilters.push(savedFilter);
      processedCount++;
      
      if (processedCount % 20 === 0) {
        console.log(`  ✓ Processed ${processedCount}/${allComments.length} comments`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error creating CommentFilter for comment ${comment._id}:`, error.message);
    }
  }
  
  console.log(`\n✅ CommentFilter creation completed: ${processedCount} new filters created`);
  return commentFilters;
};

// Function to update all comment timestamps to random 2025 dates
const updateCommentTimestamps = async () => {
  console.log('\n📅 Updating comment timestamps to random 2025 dates...\n');
  
  // Get all comments
  const allComments = await CommunityComment.find({});
  console.log(`Found ${allComments.length} comments to update timestamps`);
  
  const updates = [];
  let updatedCount = 0;
  
  for (const comment of allComments) {
    try {
      const randomDate = generateRandomDate2025();
      
      // Update the comment with new timestamp
      await CommunityComment.findByIdAndUpdate(comment._id, {
        createdAt: randomDate
      });
      
      updates.push({
        commentId: comment._id,
        oldDate: comment.createdAt,
        newDate: randomDate,
        commentText: comment.comment.substring(0, 50) + '...'
      });
      
      updatedCount++;
      
      if (updatedCount % 25 === 0) {
        console.log(`  ✓ Updated ${updatedCount}/${allComments.length} comment timestamps`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error updating timestamp for comment ${comment._id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Timestamp update completed: ${updatedCount} comments updated`);
  return updates;
};

// Function to update CommentGroup timestamps
const updateCommentGroupTimestamps = async () => {
  console.log('\n📅 Updating CommentGroup timestamps to random 2025 dates...\n');
  
  const allGroups = await CommentGroup.find({});
  console.log(`Found ${allGroups.length} groups to update timestamps`);
  
  let updatedCount = 0;
  
  for (const group of allGroups) {
    try {
      const randomDate = generateRandomDate2025();
      
      await CommentGroup.findByIdAndUpdate(group._id, {
        createdAt: randomDate
      });
      
      updatedCount++;
      
    } catch (error) {
      console.error(`  ❌ Error updating timestamp for group ${group._id}:`, error.message);
    }
  }
  
  console.log(`✅ Group timestamp update completed: ${updatedCount} groups updated`);
  return updatedCount;
};

// Function to verify the CommentFilter integration
const verifyCommentFilters = async () => {
  console.log('\n🔍 Verifying CommentFilter integration...\n');
  
  // Check total CommentFilters
  const totalFilters = await CommentFilter.countDocuments({});
  const totalComments = await CommunityComment.countDocuments({});
  
  console.log(`Total CommentFilters: ${totalFilters}`);
  console.log(`Total CommunityComments: ${totalComments}`);
  
  // Check filters with group references
  const filtersWithGroups = await CommentFilter.countDocuments({
    groupId: { $exists: true, $ne: null }
  });
  
  console.log(`CommentFilters with group references: ${filtersWithGroups}`);
  
  // Sample verification
  const sampleFilter = await CommentFilter.findOne({})
    .populate('groupId', 'label newsId')
    .populate('originalCommentId', 'comment commenter');
  
  if (sampleFilter) {
    console.log('\n📋 Sample CommentFilter:');
    console.log(`  ID: ${sampleFilter._id}`);
    console.log(`  Text: "${sampleFilter.text.substring(0, 80)}..."`);
    console.log(`  Original Comment ID: ${sampleFilter.originalCommentId._id}`);
    console.log(`  Group: ${sampleFilter.groupId?.label || 'No group'}`);
    console.log(`  News ID: ${sampleFilter.newsId}`);
    console.log(`  Created At: ${sampleFilter.createdAt}`);
    console.log(`  Comment Type: ${sampleFilter.commentType}`);
  }
  
  return {
    totalFilters,
    totalComments,
    filtersWithGroups,
    integrationComplete: totalFilters > 0 && filtersWithGroups > 0
  };
};

// Function to generate date distribution statistics
const analyzeDateDistribution = async () => {
  console.log('\n📊 Analyzing date distribution...\n');
  
  // Get comment date distribution
  const commentDates = await CommunityComment.aggregate([
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  console.log('Comment distribution by month (2025):');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  commentDates.forEach(item => {
    if (item._id.year === 2025) {
      console.log(`  ${monthNames[item._id.month - 1]} ${item._id.year}: ${item.count} comments`);
    }
  });
  
  // Get earliest and latest dates
  const dateRange = await CommunityComment.aggregate([
    {
      $group: {
        _id: null,
        earliest: { $min: '$createdAt' },
        latest: { $max: '$createdAt' }
      }
    }
  ]);
  
  if (dateRange.length > 0) {
    console.log(`\nDate range: ${dateRange[0].earliest.toISOString()} to ${dateRange[0].latest.toISOString()}`);
  }
  
  return { commentDates, dateRange };
};

// Main execution function
const executeCommentFilterIntegration = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting CommentFilter Integration and Timestamp Updates...\n');
    
    // Step 1: Create CommentFilter entries
    const commentFilters = await createCommentFilters();
    
    // Step 2: Update comment timestamps
    const timestampUpdates = await updateCommentTimestamps();
    
    // Step 3: Update CommentGroup timestamps
    const groupUpdates = await updateCommentGroupTimestamps();
    
    // Step 4: Verify integration
    const verification = await verifyCommentFilters();
    
    // Step 5: Analyze date distribution
    const dateAnalysis = await analyzeDateDistribution();
    
    // Generate comprehensive summary
    const summary = {
      executionDate: new Date().toISOString(),
      commentFilters: {
        created: commentFilters.length,
        totalInDatabase: verification.totalFilters,
        withGroupReferences: verification.filtersWithGroups
      },
      timestampUpdates: {
        commentsUpdated: timestampUpdates.length,
        groupsUpdated: groupUpdates,
        year: 2025,
        dateRange: dateAnalysis.dateRange[0] || null
      },
      verification: verification,
      dateDistribution: dateAnalysis.commentDates,
      success: verification.integrationComplete && timestampUpdates.length > 0
    };
    
    // Save summary and sample data
    fs.writeFileSync(
      './comment_filter_integration_summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    // Save sample timestamp updates (first 10)
    fs.writeFileSync(
      './timestamp_updates_sample.json',
      JSON.stringify(timestampUpdates.slice(0, 10), null, 2)
    );
    
    console.log('\n🎉 COMMENT FILTER INTEGRATION COMPLETED!\n');
    console.log('📊 FINAL SUMMARY:');
    console.log(`   CommentFilters Created: ${summary.commentFilters.created}`);
    console.log(`   Comments Timestamp Updated: ${summary.timestampUpdates.commentsUpdated}`);
    console.log(`   Groups Timestamp Updated: ${summary.timestampUpdates.groupsUpdated}`);
    console.log(`   All dates in year: ${summary.timestampUpdates.year}`);
    console.log(`   Integration Success: ${summary.success ? '✅' : '❌'}`);
    
    console.log('\n📁 FILES GENERATED:');
    console.log('   ✓ comment_filter_integration_summary.json - Complete execution summary');
    console.log('   ✓ timestamp_updates_sample.json - Sample timestamp changes');
    
    if (summary.success) {
      console.log('\n🚀 ALL TASKS COMPLETED SUCCESSFULLY! ✅');
      console.log('\n🔧 SYSTEM CAPABILITIES NOW INCLUDE:');
      console.log('   • CommentFilter entries for advanced filtering');
      console.log('   • Randomized timestamps across 2025');
      console.log('   • Complete integration with CommentGroups');
      console.log('   • Ready for ML-based comment analysis');
    }
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
if (require.main === module) {
  executeCommentFilterIntegration();
}

module.exports = { 
  createCommentFilters, 
  updateCommentTimestamps, 
  verifyCommentFilters, 
  executeCommentFilterIntegration 
};
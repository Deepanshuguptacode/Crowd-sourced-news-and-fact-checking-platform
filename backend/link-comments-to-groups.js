const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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

// Function to find comment by text content (since we need to match JSON data to DB data)
const findCommentByText = async (commentText, newsId) => {
  try {
    // Try exact match first
    let comment = await CommunityComment.findOne({ 
      comment: commentText.trim(),
      newsId: newsId 
    });
    
    if (!comment) {
      // Try partial match if exact doesn't work
      comment = await CommunityComment.findOne({ 
        comment: { $regex: commentText.trim().substring(0, 50), $options: 'i' },
        newsId: newsId 
      });
    }
    
    return comment;
  } catch (error) {
    console.error('Error finding comment:', error);
    return null;
  }
};

// Function to link comments to groups
const linkCommentsToGroups = async () => {
  console.log('🔗 Starting comment-to-group linking process...\n');
  
  const commentsDir = './real-news-comments';
  const commentFiles = fs.readdirSync(commentsDir).filter(file => 
    file.startsWith('news_') && file.endsWith('_comments_corrected.json')
  );
  
  let totalGroupsUpdated = 0;
  let totalCommentsLinked = 0;
  const linkingResults = [];
  
  for (const filename of commentFiles) {
    const filePath = path.join(commentsDir, filename);
    console.log(`📄 Processing: ${filename}`);
    
    try {
      const commentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const newsId = commentData.newsId;
      
      console.log(`   News ID: ${newsId}`);
      console.log(`   Total comments in file: ${commentData.totalComments}`);
      
      const fileResults = {
        filename: filename,
        newsId: newsId,
        newsTitle: commentData.newsTitle.substring(0, 50) + '...',
        groupsProcessed: 0,
        commentsLinked: 0,
        errors: []
      };
      
      // Process each comment group
      const commentGroups = commentData.commentGroups;
      
      for (const [groupKey, comments] of Object.entries(commentGroups)) {
        console.log(`     Processing group: ${groupKey} (${comments.length} comments)`);
        
        try {
          // Find the corresponding CommentGroup in database
          const commentGroup = await CommentGroup.findOne({
            newsId: newsId,
            label: mapGroupKeyToLabel(groupKey)
          });
          
          if (!commentGroup) {
            const error = `CommentGroup not found for ${groupKey} in news ${newsId}`;
            console.log(`       ❌ ${error}`);
            fileResults.errors.push(error);
            continue;
          }
          
          const linkedCommentIds = [];
          
          // Process each comment in the group
          for (let i = 0; i < comments.length; i++) {
            const commentObj = comments[i];
            const commentText = commentObj.comment;
            
            // Find the comment in database
            const dbComment = await findCommentByText(commentText, newsId);
            
            if (dbComment) {
              linkedCommentIds.push(dbComment._id);
              
              // Update the comment to reference this group
              await CommunityComment.findByIdAndUpdate(dbComment._id, {
                filterGroupId: commentGroup._id,
                isProcessedForFiltering: true
              });
              
              console.log(`       ✓ Linked comment ${i + 1}/${comments.length}`);
            } else {
              const error = `Comment not found in DB: ${commentText.substring(0, 50)}...`;
              console.log(`       ⚠️  ${error}`);
              fileResults.errors.push(error);
            }
          }
          
          // Update the CommentGroup with all linked comment IDs
          if (linkedCommentIds.length > 0) {
            await CommentGroup.findByIdAndUpdate(commentGroup._id, {
              $addToSet: { comments: { $each: linkedCommentIds } }
            });
            
            console.log(`       ✅ Updated group ${groupKey} with ${linkedCommentIds.length} comments`);
            fileResults.commentsLinked += linkedCommentIds.length;
            totalCommentsLinked += linkedCommentIds.length;
          }
          
          fileResults.groupsProcessed++;
          totalGroupsUpdated++;
          
        } catch (error) {
          const errorMsg = `Error processing group ${groupKey}: ${error.message}`;
          console.log(`       ❌ ${errorMsg}`);
          fileResults.errors.push(errorMsg);
        }
      }
      
      console.log(`   ✅ File completed: ${fileResults.groupsProcessed} groups, ${fileResults.commentsLinked} comments linked`);
      linkingResults.push(fileResults);
      
    } catch (error) {
      console.error(`   ❌ Error processing file ${filename}:`, error.message);
      linkingResults.push({
        filename: filename,
        error: error.message,
        groupsProcessed: 0,
        commentsLinked: 0
      });
    }
  }
  
  return {
    totalFiles: commentFiles.length,
    totalGroupsUpdated,
    totalCommentsLinked,
    results: linkingResults
  };
};

// Function to map group keys from JSON to database labels
const mapGroupKeyToLabel = (groupKey) => {
  const mappings = {
    'strongSupport': 'Strong Support',
    'factualValidation': 'Factual Validation',
    'importance': 'Importance & Relevance',
    'credibleSources': 'Credible Sources',
    'publicInterest': 'Public Interest',
    'wellResearched': 'Well-researched',
    'timelyCoverage': 'Timely Coverage',
    'balancedReporting': 'Balanced Reporting',
    'biasedReporting': 'Biased Reporting',
    'incompleteInfo': 'Incomplete Information',
    'incompleteInformation': 'Incomplete Information', // Add this mapping
    'misleadingHeadlines': 'Misleading Headlines',
    'sensationalism': 'Sensationalism'
  };
  
  return mappings[groupKey] || groupKey;
};

// Verification function
const verifyLinking = async () => {
  console.log('\n🔍 Verifying comment-group linking...\n');
  
  // Check CommentGroups with comments
  const groupsWithComments = await CommentGroup.find({ 
    comments: { $exists: true, $ne: [] } 
  });
  
  console.log(`Groups with linked comments: ${groupsWithComments.length}`);
  
  // Check comments with group references
  const commentsWithGroups = await CommunityComment.find({ 
    filterGroupId: { $exists: true, $ne: null } 
  });
  
  console.log(`Comments with group references: ${commentsWithGroups.length}`);
  
  // Sample verification
  if (groupsWithComments.length > 0) {
    const sampleGroup = groupsWithComments[0];
    console.log(`\nSample group: ${sampleGroup.label}`);
    console.log(`Comments in group: ${sampleGroup.comments.length}`);
    
    if (sampleGroup.comments.length > 0) {
      const sampleComment = await CommunityComment.findById(sampleGroup.comments[0]);
      if (sampleComment) {
        console.log(`Sample comment text: ${sampleComment.comment.substring(0, 100)}...`);
        console.log(`Comment filterGroupId: ${sampleComment.filterGroupId}`);
      }
    }
  }
  
  return {
    groupsWithComments: groupsWithComments.length,
    commentsWithGroups: commentsWithGroups.length,
    totalGroups: await CommentGroup.countDocuments({}),
    totalComments: await CommunityComment.countDocuments({})
  };
};

// Main execution function
const executeCommentGroupLinking = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting Comment-Group Linking Process...\n');
    
    // Step 1: Link comments to groups
    const linkingResults = await linkCommentsToGroups();
    
    // Step 2: Verify the linking
    const verificationResults = await verifyLinking();
    
    // Generate comprehensive summary
    const summary = {
      executionDate: new Date().toISOString(),
      linkingResults: linkingResults,
      verificationResults: verificationResults,
      success: linkingResults.totalCommentsLinked > 0 && verificationResults.groupsWithComments > 0
    };
    
    // Save summary
    fs.writeFileSync(
      './comment_group_linking_summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n🎉 COMMENT-GROUP LINKING COMPLETED!\n');
    console.log('📊 SUMMARY:');
    console.log(`   Files Processed: ${linkingResults.totalFiles}`);
    console.log(`   Groups Updated: ${linkingResults.totalGroupsUpdated}`);
    console.log(`   Comments Linked: ${linkingResults.totalCommentsLinked}`);
    console.log(`   Groups with Comments: ${verificationResults.groupsWithComments}`);
    console.log(`   Comments with Group Refs: ${verificationResults.commentsWithGroups}`);
    
    console.log('\n📁 Generated: comment_group_linking_summary.json');
    
    if (summary.success) {
      console.log('\n✅ SUCCESS: Comments successfully linked to their respective groups!');
    } else {
      console.log('\n⚠️  WARNING: Some issues may have occurred during linking.');
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
  executeCommentGroupLinking();
}

module.exports = { 
  linkCommentsToGroups, 
  verifyLinking, 
  executeCommentGroupLinking 
};
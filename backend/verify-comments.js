const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Import models
const { CommunityComment } = require('./models/Comments');
const News = require('./models/News');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

const verifyComments = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for comment verification');

    // Load real news data
    const realNewsData = JSON.parse(fs.readFileSync('inserted_real_news_entities.json', 'utf8'));
    
    let totalComments = 0;
    let inFavorTotal = 0;
    let againstTotal = 0;
    
    console.log('=== COMMENT VERIFICATION RESULTS ===\n');

    for (let i = 0; i < realNewsData.length; i++) {
      const newsItem = realNewsData[i];
      console.log(`📰 News ${i + 1}: ${newsItem.title.substring(0, 50)}...`);
      
      // Get comments for this news
      const comments = await CommunityComment.find({ newsId: newsItem._id })
        .populate('commenter', 'name username')
        .populate('expertVotes.expert', 'name profession');
      
      console.log(`   Total comments: ${comments.length}`);
      
      // Count by stance (based on group names)
      const inFavorGroups = ['strongSupport', 'factualValidation', 'importance', 'credibleSources', 'publicInterest', 'wellResearched', 'timelyCoverage', 'balancedReporting'];
      const againstGroups = ['biasedReporting', 'incompleteInformation', 'misleadingHeadlines', 'sensationalism'];
      
      const inFavorCount = comments.filter(c => inFavorGroups.includes(c.groupName)).length;
      const againstCount = comments.filter(c => againstGroups.includes(c.groupName)).length;
      
      console.log(`   In favor: ${inFavorCount}`);
      console.log(`   Against: ${againstCount}`);
      
      // Analyze voting patterns
      let totalUpvotes = 0;
      let totalDownvotes = 0;
      
      comments.forEach(comment => {
        totalUpvotes += comment.upvoteCount;
        totalDownvotes += comment.downvoteCount;
        
        if (inFavorGroups.includes(comment.groupName) && comment.upvoteCount >= 3) {
          console.log(`   ✓ In-favor comment has ${comment.upvoteCount} upvotes (requirement: >=3)`);
        }
      });
      
      console.log(`   Total upvotes: ${totalUpvotes}`);
      console.log(`   Total downvotes: ${totalDownvotes}`);
      
      // Group analysis
      const groupCounts = {};
      comments.forEach(comment => {
        groupCounts[comment.groupName] = (groupCounts[comment.groupName] || 0) + 1;
      });
      
      console.log('   Comment groups:');
      Object.entries(groupCounts).forEach(([group, count]) => {
        console.log(`     ${group}: ${count} comments`);
      });
      
      totalComments += comments.length;
      inFavorTotal += inFavorCount;
      againstTotal += againstCount;
      
      console.log('');
    }
    
    console.log('=== OVERALL STATISTICS ===');
    console.log(`📊 Total news articles: ${realNewsData.length}`);
    console.log(`📊 Total comments: ${totalComments}`);
    console.log(`📊 Total in-favor comments: ${inFavorTotal}`);
    console.log(`📊 Total against comments: ${againstTotal}`);
    console.log(`📊 Average comments per news: ${(totalComments / realNewsData.length).toFixed(1)}`);
    
    // Verify database integrity
    const totalDbComments = await CommunityComment.countDocuments();
    const communityUsers = await CommunityUser.countDocuments();
    const expertUsers = await ExpertUser.countDocuments();
    
    console.log('\n=== DATABASE INTEGRITY ===');
    console.log(`🗄️  Total comments in database: ${totalDbComments}`);
    console.log(`👥 Community users: ${communityUsers}`);
    console.log(`🎓 Expert users: ${expertUsers}`);
    
    // Sample comment analysis
    console.log('\n=== SAMPLE COMMENT ANALYSIS ===');
    const sampleComment = await CommunityComment.findOne()
      .populate('commenter', 'name username')
      .populate('expertVotes.expert', 'name profession');
    
    if (sampleComment) {
      console.log(`📝 Sample Comment:`);
      console.log(`   By: ${sampleComment.commenter.name} (${sampleComment.commenter.username})`);
      console.log(`   Group: ${sampleComment.groupName}`);
      console.log(`   Stance: ${sampleComment.stance}`);
      console.log(`   Upvotes: ${sampleComment.upvoteCount}`);
      console.log(`   Downvotes: ${sampleComment.downvoteCount}`);
      console.log(`   Expert votes: ${sampleComment.expertVotes.length}`);
      console.log(`   Evidence links: ${sampleComment.evidenceLinks.length}`);
      
      if (sampleComment.expertVotes.length > 0) {
        console.log('   Expert vote sample:');
        const expertVote = sampleComment.expertVotes[0];
        console.log(`     Expert: ${expertVote.expert.name} (${expertVote.expert.profession})`);
        console.log(`     Vote: ${expertVote.voteType}`);
        console.log(`     Explanation: ${expertVote.explanation.substring(0, 50)}...`);
      }
      
      if (sampleComment.evidenceLinks.length > 0) {
        console.log('   Evidence link sample:');
        const evidenceLink = sampleComment.evidenceLinks[0];
        console.log(`     URL: ${evidenceLink.url}`);
        console.log(`     Explanation: ${evidenceLink.explanation.substring(0, 50)}...`);
      }
    }
    
    // Update summary file with correct counts
    const correctedSummary = {
      processedDate: new Date().toISOString(),
      totalNewsProcessed: realNewsData.length,
      totalCommentsAdded: totalComments,
      totalInFavorComments: inFavorTotal,
      totalAgainstComments: againstTotal,
      communityUsersUsed: 5,
      expertUsersUsed: 5,
      filesGenerated: 12,
      averageCommentsPerNews: (totalComments / realNewsData.length).toFixed(1),
      verificationCompleted: true
    };
    
    fs.writeFileSync(
      'comment_verification_summary.json',
      JSON.stringify(correctedSummary, null, 2)
    );
    
    console.log('\n✅ Verification completed successfully!');
    console.log('📁 Updated summary saved to: comment_verification_summary.json');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

verifyComments();
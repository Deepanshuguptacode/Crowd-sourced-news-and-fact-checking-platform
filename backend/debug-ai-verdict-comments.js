const mongoose = require('mongoose');
const { CommunityComment } = require('./models/Comments');
const News = require('./models/News');
const AIVerdict = require('./models/AIVerdict');

async function debugAIVerdictComments() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://deepanshugupta650:deepanshuguptacode@voxveritas.lst4gcg.mongodb.net/?retryWrites=true&w=majority&appName=VoxVeritas');
    console.log('✅ Connected to MongoDB Atlas');

    // Get the first fake news article
    const fakeNewsIds = ["68ef91ef3bda87128d26e22c", "68ef91ef3bda87128d26e22e", "68ef91ef3bda87128d26e232"];
    
    for (const newsId of fakeNewsIds.slice(0, 1)) { // Just check one article
      console.log(`\n🔍 ANALYZING COMMENTS FOR NEWS: ${newsId}`);
      console.log('='.repeat(60));

      const news = await News.findById(newsId);
      console.log(`📰 News: "${news.title.substring(0, 50)}..."`);

      // Get all comments
      const allComments = await CommunityComment.find({ newsId });
      console.log(`\n📊 TOTAL COMMENTS: ${allComments.length}`);

      // Group by stance
      const inFavorComments = allComments.filter(c => c.stance === 'in_favor');
      const againstComments = allComments.filter(c => c.stance === 'against');
      const generalComments = allComments.filter(c => c.stance === 'general');

      console.log(`📈 IN_FAVOR: ${inFavorComments.length}`);
      console.log(`📉 AGAINST: ${againstComments.length}`);
      console.log(`📊 GENERAL: ${generalComments.length}`);

      // Check scores and expert votes
      console.log('\n🏆 IN_FAVOR COMMENTS DETAILS:');
      inFavorComments.forEach((comment, index) => {
        console.log(`   ${index + 1}. Score: ${comment.score}, Expert Votes: ${comment.expertVotes.length}`);
        console.log(`      Text: "${comment.comment.substring(0, 60)}..."`);
        console.log(`      Evidence Links: ${comment.evidenceLinks.length}`);
        console.log(`      Group ID: ${comment.filterGroupId || 'None'}`);
      });

      console.log('\n🛡️  AGAINST COMMENTS DETAILS:');
      againstComments.forEach((comment, index) => {
        console.log(`   ${index + 1}. Score: ${comment.score}, Expert Votes: ${comment.expertVotes.length}`);
        console.log(`      Text: "${comment.comment.substring(0, 60)}..."`);
        console.log(`      Evidence Links: ${comment.evidenceLinks.length}`);
        console.log(`      Group ID: ${comment.filterGroupId || 'None'}`);
      });

      // Check existing AI verdict
      const existingVerdict = await AIVerdict.findOne({ newsId });
      if (existingVerdict) {
        console.log('\n🤖 EXISTING AI VERDICT:');
        console.log(`   Created: ${existingVerdict.createdAt}`);
        console.log(`   Score: ${existingVerdict.score}`);
        console.log(`   Top In Favor: ${existingVerdict.topComments?.inFavor?.length || 0}`);
        console.log(`   Top Against: ${existingVerdict.topComments?.against?.length || 0}`);
        
        if (existingVerdict.topComments?.inFavor) {
          console.log('\n👍 VERDICT IN_FAVOR COMMENTS:');
          existingVerdict.topComments.inFavor.forEach((comment, index) => {
            console.log(`   ${index + 1}. Score: ${comment.score}`);
            console.log(`      Text: "${comment.commentText.substring(0, 60)}..."`);
          });
        }
        
        if (existingVerdict.topComments?.against) {
          console.log('\n👎 VERDICT AGAINST COMMENTS:');
          existingVerdict.topComments.against.forEach((comment, index) => {
            console.log(`   ${index + 1}. Score: ${comment.score}`);
            console.log(`      Text: "${comment.commentText.substring(0, 60)}..."`);
          });
        }
      } else {
        console.log('\n⚠️  No AI verdict found for this article');
      }

      // Check comment groups
      const CommentGroup = require('./models/CommentFilter').CommentGroup;
      const groups = await CommentGroup.find({ newsId });
      console.log(`\n📚 COMMENT GROUPS: ${groups.length}`);
      groups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.groupName} - ${group.comments.length} comments`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugAIVerdictComments();
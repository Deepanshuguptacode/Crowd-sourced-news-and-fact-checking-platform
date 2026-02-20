const mongoose = require('mongoose');
const { CommunityComment, ExpertComment } = require('../models/Comments');
require('dotenv').config();

/**
 * Migration script to add stance and score fields to existing comments
 * This script will:
 * 1. Add default stance 'general' to comments without stance
 * 2. Calculate and set score = upvoteCount - downvoteCount
 * 3. Ensure consistency across all comments
 */

const migrateComments = async () => {
  try {
    console.log('🔄 Starting comment migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    console.log('✅ Connected to database');

    // Migrate Community Comments
    console.log('\n📝 Migrating Community Comments...');
    const communityComments = await CommunityComment.find({});
    console.log(`Found ${communityComments.length} community comments`);

    let communityUpdated = 0;
    for (const comment of communityComments) {
      let needsUpdate = false;
      
      // Add stance if missing
      if (!comment.stance) {
        comment.stance = 'general';
        needsUpdate = true;
      }
      
      // Calculate score if missing or incorrect
      const calculatedScore = (comment.upvoteCount || 0) - (comment.downvoteCount || 0);
      if (comment.score !== calculatedScore) {
        comment.score = calculatedScore;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await comment.save();
        communityUpdated++;
        console.log(`  ✓ Updated community comment ${comment._id} - stance: ${comment.stance}, score: ${comment.score}`);
      }
    }
    
    console.log(`📊 Community Comments: ${communityUpdated} updated out of ${communityComments.length}`);

    // Migrate Expert Comments
    console.log('\n🎓 Migrating Expert Comments...');
    const expertComments = await ExpertComment.find({});
    console.log(`Found ${expertComments.length} expert comments`);

    let expertUpdated = 0;
    for (const comment of expertComments) {
      let needsUpdate = false;
      
      // Add stance if missing
      if (!comment.stance) {
        comment.stance = 'general';
        needsUpdate = true;
      }
      
      // Calculate score if missing or incorrect
      const calculatedScore = (comment.upvoteCount || 0) - (comment.downvoteCount || 0);
      if (comment.score !== calculatedScore) {
        comment.score = calculatedScore;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await comment.save();
        expertUpdated++;
        console.log(`  ✓ Updated expert comment ${comment._id} - stance: ${comment.stance}, score: ${comment.score}`);
      }
    }
    
    console.log(`📊 Expert Comments: ${expertUpdated} updated out of ${expertComments.length}`);

    // Summary
    console.log('\n🎉 Migration Summary:');
    console.log(`  • Community Comments: ${communityUpdated}/${communityComments.length} updated`);
    console.log(`  • Expert Comments: ${expertUpdated}/${expertComments.length} updated`);
    console.log(`  • Total Comments: ${communityUpdated + expertUpdated}/${communityComments.length + expertComments.length} updated`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const commentsWithoutStance = await Promise.all([
      CommunityComment.countDocuments({ stance: { $exists: false } }),
      ExpertComment.countDocuments({ stance: { $exists: false } })
    ]);
    
    const commentsWithoutScore = await Promise.all([
      CommunityComment.countDocuments({ score: { $exists: false } }),
      ExpertComment.countDocuments({ score: { $exists: false } })
    ]);

    console.log(`  • Comments without stance: ${commentsWithoutStance[0] + commentsWithoutStance[1]}`);
    console.log(`  • Comments without score: ${commentsWithoutScore[0] + commentsWithoutScore[1]}`);

    if (commentsWithoutStance[0] + commentsWithoutStance[1] === 0 && 
        commentsWithoutScore[0] + commentsWithoutScore[1] === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Some comments may still need manual review');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Advanced migration with specific stance assignments
const migrateCommentsWithStanceInference = async () => {
  try {
    console.log('🔄 Starting advanced comment migration with stance inference...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
    console.log('✅ Connected to database');

    // Define keywords for stance inference
    const inFavorKeywords = [
      'excellent', 'great', 'good', 'support', 'agree', 'correct', 'true', 'accurate',
      'credible', 'reliable', 'well-researched', 'informative', 'valuable', 'important',
      'right', 'proper', 'beneficial', 'helpful', 'positive', 'necessary'
    ];

    const againstKeywords = [
      'wrong', 'false', 'fake', 'misleading', 'incorrect', 'disagree', 'oppose',
      'biased', 'unreliable', 'suspicious', 'doubtful', 'questionable', 'problematic',
      'bad', 'poor', 'terrible', 'dangerous', 'harmful', 'negative', 'concerning'
    ];

    const inferStanceFromComment = (commentText) => {
      const text = commentText.toLowerCase();
      
      const inFavorCount = inFavorKeywords.filter(keyword => text.includes(keyword)).length;
      const againstCount = againstKeywords.filter(keyword => text.includes(keyword)).length;
      
      if (inFavorCount > againstCount && inFavorCount > 0) {
        return 'in_favor';
      } else if (againstCount > inFavorCount && againstCount > 0) {
        return 'against';
      } else {
        return 'general';
      }
    };

    // Migrate Community Comments with stance inference
    console.log('\n📝 Migrating Community Comments with stance inference...');
    const communityComments = await CommunityComment.find({});
    
    let communityUpdated = 0;
    for (const comment of communityComments) {
      let needsUpdate = false;
      
      // Infer stance if missing
      if (!comment.stance || comment.stance === 'general') {
        const inferredStance = inferStanceFromComment(comment.comment);
        comment.stance = inferredStance;
        needsUpdate = true;
      }
      
      // Calculate score
      const calculatedScore = (comment.upvoteCount || 0) - (comment.downvoteCount || 0);
      if (comment.score !== calculatedScore) {
        comment.score = calculatedScore;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await comment.save();
        communityUpdated++;
        console.log(`  ✓ Updated community comment ${comment._id} - stance: ${comment.stance}, score: ${comment.score}`);
      }
    }

    // Migrate Expert Comments with stance inference
    console.log('\n🎓 Migrating Expert Comments with stance inference...');
    const expertComments = await ExpertComment.find({});
    
    let expertUpdated = 0;
    for (const comment of expertComments) {
      let needsUpdate = false;
      
      // Infer stance if missing
      if (!comment.stance || comment.stance === 'general') {
        const inferredStance = inferStanceFromComment(comment.comment);
        comment.stance = inferredStance;
        needsUpdate = true;
      }
      
      // Calculate score
      const calculatedScore = (comment.upvoteCount || 0) - (comment.downvoteCount || 0);
      if (comment.score !== calculatedScore) {
        comment.score = calculatedScore;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await comment.save();
        expertUpdated++;
        console.log(`  ✓ Updated expert comment ${comment._id} - stance: ${comment.stance}, score: ${comment.score}`);
      }
    }

    // Summary with stance breakdown
    console.log('\n🎉 Advanced Migration Summary:');
    console.log(`  • Community Comments: ${communityUpdated}/${communityComments.length} updated`);
    console.log(`  • Expert Comments: ${expertUpdated}/${expertComments.length} updated`);

    // Stance distribution
    const stanceDistribution = await Promise.all([
      CommunityComment.aggregate([
        { $group: { _id: '$stance', count: { $sum: 1 } } }
      ]),
      ExpertComment.aggregate([
        { $group: { _id: '$stance', count: { $sum: 1 } } }
      ])
    ]);

    console.log('\n📊 Stance Distribution:');
    console.log('Community Comments:');
    stanceDistribution[0].forEach(dist => {
      console.log(`  • ${dist._id}: ${dist.count}`);
    });
    console.log('Expert Comments:');
    stanceDistribution[1].forEach(dist => {
      console.log(`  • ${dist._id}: ${dist.count}`);
    });

  } catch (error) {
    console.error('❌ Advanced migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run the appropriate migration
const migrationMode = process.argv[2] || 'basic';

if (migrationMode === 'advanced') {
  migrateCommentsWithStanceInference();
} else {
  migrateComments();
}

module.exports = { migrateComments, migrateCommentsWithStanceInference };
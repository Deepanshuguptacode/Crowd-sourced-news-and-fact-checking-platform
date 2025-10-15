const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { CommunityComment, ExpertComment } = require('../models/Comments');
require('dotenv').config();

/**
 * Correct Stance Migration Script
 * This script reads the real-news-comments JSON files and updates the database
 * with the correct stance values instead of the generic "general" stance
 */

class CorrectStanceMigration {
  constructor() {
    this.commentsDir = path.join(__dirname, '../real-news-comments');
    this.stanceMapping = {}; // Will store commentId -> stance mapping
    this.statsCounters = {
      totalJsonComments: 0,
      totalUpdated: 0,
      inFavor: 0,
      against: 0,
      notFound: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log('🚀 Starting Correct Stance Migration...\n');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');
      console.log('✅ Connected to database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async loadStanceDataFromJSON() {
    console.log('📂 Loading stance data from JSON files...\n');

    const jsonFiles = fs.readdirSync(this.commentsDir)
      .filter(file => file.endsWith('_corrected.json') && file.startsWith('news_'))
      .sort(); // Process in order

    console.log(`Found ${jsonFiles.length} corrected JSON files to process:\n`);

    for (const fileName of jsonFiles) {
      const filePath = path.join(this.commentsDir, fileName);
      console.log(`📄 Processing: ${fileName}`);
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const newsData = JSON.parse(fileContent);
        
        let fileCommentCount = 0;
        let fileInFavor = 0;
        let fileAgainst = 0;

        // Process importance group comments
        if (newsData.commentGroups && newsData.commentGroups.importance) {
          for (const comment of newsData.commentGroups.importance) {
            if (comment._id && comment.stance) {
              this.stanceMapping[comment._id] = comment.stance;
              fileCommentCount++;
              this.statsCounters.totalJsonComments++;
              
              if (comment.stance === 'in_favor') {
                fileInFavor++;
                this.statsCounters.inFavor++;
              } else if (comment.stance === 'against') {
                fileAgainst++;
                this.statsCounters.against++;
              }
            }
          }
        }

        // Process accuracy group comments
        if (newsData.commentGroups && newsData.commentGroups.accuracy) {
          for (const comment of newsData.commentGroups.accuracy) {
            if (comment._id && comment.stance) {
              this.stanceMapping[comment._id] = comment.stance;
              fileCommentCount++;
              this.statsCounters.totalJsonComments++;
              
              if (comment.stance === 'in_favor') {
                fileInFavor++;
                this.statsCounters.inFavor++;
              } else if (comment.stance === 'against') {
                fileAgainst++;
                this.statsCounters.against++;
              }
            }
          }
        }

        // Process comments in all group types (new structure)
        if (newsData.commentGroups) {
          for (const groupType in newsData.commentGroups) {
            if (Array.isArray(newsData.commentGroups[groupType])) {
              for (const comment of newsData.commentGroups[groupType]) {
                if (comment._id && comment.stance) {
                  this.stanceMapping[comment._id] = comment.stance;
                  fileCommentCount++;
                  this.statsCounters.totalJsonComments++;
                  
                  if (comment.stance === 'in_favor') {
                    fileInFavor++;
                    this.statsCounters.inFavor++;
                  } else if (comment.stance === 'against') {
                    fileAgainst++;
                    this.statsCounters.against++;
                  }
                }
              }
            }
          }
        }

        console.log(`   📊 Found ${fileCommentCount} comments (${fileInFavor} in_favor, ${fileAgainst} against)`);

      } catch (error) {
        console.error(`   ❌ Error processing ${fileName}:`, error.message);
        this.statsCounters.errors++;
      }
    }

    console.log(`\n📈 Total stance data loaded:`);
    console.log(`   • Total comments: ${this.statsCounters.totalJsonComments}`);
    console.log(`   • In favor: ${this.statsCounters.inFavor}`);
    console.log(`   • Against: ${this.statsCounters.against}`);
    console.log(`   • Unique comment IDs: ${Object.keys(this.stanceMapping).length}\n`);
  }

  async updateDatabaseStances() {
    console.log('🔄 Updating database with correct stance values...\n');

    const commentIds = Object.keys(this.stanceMapping);
    let batchSize = 50;
    let processed = 0;

    console.log(`Processing ${commentIds.length} comments in batches of ${batchSize}...\n`);

    for (let i = 0; i < commentIds.length; i += batchSize) {
      const batch = commentIds.slice(i, i + batchSize);
      
      try {
        // Update community comments
        for (const commentId of batch) {
          const correctStance = this.stanceMapping[commentId];
          
          try {
            // Try updating as community comment first
            const communityResult = await CommunityComment.updateOne(
              { _id: commentId },
              { $set: { stance: correctStance } }
            );

            if (communityResult.matchedCount > 0) {
              this.statsCounters.totalUpdated++;
              processed++;
              
              if (processed % 20 === 0) {
                console.log(`   ✓ Updated ${processed}/${commentIds.length} comments...`);
              }
            } else {
              // Try updating as expert comment
              const expertResult = await ExpertComment.updateOne(
                { _id: commentId },
                { $set: { stance: correctStance } }
              );

              if (expertResult.matchedCount > 0) {
                this.statsCounters.totalUpdated++;
                processed++;
                
                if (processed % 20 === 0) {
                  console.log(`   ✓ Updated ${processed}/${commentIds.length} comments...`);
                }
              } else {
                this.statsCounters.notFound++;
                if (this.statsCounters.notFound <= 5) { // Show first 5 not found
                  console.log(`   ⚠️  Comment ${commentId} not found in database`);
                }
              }
            }
          } catch (updateError) {
            console.error(`   ❌ Error updating comment ${commentId}:`, updateError.message);
            this.statsCounters.errors++;
          }
        }

      } catch (batchError) {
        console.error(`❌ Batch processing error:`, batchError.message);
        this.statsCounters.errors++;
      }
    }

    console.log(`\n✅ Database update completed!`);
    console.log(`   • Successfully updated: ${this.statsCounters.totalUpdated}`);
    console.log(`   • Not found in DB: ${this.statsCounters.notFound}`);
    console.log(`   • Errors: ${this.statsCounters.errors}`);
  }

  async verifyUpdates() {
    console.log('\n🔍 Verifying stance distribution after migration...\n');

    // Get updated stance distribution
    const communityStanceStats = await CommunityComment.aggregate([
      {
        $group: {
          _id: '$stance',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const expertStanceStats = await ExpertComment.aggregate([
      {
        $group: {
          _id: '$stance',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 Community Comments Stance Distribution:');
    communityStanceStats.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.count} comments (avg score: ${stat.avgScore.toFixed(1)})`);
    });

    console.log('\n📊 Expert Comments Stance Distribution:');
    if (expertStanceStats.length > 0) {
      expertStanceStats.forEach(stat => {
        console.log(`   • ${stat._id}: ${stat.count} comments (avg score: ${stat.avgScore.toFixed(1)})`);
      });
    } else {
      console.log('   • No expert comments found');
    }

    // Check for remaining "general" stances
    const generalCount = await CommunityComment.countDocuments({ stance: 'general' });
    const expertGeneralCount = await ExpertComment.countDocuments({ stance: 'general' });
    
    console.log(`\n🎯 Remaining "general" stances:`);
    console.log(`   • Community: ${generalCount}`);
    console.log(`   • Expert: ${expertGeneralCount}`);
    
    if (generalCount + expertGeneralCount === 0) {
      console.log('✅ No more generic "general" stances remaining!');
    } else {
      console.log('⚠️  Some "general" stances remain - these may be legitimate or need manual review');
    }
  }

  async showSampleUpdates() {
    console.log('\n📝 Sample of updated comments:\n');

    const sampleComments = await CommunityComment.find({
      stance: { $in: ['in_favor', 'against'] }
    })
    .limit(5)
    .select('comment stance score upvoteCount downvoteCount');

    sampleComments.forEach((comment, index) => {
      console.log(`${index + 1}. [${comment.stance.toUpperCase()}] Score: ${comment.score}`);
      console.log(`   "${comment.comment.substring(0, 80)}..."`);
      console.log(`   ↑${comment.upvoteCount} ↓${comment.downvoteCount}\n`);
    });
  }

  async cleanup() {
    console.log('🧹 Cleaning up...\n');
    
    try {
      await mongoose.disconnect();
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message);
    }
  }

  async runMigration() {
    const initialized = await this.initialize();
    if (!initialized) return;

    try {
      await this.loadStanceDataFromJSON();
      
      if (Object.keys(this.stanceMapping).length === 0) {
        console.log('❌ No stance data found in JSON files. Migration aborted.');
        return;
      }

      await this.updateDatabaseStances();
      await this.verifyUpdates();
      await this.showSampleUpdates();
      
      console.log('🎉 Correct Stance Migration Completed Successfully!\n');
      console.log('Summary:');
      console.log(`• JSON comments processed: ${this.statsCounters.totalJsonComments}`);
      console.log(`• Database comments updated: ${this.statsCounters.totalUpdated}`);
      console.log(`• Comments not found: ${this.statsCounters.notFound}`);
      console.log(`• Errors encountered: ${this.statsCounters.errors}`);
      console.log('• Stance distribution now reflects actual comment sentiments');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the migration
if (require.main === module) {
  const migration = new CorrectStanceMigration();
  migration.runMigration().catch(console.error);
}

module.exports = CorrectStanceMigration;
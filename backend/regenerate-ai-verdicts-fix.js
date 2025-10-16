const mongoose = require('mongoose');
const AIVerdict = require('./models/AIVerdict');
const aiVerdictService = require('./services/aiVerdictService');

// Read fake news IDs
const fakeNewsIds = [
  "68ef91ef3bda87128d26e22c",
  "68ef91ef3bda87128d26e22e", 
  "68ef91ef3bda87128d26e232",
  "68ef91ef3bda87128d26e234",
  "68ef91ef3bda87128d26e236",
  "68ef91ef3bda87128d26e238",
  "68ef91ef3bda87128d26e23a",
  "68ef91ef3bda87128d26e23c",
  "68ef91ef3bda87128d26e23e",
  "68ef91ef3bda87128d26e240"
];

async function regenerateAIVerdictsWithMoreComments() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://deepanshugupta650:deepanshuguptacode@voxveritas.lst4gcg.mongodb.net/?retryWrites=true&w=majority&appName=VoxVeritas');
    console.log('✅ Connected to MongoDB Atlas');

    console.log('🔄 REGENERATING AI VERDICTS WITH IMPROVED COMMENT SELECTION');
    console.log('='.repeat(65));

    let processedCount = 0;
    let successCount = 0;

    for (const newsId of fakeNewsIds) {
      try {
        console.log(`\n🔄 Processing news ${processedCount + 1}/10 (${newsId})`);
        
        // Delete existing verdict to regenerate with new logic
        const existingVerdict = await AIVerdict.findOne({ newsId });
        if (existingVerdict) {
          await AIVerdict.findOneAndDelete({ newsId });
          console.log('   🗑️  Deleted existing verdict');
        }

        // Generate new verdict with improved comment selection
        const newVerdict = await aiVerdictService.generateVerdict(newsId);
        
        if (newVerdict) {
          console.log('   ✅ Generated new AI verdict');
          console.log(`   📊 Supporting comments: ${newVerdict.topComments?.inFavor?.length || 0}`);
          console.log(`   📊 Opposing comments: ${newVerdict.topComments?.against?.length || 0}`);
          console.log(`   📊 Verdict score: ${newVerdict.score}/100`);
          
          // Show sample comments
          if (newVerdict.topComments?.inFavor?.length > 0) {
            console.log(`   📝 Sample supporting: "${newVerdict.topComments.inFavor[0].commentText.substring(0, 50)}..."`);
          }
          if (newVerdict.topComments?.against?.length > 0) {
            console.log(`   📝 Sample opposing: "${newVerdict.topComments.against[0].commentText.substring(0, 50)}..."`);
          }
          
          successCount++;
        } else {
          console.log('   ❌ Failed to generate verdict');
        }

        processedCount++;

      } catch (error) {
        console.error(`   ❌ Error processing ${newsId}:`, error.message);
        processedCount++;
      }
    }

    console.log('\n📊 REGENERATION SUMMARY:');
    console.log('========================');
    console.log(`Total Articles: ${fakeNewsIds.length}`);
    console.log(`Processed: ${processedCount}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${processedCount - successCount}`);

    // Verify results
    console.log('\n🔍 VERIFICATION OF REGENERATED VERDICTS:');
    console.log('========================================');

    for (const newsId of fakeNewsIds.slice(0, 3)) { // Check first 3
      const verdict = await AIVerdict.findOne({ newsId });
      if (verdict) {
        console.log(`\n📰 News: ${newsId}`);
        console.log(`   Created: ${verdict.createdAt.toLocaleString()}`);
        console.log(`   Supporting: ${verdict.topComments?.inFavor?.length || 0} comments`);
        console.log(`   Opposing: ${verdict.topComments?.against?.length || 0} comments`);
        console.log(`   Score: ${verdict.score}/100`);
      } else {
        console.log(`\n❌ No verdict found for ${newsId}`);
      }
    }

    console.log('\n🎉 AI VERDICT REGENERATION COMPLETE!');
    console.log('✅ You should now see more supporting and opposing comments in the frontend');
    console.log('✅ Each verdict now includes up to 8 comments per stance');
    console.log('✅ Frontend displays up to 6 comments per stance with overflow indicator');

  } catch (error) {
    console.error('❌ Error in regeneration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the regeneration
regenerateAIVerdictsWithMoreComments();
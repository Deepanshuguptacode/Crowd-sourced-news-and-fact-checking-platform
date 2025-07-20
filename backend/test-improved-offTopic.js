// Test improved off-topic detection
const llmService = require('./services/llmService');

async function testImprovedOffTopicDetection() {
  console.log('🧪 Testing Improved Off-Topic Detection...\n');
  
  const testCases = [
    // Should be marked as ON-TOPIC
    {
      title: "Climate Change Effects on Agriculture",
      description: "Discussing how climate change is impacting farming and crop production worldwide",
      comment: "Rising temperatures are severely impacting crop yields in the midwest.",
      expected: "on-topic"
    },
    {
      title: "Electric Vehicle Technology",
      description: "Discussion about advances in electric vehicle batteries, charging, and performance",
      comment: "Tesla's new battery technology shows 20% improvement in range.",
      expected: "on-topic"
    },
    
    // Should be marked as OFF-TOPIC
    {
      title: "Climate Change Effects on Agriculture", 
      description: "Discussing how climate change is impacting farming and crop production worldwide",
      comment: "I love pizza! What's your favorite topping?",
      expected: "off-topic"
    },
    {
      title: "Electric Vehicle Technology",
      description: "Discussion about advances in electric vehicle batteries, charging, and performance",
      comment: "My cat is really fluffy and cute. Here's a picture!",
      expected: "off-topic"
    },
    {
      title: "Government Healthcare Policy",
      description: "Debate about proposed changes to national healthcare system",
      comment: "lol",
      expected: "off-topic"
    },
    {
      title: "Education Reform Proposals",
      description: "Discussion on proposed changes to public education funding and curriculum",
      comment: "The weather is really nice today, sunny and warm!",
      expected: "off-topic"
    },
    {
      title: "Renewable Energy Sources",
      description: "Comparing solar, wind, and other renewable energy technologies",
      comment: "This movie was amazing, I loved the special effects and the storyline was perfect!",
      expected: "off-topic"
    }
  ];

  let correctPredictions = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: "${testCase.comment}"`);
      console.log(`🎯 Topic: "${testCase.title}"`);
      console.log(`📈 Expected: ${testCase.expected}`);
      
      const result = await llmService.analyzeCommentRelevance(testCase.comment, testCase.title, testCase.description);
      
      console.log(`🔍 Is Off-Topic: ${result.isOffTopic ? 'Yes' : 'No'}`);
      console.log(`💬 Reason: ${result.reason}`);
      console.log(`🏷️ Label: ${result.label}`);
      
      // Check if prediction matches expectation
      const predictedOffTopic = result.isOffTopic;
      const expectedOffTopic = testCase.expected === "off-topic";
      
      if (predictedOffTopic === expectedOffTopic) {
        console.log(`✅ CORRECT PREDICTION!`);
        correctPredictions++;
      } else {
        console.log(`❌ WRONG PREDICTION! Expected ${testCase.expected}, got ${predictedOffTopic ? 'off-topic' : 'on-topic'}`);
      }
      
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Error testing case:`, error.message);
      console.log('─'.repeat(80));
    }
  }
  
  console.log(`\n🎯 FINAL SCORE: ${correctPredictions}/${testCases.length} correct predictions`);
  console.log(`📊 Accuracy: ${Math.round((correctPredictions / testCases.length) * 100)}%`);
}

testImprovedOffTopicDetection().catch(console.error);

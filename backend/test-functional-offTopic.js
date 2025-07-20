// Test off-topic detection with functional declarations
const llmService = require('./services/llmService');

async function testFunctionalDeclarationOffTopic() {
  console.log('🧪 Testing Off-Topic Detection with Functional Declarations...\n');
  
  const testCases = [
    {
      title: "Climate Change Effects on Agriculture",
      description: "Discussing how climate change is impacting farming and crop production worldwide",
      comment: "I love pizza! What's your favorite topping?",
      expected: "off-topic"
    },
    {
      title: "Electric Vehicle Technology",
      description: "Discussion about advances in electric vehicle batteries, charging, and performance",
      comment: "Tesla's new battery technology shows 20% improvement in range.",
      expected: "on-topic"
    },
    {
      title: "Government Healthcare Policy",
      description: "Debate about proposed changes to national healthcare system",
      comment: "My cat is really fluffy and cute!",
      expected: "off-topic"
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: "${testCase.comment}"`);
      console.log(`🎯 Topic: "${testCase.title}"`);
      console.log(`📈 Expected: ${testCase.expected}`);
      
      const result = await llmService.analyzeCommentRelevance(testCase.comment, testCase.title, testCase.description);
      
      console.log(`✅ Result:`, result);
      console.log(`🔍 Is Off-Topic: ${result.isOffTopic ? 'Yes' : 'No'}`);
      console.log(`💬 Reason: ${result.reason}`);
      console.log(`🏷️ Label: ${result.label}`);
      
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Error testing case:`, error.message);
      console.log('─'.repeat(80));
    }
  }
  
  console.log('🏁 Functional declaration off-topic test completed!');
}

testFunctionalDeclarationOffTopic().catch(console.error);

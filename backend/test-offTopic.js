// Test script to verify off-topic detection with Gemini LLM service
const llmService = require('./services/llmService');

async function testOffTopicDetection() {
  console.log('🧪 Testing Off-Topic Detection with Gemini LLM Service...\n');
  
  const testCases = [
    {
      title: "Climate Change Effects on Agriculture",
      description: "Discussing how climate change is impacting farming and crop production worldwide",
      comment: "Rising temperatures are severely impacting crop yields in the midwest.",
      expected: "on-topic"
    },
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
      title: "Electric Vehicle Technology",
      description: "Discussion about advances in electric vehicle batteries, charging, and performance",
      comment: "My cat is really fluffy and cute. Here's a picture!",
      expected: "off-topic"
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: "${testCase.comment}"`);
      console.log(`🎯 Topic: "${testCase.title}"`);
      console.log(`📝 Description: "${testCase.description}"`);
      console.log(`📈 Expected: ${testCase.expected}`);
      
      const result = await llmService.analyzeCommentRelevance(testCase.comment, testCase.title, testCase.description);
      
      console.log(`✅ Result:`, result);
      console.log(`🔍 Is Off-Topic: ${result.isOffTopic ? 'Yes' : 'No'}`);
      
      if (result.reason) {
        console.log(`💬 Reason: ${result.reason}`);
      }
      
      if (result.label) {
        console.log(`🏷️  Label: ${result.label}`);
      }
      
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Error testing case:`, error.message);
      console.log('─'.repeat(80));
    }
  }
  
  console.log('🏁 Off-topic detection test completed!');
}

testOffTopicDetection().catch(console.error);

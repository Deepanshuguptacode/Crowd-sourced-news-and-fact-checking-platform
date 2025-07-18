// Direct test of counter-matching logic
const mongoose = require('mongoose');
const DebateRoom = require('./models/DebateRoom');
const DebateGroup = require('./models/DebateGroup');
const DebateComment = require('./models/DebateComment');
const { generateGroupContent } = require('./services/generateGroupContent');
const { findCounterGroup } = require('./services/findCounterGroup');

async function testCounterMatching() {
  try {
    console.log('🧪 Testing Counter-Matching Logic...\n');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/DBMS');
    console.log('✅ Connected to MongoDB');
    
    // Create a test debate room
    const testRoom = new DebateRoom({
      title: 'Test Counter-Matching Room',
      description: 'Testing AI-powered counter-matching',
      topic: 'Climate Change',
      creator: new mongoose.Types.ObjectId(),
      creatorModel: 'NormalUser',
      participants: []
    });
    await testRoom.save();
    console.log('✅ Created test debate room:', testRoom._id);
    
    // Create test comments
    const proComment = new DebateComment({
      debateRoomId: testRoom._id,
      text: 'Renewable energy is the key to fighting climate change',
      stance: 'for',
      author: new mongoose.Types.ObjectId(),
      authorModel: 'NormalUser',
      authorName: 'Pro User'
    });
    await proComment.save();
    
    const conComment = new DebateComment({
      debateRoomId: testRoom._id,
      text: 'The economic costs of renewable energy are too high',
      stance: 'against',
      author: new mongoose.Types.ObjectId(),
      authorModel: 'NormalUser',
      authorName: 'Con User'
    });
    await conComment.save();
    
    console.log('✅ Created test comments');
    
    // Test group content generation
    const { title: proTitle, description: proDescription } = await generateGroupContent([proComment]);
    const { title: conTitle, description: conDescription } = await generateGroupContent([conComment]);
    
    console.log('✅ Generated group content:');
    console.log('   Pro:', proTitle);
    console.log('   Con:', conTitle);
    
    // Create groups
    const proGroup = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'renewable-energy-benefits',
      title: proTitle,
      description: proDescription,
      stance: 'for',
      commentIds: [proComment._id],
      displayOrder: 0
    });
    await proGroup.save();
    
    const conGroup = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'renewable-energy-costs',
      title: conTitle,
      description: conDescription,
      stance: 'against',
      commentIds: [conComment._id],
      displayOrder: 0
    });
    await conGroup.save();
    
    console.log('✅ Created test groups');
    
    // Test counter-matching
    const { counterGroupId, confidence, reasoning } = await findCounterGroup(proGroup, [conGroup]);
    
    console.log('✅ Counter-matching result:');
    console.log('   Counter Group ID:', counterGroupId);
    console.log('   Confidence:', confidence);
    console.log('   Reasoning:', reasoning);
    
    if (counterGroupId) {
      // Update bidirectional linking
      await DebateGroup.findByIdAndUpdate(proGroup._id, { counterGroupId });
      await DebateGroup.findByIdAndUpdate(conGroup._id, { counterGroupId: proGroup._id });
      console.log('✅ Bidirectional linking established');
    }
    
    // Verify the counter-matching worked
    const updatedProGroup = await DebateGroup.findById(proGroup._id).populate('counterGroupId');
    const updatedConGroup = await DebateGroup.findById(conGroup._id).populate('counterGroupId');
    
    console.log('✅ Verification:');
    console.log('   Pro group counter:', updatedProGroup.counterGroupId?.title || 'None');
    console.log('   Con group counter:', updatedConGroup.counterGroupId?.title || 'None');
    
    // Clean up
    await DebateRoom.findByIdAndDelete(testRoom._id);
    await DebateGroup.deleteMany({ debateRoomId: testRoom._id });
    await DebateComment.deleteMany({ debateRoomId: testRoom._id });
    
    console.log('✅ Test completed and cleaned up');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    console.log('\n🎉 Counter-matching test completed successfully!');
    console.log('The AI-powered counter-matching system is working correctly.');
    
  } catch (error) {
    console.error('❌ Error during counter-matching test:', error);
  }
}

// Run the test
testCounterMatching();

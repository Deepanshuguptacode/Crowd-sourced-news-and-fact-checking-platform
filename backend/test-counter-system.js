const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/debate-room');

const DebateRoom = require('./models/DebateRoom');
const DebateGroup = require('./models/DebateGroup');
const DebateComment = require('./models/DebateComment');

async function testCounterMatchingSystem() {
  try {
    console.log('🚀 Testing Counter-Matching System');
    
    // Clean up any existing test data
    await DebateRoom.deleteMany({ title: /^Test/ });
    await DebateGroup.deleteMany({});
    await DebateComment.deleteMany({});
    
    // Create a test room
    const testRoom = new DebateRoom({
      title: 'Test AI Impact Debate',
      description: 'Testing counter-matching functionality',
      topic: 'AI Impact on Jobs',
      creator: new mongoose.Types.ObjectId(),
      creatorModel: 'CommunityUser'
    });
    await testRoom.save();
    console.log('✅ Test room created:', testRoom.title);
    
    // Create test groups with counter-links
    const proGroup1 = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'AI Opportunities',
      title: 'AI Creates New Opportunities',
      description: 'AI will create more jobs than it destroys by opening new fields and increasing productivity.',
      stance: 'for',
      commentIds: []
    });
    await proGroup1.save();
    
    const conGroup1 = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'Job Displacement',
      title: 'AI Causes Job Displacement',
      description: 'AI will replace many jobs faster than new ones can be created, leading to unemployment.',
      stance: 'against',
      commentIds: []
    });
    await conGroup1.save();
    
    const proGroup2 = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'Human Augmentation',
      title: 'AI Enhances Human Capabilities',
      description: 'AI serves as a tool to augment human abilities rather than replace workers.',
      stance: 'for',
      commentIds: []
    });
    await proGroup2.save();
    
    const conGroup2 = new DebateGroup({
      debateRoomId: testRoom._id,
      label: 'Human Obsolescence',
      title: 'AI Reduces Human Value',
      description: 'AI makes human skills obsolete and reduces the value of human labor.',
      stance: 'against',
      commentIds: []
    });
    await conGroup2.save();
    
    // Create bidirectional counter-links
    await DebateGroup.findByIdAndUpdate(proGroup1._id, { counterGroupId: conGroup1._id });
    await DebateGroup.findByIdAndUpdate(conGroup1._id, { counterGroupId: proGroup1._id });
    await DebateGroup.findByIdAndUpdate(proGroup2._id, { counterGroupId: conGroup2._id });
    await DebateGroup.findByIdAndUpdate(conGroup2._id, { counterGroupId: proGroup2._id });
    
    // Create test comments
    const comment1 = new DebateComment({
      text: 'AI is already creating jobs in data science and machine learning.',
      stance: 'for',
      debateRoomId: testRoom._id,
      author: new mongoose.Types.ObjectId(),
      authorModel: 'CommunityUser',
      authorName: 'Test User 1'
    });
    await comment1.save();
    await DebateGroup.findByIdAndUpdate(proGroup1._id, { $push: { commentIds: comment1._id } });
    
    const comment2 = new DebateComment({
      text: 'Automation has already displaced millions of manufacturing jobs.',
      stance: 'against',
      debateRoomId: testRoom._id,
      author: new mongoose.Types.ObjectId(),
      authorModel: 'CommunityUser',
      authorName: 'Test User 2'
    });
    await comment2.save();
    await DebateGroup.findByIdAndUpdate(conGroup1._id, { $push: { commentIds: comment2._id } });
    
    // Test the API response format
    console.log('\n📊 Testing API Response Format');
    const groups = await DebateGroup.find({ debateRoomId: testRoom._id })
      .populate('commentIds')
      .populate('counterGroupId');
    
    const forGroups = groups.filter(g => g.stance === 'for');
    const againstGroups = groups.filter(g => g.stance === 'against');
    
    const apiResponse = {
      for: forGroups,
      against: againstGroups
    };
    
    console.log('FOR Groups:');
    apiResponse.for.forEach(g => {
      console.log(`- ${g.title}`);
      console.log(`  Counter: ${g.counterGroupId ? g.counterGroupId.title : 'None'}`);
      console.log(`  Counter ID: ${g.counterGroupId ? g.counterGroupId._id : 'null'}`);
      console.log(`  Comments: ${g.commentIds.length}`);
    });
    
    console.log('\nAGAINST Groups:');
    apiResponse.against.forEach(g => {
      console.log(`- ${g.title}`);
      console.log(`  Counter: ${g.counterGroupId ? g.counterGroupId.title : 'None'}`);
      console.log(`  Counter ID: ${g.counterGroupId ? g.counterGroupId._id : 'null'}`);
      console.log(`  Comments: ${g.commentIds.length}`);
    });
    
    console.log('\n🧪 Testing Counter-Chat Thread Logic');
    const threads = [];
    const processedConGroups = new Set();
    
    // Process each pro group and find its counter
    forGroups.forEach(proGroup => {
      const thread = {
        pro: proGroup,
        con: null
      };
      
      if (proGroup.counterGroupId) {
        const counterGroupId = proGroup.counterGroupId._id.toString();
        const counterGroup = againstGroups.find(g => 
          g._id.toString() === counterGroupId
        );
        if (counterGroup) {
          thread.con = counterGroup;
          processedConGroups.add(counterGroup._id.toString());
        }
      }
      
      threads.push(thread);
    });
    
    // Add unprocessed con groups
    againstGroups.forEach(conGroup => {
      if (!processedConGroups.has(conGroup._id.toString())) {
        threads.push({
          pro: null,
          con: conGroup
        });
      }
    });
    
    console.log(`Created ${threads.length} threads:`);
    threads.forEach((thread, index) => {
      console.log(`Thread ${index + 1}:`);
      console.log(`  PRO: ${thread.pro ? thread.pro.title : 'Empty'}`);
      console.log(`  CON: ${thread.con ? thread.con.title : 'Empty'}`);
    });
    
    console.log('\n✅ Counter-matching test completed successfully!');
    console.log(`🎯 Room ID for frontend testing: ${testRoom._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCounterMatchingSystem();

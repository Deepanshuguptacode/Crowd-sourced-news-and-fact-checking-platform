const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import all models
const NormalUser = require('./models/NormalUser');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const News = require('./models/News');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const DebateRoom = require('./models/DebateRoom');
const DebateComment = require('./models/DebateComment');
const DebateGroup = require('./models/DebateGroup');

// Hash password helper
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed database with Indian data...');

    // Clear existing data
    await Promise.all([
      NormalUser.deleteMany({}),
      CommunityUser.deleteMany({}),
      ExpertUser.deleteMany({}),
      News.deleteMany({}),
      CommunityComment.deleteMany({}),
      ExpertComment.deleteMany({}),
      DebateRoom.deleteMany({}),
      DebateComment.deleteMany({}),
      DebateGroup.deleteMany({})
    ]);

    // Create Normal Users with Indian names
    const normalUsers = await NormalUser.create([
      {
        name: 'Rajesh Kumar',
        username: 'rajesh_k',
        email: 'rajesh.kumar@gmail.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      },
      {
        name: 'Priya Sharma',
        username: 'priya_sharma',
        email: 'priya.sharma@yahoo.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      },
      {
        name: 'Amit Singh',
        username: 'amit_singh',
        email: 'amit.singh@hotmail.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      },
      {
        name: 'Sunita Patel',
        username: 'sunita_patel',
        email: 'sunita.patel@gmail.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      },
      {
        name: 'Vikram Yadav',
        username: 'vikram_yadav',
        email: 'vikram.yadav@gmail.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      },
      {
        name: 'Meera Gupta',
        username: 'meera_gupta',
        email: 'meera.gupta@outlook.com',
        password: await hashPassword('password123'),
        role: 'Normal'
      }
    ]);

    // Create Community Users with Indian names
    const communityUsers = await CommunityUser.create([
      {
        name: 'Arjun Reddy',
        username: 'arjun_reddy',
        email: 'arjun.reddy@gmail.com',
        password: await hashPassword('password123'),
        role: 'Community',
        isApproved: true
      },
      {
        name: 'Kavya Iyer',
        username: 'kavya_iyer',
        email: 'kavya.iyer@gmail.com',
        password: await hashPassword('password123'),
        role: 'Community',
        isApproved: true
      },
      {
        name: 'Rohit Agarwal',
        username: 'rohit_agarwal',
        email: 'rohit.agarwal@yahoo.com',
        password: await hashPassword('password123'),
        role: 'Community',
        isApproved: true
      },
      {
        name: 'Anjali Mishra',
        username: 'anjali_mishra',
        email: 'anjali.mishra@gmail.com',
        password: await hashPassword('password123'),
        role: 'Community',
        isApproved: true
      },
      {
        name: 'Deepak Joshi',
        username: 'deepak_joshi',
        email: 'deepak.joshi@hotmail.com',
        password: await hashPassword('password123'),
        role: 'Community',
        isApproved: true
      }
    ]);

    // Create Expert Users with Indian names and professions
    const expertUsers = await ExpertUser.create([
      {
        name: 'Dr. Suresh Menon',
        username: 'dr_suresh',
        email: 'suresh.menon@thehindu.com',
        password: await hashPassword('password123'),
        role: 'Expert',
        profession: 'Senior Journalist - The Hindu',
        isApproved: true
      },
      {
        name: 'Ritu Kapur',
        username: 'ritu_kapur',
        email: 'ritu.kapur@ndtv.com',
        password: await hashPassword('password123'),
        role: 'Expert',
        profession: 'Political Correspondent - NDTV',
        isApproved: true
      },
      {
        name: 'Prof. Anand Krishnan',
        username: 'prof_anand',
        email: 'anand.krishnan@jnu.ac.in',
        password: await hashPassword('password123'),
        role: 'Expert',
        profession: 'Professor of Political Science - JNU',
        isApproved: true
      },
      {
        name: 'Sanjay Bhat',
        username: 'sanjay_bhat',
        email: 'sanjay.bhat@indianexpress.com',
        password: await hashPassword('password123'),
        role: 'Expert',
        profession: 'Investigative Journalist - Indian Express',
        isApproved: true
      }
    ]);

    // Create News articles with Indian context
    const newsArticles = await News.create([
      {
        title: 'New Metro Line Announced for Bangalore',
        description: 'Karnataka government announces Phase 3 of Bangalore Metro with 44 new stations covering major IT corridors including Electronic City and Whitefield.',
        link: 'https://example.com/bangalore-metro-phase3',
        screenshots: ['metro_announcement.jpg'],
        status: 'Pending',
        uploadedBy: normalUsers[0]._id,
        uploadedAt: new Date('2024-01-15')
      },
      {
        title: 'Farmers Protest Updates from Punjab',
        description: 'Farmers in Punjab continue their march towards Delhi demanding implementation of MSP guarantee and loan waiver policies.',
        link: 'https://example.com/farmers-protest-punjab',
        screenshots: ['farmers_protest.jpg'],
        status: 'Verified',
        uploadedBy: normalUsers[1]._id,
        uploadedAt: new Date('2024-01-16')
      },
      {
        title: 'Mumbai Monsoon Preparedness 2024',
        description: 'BMC announces completion of pre-monsoon work including desilting of drains and road repairs across Mumbai to prevent waterlogging.',
        link: 'https://example.com/mumbai-monsoon-prep',
        screenshots: ['mumbai_monsoon.jpg'],
        status: 'Verified',
        uploadedBy: normalUsers[2]._id,
        uploadedAt: new Date('2024-01-17')
      },
      {
        title: 'Fake News: Free Vaccine Distribution at Temples',
        description: 'Viral WhatsApp message claiming free COVID vaccines being distributed at local temples has been debunked by health authorities.',
        link: 'https://example.com/fake-vaccine-news',
        screenshots: ['fake_vaccine_news.jpg'],
        status: 'Fake',
        uploadedBy: normalUsers[3]._id,
        uploadedAt: new Date('2024-01-18')
      },
      {
        title: 'Chandrayaan-4 Mission Timeline Released',
        description: 'ISRO announces timeline for Chandrayaan-4 mission with sample return capability planned for 2027 launch window.',
        link: 'https://example.com/chandrayaan4-timeline',
        screenshots: ['chandrayaan4.jpg'],
        status: 'Pending',
        uploadedBy: normalUsers[4]._id,
        uploadedAt: new Date('2024-01-19')
      },
      {
        title: 'Digital Rupee Pilot Program Expansion',
        description: 'RBI expands digital rupee pilot program to 15 more cities including Pune, Ahmedabad, and Kolkata with retail and wholesale applications.',
        link: 'https://example.com/digital-rupee-expansion',
        screenshots: ['digital_rupee.jpg'],
        status: 'Pending',
        uploadedBy: normalUsers[5]._id,
        uploadedAt: new Date('2024-01-20')
      }
    ]);

    // Create Community Comments
    const communityComments = await CommunityComment.create([
      {
        newsId: newsArticles[0]._id,
        commenter: communityUsers[0]._id,
        comment: 'This is great news for Bangalore! Finally, connectivity to Electronic City will improve.',
        createdAt: new Date('2024-01-15T10:30:00')
      },
      {
        newsId: newsArticles[0]._id,
        commenter: communityUsers[1]._id,
        comment: 'Hope the construction doesn\'t cause too much traffic disruption like the previous phases.',
        createdAt: new Date('2024-01-15T11:15:00')
      },
      {
        newsId: newsArticles[1]._id,
        commenter: communityUsers[2]._id,
        comment: 'The farmers have legitimate demands. MSP guarantee is crucial for agricultural sustainability.',
        createdAt: new Date('2024-01-16T09:45:00')
      },
      {
        newsId: newsArticles[1]._id,
        commenter: communityUsers[3]._id,
        comment: 'Peaceful protests are the backbone of democracy. Hope their voices are heard.',
        createdAt: new Date('2024-01-16T14:20:00')
      },
      {
        newsId: newsArticles[2]._id,
        commenter: communityUsers[4]._id,
        comment: 'BMC needs to ensure the work is actually effective. Last year\'s promises weren\'t fully delivered.',
        createdAt: new Date('2024-01-17T08:30:00')
      },
      {
        newsId: newsArticles[4]._id,
        commenter: communityUsers[0]._id,
        comment: 'ISRO continues to make India proud! Excited about the sample return mission.',
        createdAt: new Date('2024-01-19T16:45:00')
      }
    ]);

    // Create Expert Comments
    const expertComments = await ExpertComment.create([
      {
        newsId: newsArticles[0]._id,
        expert: expertUsers[0]._id,
        comment: 'The Phase 3 announcement aligns with urban planning goals. However, funding mechanisms and timeline feasibility need scrutiny based on previous phase delays.',
        createdAt: new Date('2024-01-15T15:30:00')
      },
      {
        newsId: newsArticles[1]._id,
        expert: expertUsers[1]._id,
        comment: 'Having covered agricultural policies extensively, the farmers\' demands for MSP guarantee are economically sound. The government needs to address rural distress comprehensively.',
        createdAt: new Date('2024-01-16T18:00:00')
      },
      {
        newsId: newsArticles[2]._id,
        expert: expertUsers[3]._id,
        comment: 'My investigation shows BMC has completed 78% of promised pre-monsoon work. Critical areas like Sion-Matunga still need attention to prevent annual flooding.',
        createdAt: new Date('2024-01-17T12:15:00')
      },
      {
        newsId: newsArticles[3]._id,
        expert: expertUsers[2]._id,
        comment: 'This fake news pattern exploits religious sentiments to spread misinformation. Health authorities must strengthen communication channels to counter such narratives.',
        createdAt: new Date('2024-01-18T10:00:00')
      },
      {
        newsId: newsArticles[4]._id,
        expert: expertUsers[0]._id,
        comment: 'Chandrayaan-4\'s sample return capability represents a significant technological leap. The 2027 timeline is ambitious but achievable given ISRO\'s track record.',
        createdAt: new Date('2024-01-19T20:30:00')
      },
      {
        newsId: newsArticles[5]._id,
        expert: expertUsers[1]._id,
        comment: 'Digital rupee expansion needs careful monitoring of privacy concerns and financial inclusion aspects. The pilot data from initial cities will be crucial.',
        createdAt: new Date('2024-01-20T11:45:00')
      }
    ]);

    // Update news articles with comments and votes
    await News.findByIdAndUpdate(newsArticles[0]._id, {
      comments: [communityComments[0]._id, communityComments[1]._id, expertComments[0]._id],
      upvotes: [communityUsers[0]._id, communityUsers[1]._id, expertUsers[0]._id],
      downvotes: []
    });

    await News.findByIdAndUpdate(newsArticles[1]._id, {
      comments: [communityComments[2]._id, communityComments[3]._id, expertComments[1]._id],
      upvotes: [communityUsers[2]._id, communityUsers[3]._id, expertUsers[1]._id],
      downvotes: []
    });

    await News.findByIdAndUpdate(newsArticles[2]._id, {
      comments: [communityComments[4]._id, expertComments[2]._id],
      upvotes: [communityUsers[4]._id, expertUsers[3]._id],
      downvotes: [communityUsers[1]._id]
    });

    await News.findByIdAndUpdate(newsArticles[3]._id, {
      comments: [expertComments[3]._id],
      upvotes: [expertUsers[2]._id],
      downvotes: [communityUsers[0]._id, communityUsers[2]._id]
    });

    await News.findByIdAndUpdate(newsArticles[4]._id, {
      comments: [communityComments[5]._id, expertComments[4]._id],
      upvotes: [communityUsers[0]._id, expertUsers[0]._id, normalUsers[0]._id],
      downvotes: []
    });

    await News.findByIdAndUpdate(newsArticles[5]._id, {
      comments: [expertComments[5]._id],
      upvotes: [expertUsers[1]._id],
      downvotes: []
    });

    // Create Debate Rooms
    const debateRooms = await DebateRoom.create([
      {
        title: 'Should India Prioritize Space Missions Over Social Welfare?',
        description: 'A debate on whether ISRO\'s budget allocation is justified when India faces poverty and healthcare challenges.',
        topic: 'Space Program vs Social Welfare',
        creator: communityUsers[0]._id,
        creatorModel: 'CommunityUser',
        participants: [
          { userId: communityUsers[0]._id, userModel: 'CommunityUser' },
          { userId: expertUsers[0]._id, userModel: 'ExpertUser' },
          { userId: normalUsers[0]._id, userModel: 'NormalUser' },
          { userId: communityUsers[1]._id, userModel: 'CommunityUser' }
        ],
        tags: ['space', 'social-welfare', 'budget', 'priorities'],
        createdAt: new Date('2024-01-20T09:00:00')
      },
      {
        title: 'Farmers\' Protests: Effective Democracy or Economic Disruption?',
        description: 'Discussing the balance between democratic rights to protest and economic implications of prolonged agitations.',
        topic: 'Democratic Protests vs Economic Impact',
        creator: expertUsers[1]._id,
        creatorModel: 'ExpertUser',
        participants: [
          { userId: expertUsers[1]._id, userModel: 'ExpertUser' },
          { userId: communityUsers[2]._id, userModel: 'CommunityUser' },
          { userId: normalUsers[1]._id, userModel: 'NormalUser' },
          { userId: communityUsers[3]._id, userModel: 'CommunityUser' },
          { userId: expertUsers[2]._id, userModel: 'ExpertUser' }
        ],
        tags: ['farmers', 'democracy', 'economy', 'protests'],
        createdAt: new Date('2024-01-21T10:30:00')
      },
      {
        title: 'Digital Rupee: Innovation or Privacy Threat?',
        description: 'Exploring the benefits and risks of India\'s central bank digital currency implementation.',
        topic: 'CBDC Benefits vs Privacy Concerns',
        creator: normalUsers[2]._id,
        creatorModel: 'NormalUser',
        participants: [
          { userId: normalUsers[2]._id, userModel: 'NormalUser' },
          { userId: expertUsers[3]._id, userModel: 'ExpertUser' },
          { userId: communityUsers[4]._id, userModel: 'CommunityUser' },
          { userId: normalUsers[3]._id, userModel: 'NormalUser' }
        ],
        tags: ['digital-currency', 'privacy', 'innovation', 'rbi'],
        createdAt: new Date('2024-01-22T14:15:00')
      }
    ]);

    // Create Debate Groups for organizing comments
    const debateGroups = await DebateGroup.create([
      {
        debateRoomId: debateRooms[0]._id,
        stance: 'for',
        label: 'Pro Space Program',
        title: 'Supporting Space Investment',
        description: 'Arguments supporting space program investment',
        createdAt: new Date('2024-01-20T09:30:00')
      },
      {
        debateRoomId: debateRooms[0]._id,
        stance: 'against',
        label: 'Pro Social Welfare',
        title: 'Prioritizing Social Welfare',
        description: 'Arguments prioritizing social welfare spending',
        createdAt: new Date('2024-01-20T09:30:00')
      },
      {
        debateRoomId: debateRooms[1]._id,
        stance: 'for',
        label: 'Support Democratic Protests',
        title: 'Democratic Rights Advocates',
        description: 'Arguments supporting farmers\' right to protest',
        createdAt: new Date('2024-01-21T11:00:00')
      },
      {
        debateRoomId: debateRooms[1]._id,
        stance: 'against',
        label: 'Concerned About Economic Impact',
        title: 'Economic Stability Advocates',
        description: 'Arguments about economic disruption from protests',
        createdAt: new Date('2024-01-21T11:00:00')
      },
      {
        debateRoomId: debateRooms[2]._id,
        stance: 'for',
        label: 'Digital Innovation Supporters',
        title: 'Technology Advancement Supporters',
        description: 'Arguments supporting digital rupee adoption',
        createdAt: new Date('2024-01-22T14:45:00')
      },
      {
        debateRoomId: debateRooms[2]._id,
        stance: 'against',
        label: 'Privacy Advocates',
        title: 'Privacy Protection Advocates',
        description: 'Arguments raising privacy and surveillance concerns',
        createdAt: new Date('2024-01-22T14:45:00')
      }
    ]);

    // Create Debate Comments
    const debateComments = await DebateComment.create([
      // Space Program Debate
      {
        debateRoomId: debateRooms[0]._id,
        text: 'Space programs have historically driven innovation that benefits society. GPS, satellite communication, weather forecasting - all have transformed our daily lives and economy.',
        stance: 'for',
        groupId: debateGroups[0]._id,
        author: expertUsers[0]._id,
        authorModel: 'ExpertUser',
        authorName: 'Dr. Suresh Menon',
        likes: [
          { userId: communityUsers[0]._id, userModel: 'CommunityUser' },
          { userId: normalUsers[0]._id, userModel: 'NormalUser' }
        ],
        createdAt: new Date('2024-01-20T10:00:00')
      },
      {
        debateRoomId: debateRooms[0]._id,
        text: 'While space achievements are impressive, we have millions without basic healthcare and education. Shouldn\'t we address earthly problems before reaching for the stars?',
        stance: 'against',
        groupId: debateGroups[1]._id,
        author: communityUsers[1]._id,
        authorModel: 'CommunityUser',
        authorName: 'Kavya Iyer',
        likes: [
          { userId: normalUsers[1]._id, userModel: 'NormalUser' }
        ],
        createdAt: new Date('2024-01-20T10:15:00')
      },
      {
        debateRoomId: debateRooms[0]._id,
        text: 'Space programs create high-tech jobs and inspire scientific temperament. The economic multiplier effect is significant - every rupee invested returns multiple times.',
        stance: 'for',
        groupId: debateGroups[0]._id,
        author: normalUsers[0]._id,
        authorModel: 'NormalUser',
        authorName: 'Rajesh Kumar',
        likes: [
          { userId: expertUsers[0]._id, userModel: 'ExpertUser' },
          { userId: communityUsers[0]._id, userModel: 'CommunityUser' }
        ],
        createdAt: new Date('2024-01-20T10:30:00')
      },

      // Farmers Protest Debate
      {
        debateRoomId: debateRooms[1]._id,
        text: 'Democratic protests are fundamental rights. Farmers feed the nation and deserve to have their voices heard when policies affect their livelihoods.',
        stance: 'for',
        groupId: debateGroups[2]._id,
        author: expertUsers[1]._id,
        authorModel: 'ExpertUser',
        authorName: 'Ritu Kapur',
        likes: [
          { userId: communityUsers[2]._id, userModel: 'CommunityUser' },
          { userId: communityUsers[3]._id, userModel: 'CommunityUser' },
          { userId: normalUsers[1]._id, userModel: 'NormalUser' }
        ],
        createdAt: new Date('2024-01-21T11:30:00')
      },
      {
        debateRoomId: debateRooms[1]._id,
        text: 'Prolonged protests disrupt supply chains and create economic uncertainty. There should be faster dispute resolution mechanisms rather than road blockades.',
        stance: 'against',
        groupId: debateGroups[3]._id,
        author: communityUsers[2]._id,
        authorModel: 'CommunityUser',
        authorName: 'Rohit Agarwal',
        likes: [
          { userId: expertUsers[2]._id, userModel: 'ExpertUser' }
        ],
        createdAt: new Date('2024-01-21T11:45:00')
      },
      {
        debateRoomId: debateRooms[1]._id,
        text: 'Both perspectives are valid. We need institutional reforms that allow farmer concerns to be addressed quickly without economic disruption.',
        stance: 'for',
        groupId: debateGroups[2]._id,
        author: expertUsers[2]._id,
        authorModel: 'ExpertUser',
        authorName: 'Prof. Anand Krishnan',
        likes: [
          { userId: expertUsers[1]._id, userModel: 'ExpertUser' },
          { userId: communityUsers[3]._id, userModel: 'CommunityUser' }
        ],
        createdAt: new Date('2024-01-21T12:15:00')
      },

      // Digital Rupee Debate
      {
        debateRoomId: debateRooms[2]._id,
        text: 'Digital rupee can revolutionize financial inclusion. Rural areas with limited banking can access digital payments easily, reducing dependency on cash.',
        stance: 'for',
        groupId: debateGroups[4]._id,
        author: expertUsers[3]._id,
        authorModel: 'ExpertUser',
        authorName: 'Sanjay Bhat',
        likes: [
          { userId: normalUsers[2]._id, userModel: 'NormalUser' },
          { userId: communityUsers[4]._id, userModel: 'CommunityUser' }
        ],
        createdAt: new Date('2024-01-22T15:00:00')
      },
      {
        debateRoomId: debateRooms[2]._id,
        text: 'My concern is surveillance. Every transaction being tracked by government creates a dystopian scenario. What about financial privacy and personal freedom?',
        stance: 'against',
        groupId: debateGroups[5]._id,
        author: normalUsers[3]._id,
        authorModel: 'NormalUser',
        authorName: 'Sunita Patel',
        likes: [
          { userId: communityUsers[4]._id, userModel: 'CommunityUser' }
        ],
        createdAt: new Date('2024-01-22T15:20:00')
      },
      {
        debateRoomId: debateRooms[2]._id,
        text: 'Privacy protection mechanisms can be built into the system. The benefits of reduced corruption, better tax compliance, and financial inclusion outweigh privacy concerns if implemented correctly.',
        stance: 'for',
        groupId: debateGroups[4]._id,
        author: communityUsers[4]._id,
        authorModel: 'CommunityUser',
        authorName: 'Deepak Joshi',
        likes: [
          { userId: expertUsers[3]._id, userModel: 'ExpertUser' },
          { userId: normalUsers[2]._id, userModel: 'NormalUser' }
        ],
        createdAt: new Date('2024-01-22T15:40:00')
      }
    ]);

    console.log('✅ Database seeded successfully with Indian data!');
    console.log(`Created:
    - ${normalUsers.length} Normal Users
    - ${communityUsers.length} Community Users  
    - ${expertUsers.length} Expert Users
    - ${newsArticles.length} News Articles
    - ${communityComments.length} Community Comments
    - ${expertComments.length} Expert Comments
    - ${debateRooms.length} Debate Rooms
    - ${debateGroups.length} Debate Groups
    - ${debateComments.length} Debate Comments`);

    console.log('\n📝 Sample Login Credentials:');
    console.log('Normal User: rajesh_k / password123');
    console.log('Community User: arjun_reddy / password123');
    console.log('Expert User: dr_suresh / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = seedData;

// Run seed if this file is executed directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('📦 Connected to MongoDB');
    return seedData();
  })
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

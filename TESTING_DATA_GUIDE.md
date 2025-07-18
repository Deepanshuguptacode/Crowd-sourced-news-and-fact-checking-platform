# Testing Guide for Seeded Data

## 🚀 Getting Started

The database has been successfully seeded with realistic Indian data including:
- **15 Users** (6 Normal, 5 Community, 4 Expert users)
- **6 News Articles** with various statuses
- **12 Comments** from community and expert users
- **3 Active Debate Rooms** with ongoing discussions
- **9 Debate Comments** across different topics

## 🔐 Test Login Credentials

### Normal Users
- **Username**: `rajesh_k` | **Password**: `password123`
- **Username**: `priya_sharma` | **Password**: `password123`
- **Username**: `amit_singh` | **Password**: `password123`
- **Username**: `sunita_patel` | **Password**: `password123`
- **Username**: `vikram_yadav` | **Password**: `password123`
- **Username**: `meera_gupta` | **Password**: `password123`

### Community Users  
- **Username**: `arjun_reddy` | **Password**: `password123`
- **Username**: `kavya_iyer` | **Password**: `password123`
- **Username**: `rohit_agarwal` | **Password**: `password123`
- **Username**: `anjali_mishra` | **Password**: `password123`
- **Username**: `deepak_joshi` | **Password**: `password123`

### Expert Users
- **Username**: `dr_suresh` | **Password**: `password123` (Senior Journalist)
- **Username**: `ritu_kapur` | **Password**: `password123` (Political Correspondent)
- **Username**: `prof_anand` | **Password**: `password123` (Professor)
- **Username**: `sanjay_bhat` | **Password**: `password123` (Investigative Journalist)

## 📰 News Articles to Explore

1. **New Metro Line Announced for Bangalore** (Pending status)
2. **Farmers Protest Updates from Punjab** (Verified status)
3. **Mumbai Monsoon Preparedness 2024** (Verified status)
4. **Fake News: Free Vaccine Distribution at Temples** (Fake status)
5. **Chandrayaan-4 Mission Timeline Released** (Pending status)
6. **Digital Rupee Pilot Program Expansion** (Pending status)

## 🗣️ Active Debate Rooms

### 1. Space Program vs Social Welfare
- **Topic**: "Should India Prioritize Space Missions Over Social Welfare?"
- **Participants**: Dr. Suresh Menon, Arjun Reddy, Rajesh Kumar, Kavya Iyer
- **Active Discussion**: Pro and anti space program arguments

### 2. Farmers' Democratic Rights
- **Topic**: "Farmers' Protests: Effective Democracy or Economic Disruption?"
- **Participants**: Ritu Kapur, Rohit Agarwal, Prof. Anand Krishnan, Anjali Mishra, Priya Sharma
- **Active Discussion**: Balancing democratic rights vs economic impact

### 3. Digital Currency Privacy
- **Topic**: "Digital Rupee: Innovation or Privacy Threat?"
- **Participants**: Sanjay Bhat, Sunita Patel, Deepak Joshi, Amit Singh
- **Active Discussion**: Technology benefits vs privacy concerns

## 🧪 Testing Scenarios

### As a Normal User:
1. **Login** as `rajesh_k`
2. **Browse news articles** and see existing comments
3. **View debate rooms** but cannot participate (feature check)
4. **Upload new news** with Indian context

### As a Community User:
1. **Login** as `arjun_reddy`
2. **Comment on news articles** with your opinions
3. **Like/dislike** news articles and comments
4. **Join debate rooms** and participate in discussions
5. **Create new debate rooms** on current topics

### As an Expert User:
1. **Login** as `dr_suresh`
2. **Provide expert comments** on news articles
3. **Verify or mark news as fake** (if admin features exist)
4. **Lead discussions** in debate rooms
5. **Comment with professional perspective**

## 📱 Features to Test

### News Management:
- ✅ Upload news with screenshots
- ✅ Comment on articles
- ✅ Upvote/downvote system
- ✅ Different user role interactions

### Debate System:
- ✅ Create debate rooms
- ✅ Join ongoing debates
- ✅ Comment with stance (for/against)
- ✅ Group comments by position
- ✅ Like debate comments

### User Interactions:
- ✅ Multi-user role system
- ✅ Comment filtering and grouping
- ✅ Real-time debate participation
- ✅ Cross-role interactions

## 🔄 Continuous Testing

You can run these commands to add more data or reset:

```bash
# Add more seed data
node seed-data.js

# Verify current data
node verify-data.js

# Reset and reseed (if needed)
# First clear collections manually, then run seed-data.js
```

## 📊 Expected User Behaviors

The seeded data reflects realistic Indian social media and news patterns:
- **Technology discussions** (Metro, Digital Rupee, Space program)
- **Political debates** (Farmers' protests, Democratic rights)
- **Regional news** (Mumbai, Bangalore, Punjab)
- **Fact-checking scenarios** (Fake vaccine news)
- **Expert vs community perspectives**

## 🎯 Key Test Points

1. **User Authentication**: All roles can login successfully
2. **News Interaction**: Comments, votes, status updates work
3. **Debate Participation**: Multi-user discussions function
4. **Cross-role Features**: Different permissions per user type
5. **Data Persistence**: Actions save and display correctly
6. **Indian Context**: Names, topics, and scenarios feel authentic

Happy Testing! 🚀
